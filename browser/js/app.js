/**
 * App — main controller that wires up the UI, video upload, pose estimation,
 * gait analysis, and results rendering.
 */
(function () {
    "use strict";

    // DOM elements
    const uploadZone = document.getElementById("uploadZone");
    const videoInput = document.getElementById("videoInput");
    const videoSection = document.getElementById("videoSection");
    const videoPlayer = document.getElementById("videoPlayer");
    const skeletonCanvas = document.getElementById("skeletonCanvas");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const progressSection = document.getElementById("progressSection");
    const progressBar = document.getElementById("progressBar");
    const progressTitle = document.getElementById("progressTitle");
    const progressText = document.getElementById("progressText");
    const resultsSection = document.getElementById("results-section");
    const summaryAlert = document.getElementById("summaryAlert");
    const showSkeletonCheckbox = document.getElementById("showSkeleton");

    // Sliders
    const minDetectionSlider = document.getElementById("minDetection");
    const minTrackingSlider = document.getElementById("minTracking");
    const minDetectionVal = document.getElementById("minDetectionVal");
    const minTrackingVal = document.getElementById("minTrackingVal");

    minDetectionSlider.addEventListener("input", () => {
        minDetectionVal.textContent = parseFloat(minDetectionSlider.value).toFixed(2);
    });
    minTrackingSlider.addEventListener("input", () => {
        minTrackingVal.textContent = parseFloat(minTrackingSlider.value).toFixed(2);
    });

    // State
    let currentFile = null;
    let framePosesResult = null;
    let videoInfoResult = null;
    let isAnalyzing = false;
    let replayCleanup = null;

    // --- Upload handling ---

    uploadZone.addEventListener("click", () => videoInput.click());
    uploadZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadZone.classList.add("dragover");
    });
    uploadZone.addEventListener("dragleave", () => {
        uploadZone.classList.remove("dragover");
    });
    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadZone.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    videoInput.addEventListener("change", () => {
        if (videoInput.files.length) {
            handleFile(videoInput.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith("video/")) {
            alert("Please upload a video file (MP4, WebM, MOV, AVI, MKV).");
            return;
        }

        currentFile = file;
        const url = URL.createObjectURL(file);
        videoPlayer.src = url;
        videoPlayer.load();

        videoPlayer.addEventListener("loadedmetadata", function onMeta() {
            videoPlayer.removeEventListener("loadedmetadata", onMeta);
            document.getElementById("infoName").textContent = file.name;
            document.getElementById("infoSize").textContent = (file.size / 1024 / 1024).toFixed(1) + " MB";
            document.getElementById("infoDuration").textContent = videoPlayer.duration.toFixed(1) + "s";
            document.getElementById("infoResolution").textContent =
                videoPlayer.videoWidth + " x " + videoPlayer.videoHeight;
            document.getElementById("infoFps").textContent = "Detected during analysis";
        });

        videoSection.classList.add("visible");
        resultsSection.classList.remove("visible");
        Visualizer.destroyCharts();
        if (replayCleanup) { replayCleanup(); replayCleanup = null; }
    }

    // --- Analysis ---

    analyzeBtn.addEventListener("click", async () => {
        if (isAnalyzing || !currentFile) return;
        isAnalyzing = true;
        analyzeBtn.disabled = true;

        try {
            await runAnalysis();
        } catch (err) {
            console.error("Analysis error:", err);
            alert("An error occurred during analysis: " + err.message);
        } finally {
            isAnalyzing = false;
            analyzeBtn.disabled = false;
        }
    });

    async function runAnalysis() {
        progressSection.classList.add("visible");
        resultsSection.classList.remove("visible");
        Visualizer.destroyCharts();
        if (replayCleanup) { replayCleanup(); replayCleanup = null; }

        setProgress(0, "Loading pose model...", "Step 1: Initializing MediaPipe...");
        const modelComplexity = document.getElementById("modelComplexity").value;
        const minDetection = parseFloat(minDetectionSlider.value);
        const minTracking = parseFloat(minTrackingSlider.value);

        await PoseEstimator.init(modelComplexity, minDetection, minTracking);
        setProgress(5, "Pose model loaded!", "Step 1: Pose Estimation");

        setProgress(5, "Processing video frames...", "Step 1: Pose Estimation");
        videoPlayer.pause();
        videoPlayer.muted = true;
        videoPlayer.playbackRate = 1;

        const { framePoses, videoInfo } = await PoseEstimator.processVideo(
            videoPlayer,
            (progress) => {
                const pct = 5 + progress * 70;
                setProgress(pct, `Processing frames... ${(progress * 100).toFixed(0)}%`);
            }
        );

        framePosesResult = framePoses;
        videoInfoResult = videoInfo;

        document.getElementById("infoFps").textContent = videoInfo.fps.toFixed(0);
        PoseEstimator.close();

        const detected = framePoses.filter((fp) => Object.keys(fp.landmarks).length > 0).length;
        const pctDetected = ((detected / Math.max(framePoses.length, 1)) * 100).toFixed(0);

        setProgress(
            80,
            `Processed ${framePoses.length} frames (${videoInfo.fps.toFixed(0)} fps). ` +
            `Landmarks detected in ${detected} frames (${pctDetected}%)`,
            "Step 2: Gait Analysis"
        );

        // analyze() now returns cameraAngle alongside metrics and frameData
        const { metrics, frameData, cameraAngle } = GaitAnalyzer.analyze(framePoses, videoInfo.fps);
        const report = GaitAnalyzer.generateReport(metrics, cameraAngle);
        const improvementPlan = GaitAnalyzer.generateImprovementPlan(metrics);

        setProgress(95, "Rendering results...", "Step 3: Results");

        document.getElementById("metricCadence").textContent = metrics.cadenceSpm.toFixed(0);
        document.getElementById("metricStride").textContent = metrics.avgStrideTimeS.toFixed(2);
        document.getElementById("metricTrunk").textContent = metrics.trunkLeanAvg.toFixed(1);
        document.getElementById("metricSymmetry").textContent = metrics.symmetryIndex.toFixed(1);

        const angleLabel = cameraAngle && cameraAngle.label ? ` | ${cameraAngle.label}` : "";
        summaryAlert.textContent =
            `Processed ${framePoses.length} frames in ${videoInfo.durationS.toFixed(1)}s ` +
            `(${videoInfo.fps.toFixed(0)} fps). Landmarks detected in ${detected} frames (${pctDetected}%).` +
            angleLabel;

        Visualizer.renderCameraAngle(cameraAngle);
        Visualizer.plotJointAngles(frameData, videoInfo.fps);
        Visualizer.plotStepTiming(metrics.stepTimesLeft, metrics.stepTimesRight);
        Visualizer.plotSymmetryGauge(metrics.symmetryIndex);
        Visualizer.renderReport(report);
        Visualizer.renderImprovementPlan(improvementPlan);

        setupSkeletonReplay();

        setProgress(100, "Analysis complete!");
        setTimeout(() => {
            progressSection.classList.remove("visible");
            resultsSection.classList.add("visible");
        }, 500);

        videoPlayer.muted = false;
        videoPlayer.currentTime = 0;
    }

    function setProgress(pct, text, title) {
        progressBar.style.width = Math.min(pct, 100) + "%";
        if (text) progressText.textContent = text;
        if (title) progressTitle.textContent = title;
    }

    // --- Skeleton replay (timestamp-based sync) ---

    function findFrameByTime(timeMs) {
        const poses = framePosesResult;
        if (!poses || poses.length === 0) return -1;

        let lo = 0;
        let hi = poses.length - 1;

        if (timeMs <= poses[0].timestampMs) return 0;
        if (timeMs >= poses[hi].timestampMs) return hi;

        while (lo <= hi) {
            const mid = (lo + hi) >>> 1;
            const midTime = poses[mid].timestampMs;

            if (Math.abs(midTime - timeMs) < 1) return mid;

            if (midTime < timeMs) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }

        if (lo >= poses.length) return hi;
        if (hi < 0) return lo;
        const dLo = Math.abs(poses[lo].timestampMs - timeMs);
        const dHi = Math.abs(poses[hi].timestampMs - timeMs);
        return dLo < dHi ? lo : hi;
    }

    function setupSkeletonReplay() {
        if (!framePosesResult || !videoInfoResult) return;

        skeletonCanvas.width = videoPlayer.videoWidth;
        skeletonCanvas.height = videoPlayer.videoHeight;

        let animFrameId = null;
        let vfcId = null;
        let stopped = false;
        const ctx = skeletonCanvas.getContext("2d");

        function drawForTime(timeMs) {
            if (!showSkeletonCheckbox.checked || !framePosesResult) {
                ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
                return;
            }

            const idx = findFrameByTime(timeMs);
            if (idx >= 0 && idx < framePosesResult.length) {
                Visualizer.drawSkeleton(skeletonCanvas, framePosesResult[idx].landmarks);
            } else {
                ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
            }
        }

        const hasVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

        if (hasVFC) {
            function onVideoFrame(now, metadata) {
                if (stopped) return;
                drawForTime(metadata.mediaTime * 1000);
                vfcId = videoPlayer.requestVideoFrameCallback(onVideoFrame);
            }
            vfcId = videoPlayer.requestVideoFrameCallback(onVideoFrame);
        }

        function rafLoop() {
            if (stopped) return;
            if (!hasVFC || videoPlayer.paused) {
                drawForTime(videoPlayer.currentTime * 1000);
            }
            animFrameId = requestAnimationFrame(rafLoop);
        }
        animFrameId = requestAnimationFrame(rafLoop);

        function onSeeked() {
            if (!stopped) drawForTime(videoPlayer.currentTime * 1000);
        }
        videoPlayer.addEventListener("seeked", onSeeked);

        replayCleanup = () => {
            stopped = true;
            if (animFrameId) cancelAnimationFrame(animFrameId);
            videoPlayer.removeEventListener("seeked", onSeeked);
            ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
        };
    }

    // --- Tab switching ---

    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
        });
    });
})();
