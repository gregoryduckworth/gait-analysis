/**
 * PoseEstimator — wraps MediaPipe Tasks Vision PoseLandmarker for browser-based
 * pose detection on uploaded video files.
 */
const PoseEstimator = (() => {
    const LANDMARK_NAMES = {
        0: "nose",
        11: "left_shoulder", 12: "right_shoulder",
        23: "left_hip", 24: "right_hip",
        25: "left_knee", 26: "right_knee",
        27: "left_ankle", 28: "right_ankle",
        29: "left_heel", 30: "right_heel",
        31: "left_foot_index", 32: "right_foot_index",
    };

    const LANDMARK_INDICES = Object.keys(LANDMARK_NAMES).map(Number);

    const MODEL_URLS = {
        lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
        full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
        heavy: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task",
    };

    let poseLandmarker = null;

    async function init(modelComplexity = "heavy", minDetection = 0.5, minTracking = 0.5) {
        const { PoseLandmarker, FilesetResolver } = await import(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14"
        );

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: MODEL_URLS[modelComplexity] || MODEL_URLS.heavy,
                delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: minDetection,
            minTrackingConfidence: minTracking,
        });

        return poseLandmarker;
    }

    function extractLandmarks(result) {
        const landmarks = {};
        const worldLandmarks = {};

        if (result.landmarks && result.landmarks.length > 0) {
            const lms = result.landmarks[0];
            for (const idx of LANDMARK_INDICES) {
                if (idx < lms.length) {
                    const lm = lms[idx];
                    landmarks[LANDMARK_NAMES[idx]] = {
                        x: lm.x,
                        y: lm.y,
                        z: lm.z,
                        visibility: lm.visibility ?? 1.0,
                    };
                }
            }
        }

        if (result.worldLandmarks && result.worldLandmarks.length > 0) {
            const wlms = result.worldLandmarks[0];
            for (const idx of LANDMARK_INDICES) {
                if (idx < wlms.length) {
                    const wlm = wlms[idx];
                    worldLandmarks[LANDMARK_NAMES[idx]] = {
                        x: wlm.x,
                        y: wlm.y,
                        z: wlm.z,
                        visibility: wlm.visibility ?? 1.0,
                    };
                }
            }
        }

        return { landmarks, worldLandmarks };
    }

    async function processVideo(videoElement, onProgress) {
        if (!poseLandmarker) {
            throw new Error("PoseEstimator not initialized. Call init() first.");
        }

        const fps = await estimateFps(videoElement);
        const duration = videoElement.duration;
        const totalFrames = Math.floor(duration * fps);
        const frameInterval = 1.0 / fps;

        const framePoses = [];
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext("2d");

        videoElement.currentTime = 0;
        await waitForSeek(videoElement);

        let frameNumber = 0;
        let lastTimestampMs = -1;

        while (videoElement.currentTime < duration - frameInterval * 0.5) {
            const actualTimeMs = videoElement.currentTime * 1000;

            // Guard against duplicate frames from imprecise seeks
            if (actualTimeMs <= lastTimestampMs) {
                videoElement.currentTime += frameInterval;
                await waitForSeek(videoElement);
                continue;
            }
            lastTimestampMs = actualTimeMs;

            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const result = poseLandmarker.detectForVideo(canvas, actualTimeMs);
            const { landmarks, worldLandmarks } = extractLandmarks(result);

            framePoses.push({
                frameNumber,
                timestampMs: actualTimeMs,
                landmarks,
                worldLandmarks,
            });

            frameNumber++;
            if (onProgress) {
                onProgress(Math.min(frameNumber / totalFrames, 1));
            }

            videoElement.currentTime += frameInterval;
            await waitForSeek(videoElement);
        }

        const videoInfo = {
            fps,
            totalFrames: framePoses.length,
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
            durationS: duration,
        };

        return { framePoses, videoInfo };
    }

    function estimateFps(videoElement) {
        return new Promise((resolve) => {
            if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
                let count = 0;
                let startTime = null;
                const target = 10;
                let resolved = false;

                const cb = (now, metadata) => {
                    if (resolved) return;
                    if (startTime === null) startTime = metadata.mediaTime;
                    count++;
                    if (count >= target) {
                        resolved = true;
                        const elapsed = metadata.mediaTime - startTime;
                        const fps = elapsed > 0 ? Math.round((count - 1) / elapsed) : 30;
                        videoElement.pause();
                        resolve(Math.min(Math.max(fps, 15), 60));
                        return;
                    }
                    videoElement.requestVideoFrameCallback(cb);
                };

                videoElement.currentTime = 0;
                videoElement.playbackRate = 2;
                videoElement.muted = true;
                videoElement.requestVideoFrameCallback(cb);
                videoElement.play().catch(() => {
                    if (!resolved) { resolved = true; resolve(30); }
                });

                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        videoElement.pause();
                        resolve(30);
                    }
                }, 3000);
            } else {
                resolve(30);
            }
        });
    }

    function waitForSeek(video) {
        return new Promise((resolve) => {
            // If the video hasn't loaded enough data, resolve immediately
            if (video.readyState < 1) {
                const canPlay = () => {
                    video.removeEventListener("canplay", canPlay);
                    resolve();
                };
                video.addEventListener("canplay", canPlay);
                setTimeout(() => {
                    video.removeEventListener("canplay", canPlay);
                    resolve();
                }, 2000);
                return;
            }

            // For a proper seek, wait for the seeked event with a safety timeout
            let settled = false;
            const onSeeked = () => {
                if (settled) return;
                settled = true;
                video.removeEventListener("seeked", onSeeked);
                // Small delay lets the decoder fully render the frame
                setTimeout(resolve, 0);
            };

            video.addEventListener("seeked", onSeeked);

            // Safety timeout — if seeked never fires (e.g. already at target time)
            setTimeout(() => {
                if (!settled) {
                    settled = true;
                    video.removeEventListener("seeked", onSeeked);
                    resolve();
                }
            }, 1000);
        });
    }

    function close() {
        if (poseLandmarker) {
            poseLandmarker.close();
            poseLandmarker = null;
        }
    }

    return { init, processVideo, close, LANDMARK_NAMES, LANDMARK_INDICES };
})();
