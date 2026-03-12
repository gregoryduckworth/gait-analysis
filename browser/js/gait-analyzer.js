/**
 * GaitAnalyzer — computes gait metrics from pose landmarks.
 * Includes automatic camera angle detection and metric confidence filtering.
 */
const GaitAnalyzer = (() => {

    // Camera view classifications
    const VIEW = {
        SAGITTAL: "sagittal",      // Side-on view
        CORONAL: "coronal",        // Front or back view
        DIAGONAL: "diagonal",      // Angled view
        UNKNOWN: "unknown",
    };

    // Which metrics are reliable per view
    const METRIC_CONFIDENCE = {
        [VIEW.SAGITTAL]: {
            reliable: ["cadence", "stride_time", "knee_angles", "hip_angles", "ankle_angles",
                        "trunk_lean", "vertical_oscillation", "overstriding"],
            unreliable: ["symmetry"],
            notes: "Side-on view detected. Joint angle measurements are most accurate from this angle.",
        },
        [VIEW.CORONAL]: {
            reliable: ["cadence", "stride_time", "symmetry", "vertical_oscillation"],
            unreliable: ["knee_angles", "hip_angles", "ankle_angles", "overstriding"],
            notes: "Front/back view detected. Joint angles appear compressed from this angle and are less reliable. " +
                   "Symmetry and cadence measurements are accurate. For joint angle analysis, try filming from the side.",
        },
        [VIEW.DIAGONAL]: {
            reliable: ["cadence", "stride_time", "vertical_oscillation", "trunk_lean"],
            partial: ["knee_angles", "hip_angles", "ankle_angles", "symmetry", "overstriding"],
            unreliable: [],
            notes: "Diagonal view detected. Most metrics have reasonable accuracy. " +
                   "For best results on joint angles, film directly from the side. For symmetry, film from front or back.",
        },
        [VIEW.UNKNOWN]: {
            reliable: ["cadence", "stride_time"],
            partial: ["knee_angles", "hip_angles", "ankle_angles", "symmetry",
                       "trunk_lean", "vertical_oscillation", "overstriding"],
            unreliable: [],
            notes: "Could not confidently determine camera angle. All metrics are shown but accuracy may vary.",
        },
    };

    function createMetrics() {
        return {
            cadenceSpm: 0,
            avgStrideTimeS: 0,
            verticalOscillationCm: 0,
            avgKneeAngleStance: {},
            avgHipAngle: {},
            avgAnkleAngle: {},
            symmetryIndex: 0,
            overstridingScore: 0,
            trunkLeanAvg: 0,
            stepTimesLeft: [],
            stepTimesRight: [],
        };
    }

    function point(landmarks, name) {
        const lm = landmarks[name];
        if (!lm || (lm.visibility ?? 0) < 0.5) return null;
        return [lm.x, lm.y, lm.z];
    }

    function angleBetween(a, b, c) {
        const ba = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        const bc = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
        const dot = ba[0] * bc[0] + ba[1] * bc[1] + ba[2] * bc[2];
        const magBa = Math.sqrt(ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2);
        const magBc = Math.sqrt(bc[0] ** 2 + bc[1] ** 2 + bc[2] ** 2);
        const cosine = dot / (magBa * magBc + 1e-8);
        return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
    }

    function computeJointAngles(landmarks) {
        const angles = {};
        for (const side of ["left", "right"]) {
            const hip = point(landmarks, `${side}_hip`);
            const knee = point(landmarks, `${side}_knee`);
            const ankle = point(landmarks, `${side}_ankle`);
            const shoulder = point(landmarks, `${side}_shoulder`);
            const foot = point(landmarks, `${side}_foot_index`);

            if (hip && knee && ankle) {
                angles[`${side}_knee`] = angleBetween(hip, knee, ankle);
            }
            if (shoulder && hip && knee) {
                angles[`${side}_hip`] = angleBetween(shoulder, hip, knee);
            }
            if (knee && ankle && foot) {
                angles[`${side}_ankle`] = angleBetween(knee, ankle, foot);
            }
        }
        return angles;
    }

    function findPeaks(signal, window = 5) {
        const valid = signal.map((v) => !isNaN(v));
        const validCount = valid.filter(Boolean).length;
        if (validCount < window * 2) return [];

        const smoothed = [...signal];
        const kernel = Array(window).fill(1 / window);
        const validIndices = [];
        signal.forEach((v, i) => { if (!isNaN(v)) validIndices.push(i); });

        if (validIndices.length > window) {
            const validSignal = validIndices.map((i) => signal[i]);
            const convolved = convolve(validSignal, kernel);
            validIndices.forEach((idx, j) => {
                if (j < convolved.length) smoothed[idx] = convolved[j];
            });
        }

        const peaks = [];
        for (let i = window; i < smoothed.length - window; i++) {
            if (isNaN(smoothed[i])) continue;
            const localRegion = smoothed.slice(Math.max(0, i - window), i + window + 1);
            const validLocal = localRegion.filter((v) => !isNaN(v));
            if (validLocal.length === 0) continue;
            const localMax = Math.max(...validLocal);
            if (smoothed[i] === localMax) {
                if (peaks.length === 0 || i - peaks[peaks.length - 1] > window) {
                    peaks.push(i);
                }
            }
        }
        return peaks;
    }

    function convolve(signal, kernel) {
        const result = [];
        const kHalf = Math.floor(kernel.length / 2);
        for (let i = 0; i < signal.length; i++) {
            let sum = 0;
            let count = 0;
            for (let j = 0; j < kernel.length; j++) {
                const idx = i + j - kHalf;
                if (idx >= 0 && idx < signal.length) {
                    sum += signal[idx] * kernel[j];
                    count += kernel[j];
                }
            }
            result.push(count > 0 ? sum / count * kernel.length : signal[i]);
        }
        return result;
    }

    function detectFootStrikes(framePoses) {
        const leftY = [];
        const rightY = [];
        for (const fp of framePoses) {
            const la = point(fp.landmarks, "left_ankle");
            const ra = point(fp.landmarks, "right_ankle");
            leftY.push(la ? la[1] : NaN);
            rightY.push(ra ? ra[1] : NaN);
        }
        return {
            left: findPeaks(leftY),
            right: findPeaks(rightY),
        };
    }

    function computeVerticalOscillation(framePoses) {
        const noseY = [];
        for (const fp of framePoses) {
            const n = point(fp.landmarks, "nose");
            if (n) noseY.push(n[1]);
        }
        if (noseY.length < 10) return 0;
        const kernel = Array(5).fill(1 / 5);
        const smoothed = convolve(noseY, kernel);
        return (Math.max(...smoothed) - Math.min(...smoothed)) * 100;
    }

    function computeTrunkLean(framePoses) {
        const angles = [];
        for (const fp of framePoses) {
            const ls = point(fp.landmarks, "left_shoulder");
            const rs = point(fp.landmarks, "right_shoulder");
            const lh = point(fp.landmarks, "left_hip");
            const rh = point(fp.landmarks, "right_hip");
            if (!ls || !rs || !lh || !rh) continue;

            const midS = [(ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2, (ls[2] + rs[2]) / 2];
            const midH = [(lh[0] + rh[0]) / 2, (lh[1] + rh[1]) / 2, (lh[2] + rh[2]) / 2];
            const trunk = [midS[0] - midH[0], midS[1] - midH[1], midS[2] - midH[2]];
            const vert = [0, -1, 0];
            const dot = trunk[0] * vert[0] + trunk[1] * vert[1] + trunk[2] * vert[2];
            const mag = Math.sqrt(trunk[0] ** 2 + trunk[1] ** 2 + trunk[2] ** 2) + 1e-8;
            const cosA = Math.max(-1, Math.min(1, dot / mag));
            angles.push((Math.acos(cosA) * 180) / Math.PI);
        }
        return angles;
    }

    function computeOverstriding(framePoses, strikes, side) {
        let count = 0;
        let total = 0;
        for (const sf of strikes) {
            if (sf >= framePoses.length) continue;
            const fp = framePoses[sf];
            const ankle = point(fp.landmarks, `${side}_ankle`);
            const knee = point(fp.landmarks, `${side}_knee`);
            const hip = point(fp.landmarks, `${side}_hip`);
            if (ankle && knee && hip) {
                total++;
                if (Math.abs(ankle[1] - hip[1]) > Math.abs(knee[1] - hip[1])) {
                    count++;
                }
            }
        }
        return total > 0 ? (count / total) * 100 : 0;
    }

    function mean(arr) {
        if (!arr.length) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function median(arr) {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function diff(arr) {
        const result = [];
        for (let i = 1; i < arr.length; i++) {
            result.push(arr[i] - arr[i - 1]);
        }
        return result;
    }

    /**
     * Detect camera angle by analyzing the horizontal spread of left vs right
     * landmarks across all frames. A side-on (sagittal) view will have the left
     * and right hips/shoulders nearly overlapping in x. A front/back (coronal) view
     * will have them spread wide apart.
     */
    function detectCameraAngle(framePoses) {
        const hipSpreads = [];
        const shoulderSpreads = [];

        for (const fp of framePoses) {
            if (!fp.landmarks || Object.keys(fp.landmarks).length === 0) continue;

            const lh = point(fp.landmarks, "left_hip");
            const rh = point(fp.landmarks, "right_hip");
            const ls = point(fp.landmarks, "left_shoulder");
            const rs = point(fp.landmarks, "right_shoulder");

            if (lh && rh) {
                hipSpreads.push(Math.abs(lh[0] - rh[0]));
            }
            if (ls && rs) {
                shoulderSpreads.push(Math.abs(ls[0] - rs[0]));
            }
        }

        if (hipSpreads.length < 5 && shoulderSpreads.length < 5) {
            return {
                view: VIEW.UNKNOWN,
                confidence: 0,
                hipSpreadMedian: 0,
                shoulderSpreadMedian: 0,
                ...METRIC_CONFIDENCE[VIEW.UNKNOWN],
            };
        }

        const hipMedian = hipSpreads.length ? median(hipSpreads) : 0;
        const shoulderMedian = shoulderSpreads.length ? median(shoulderSpreads) : 0;
        const avgSpread = (hipMedian + shoulderMedian) / 2;

        // Thresholds for normalized coordinates (0-1 range)
        // Side-on: left/right landmarks overlap, spread < ~0.04
        // Front/back: landmarks spread apart, spread > ~0.12
        // Diagonal: in between
        const SAGITTAL_THRESHOLD = 0.05;
        const CORONAL_THRESHOLD = 0.11;

        let view;
        let confidence;
        let label;

        if (avgSpread < SAGITTAL_THRESHOLD) {
            view = VIEW.SAGITTAL;
            confidence = Math.min(1, (SAGITTAL_THRESHOLD - avgSpread) / SAGITTAL_THRESHOLD);
            label = "Side view (sagittal)";
        } else if (avgSpread > CORONAL_THRESHOLD) {
            view = VIEW.CORONAL;
            confidence = Math.min(1, (avgSpread - CORONAL_THRESHOLD) / (0.25 - CORONAL_THRESHOLD));
            label = "Front/back view (coronal)";
        } else {
            view = VIEW.DIAGONAL;
            const midpoint = (SAGITTAL_THRESHOLD + CORONAL_THRESHOLD) / 2;
            confidence = 1 - Math.abs(avgSpread - midpoint) / (CORONAL_THRESHOLD - SAGITTAL_THRESHOLD);
            label = "Diagonal view";
        }

        return {
            view,
            label,
            confidence: Math.max(0, Math.min(1, confidence)),
            hipSpreadMedian: hipMedian,
            shoulderSpreadMedian: shoulderMedian,
            avgSpread,
            ...METRIC_CONFIDENCE[view],
        };
    }

    function analyze(framePoses, fps) {
        const metrics = createMetrics();
        const cameraAngle = detectCameraAngle(framePoses);
        const { left: leftStrikes, right: rightStrikes } = detectFootStrikes(framePoses);

        if (leftStrikes.length > 1) {
            metrics.stepTimesLeft = diff(leftStrikes).map((d) => d / fps);
        }
        if (rightStrikes.length > 1) {
            metrics.stepTimesRight = diff(rightStrikes).map((d) => d / fps);
        }

        const allIntervals = [...metrics.stepTimesLeft, ...metrics.stepTimesRight];
        if (allIntervals.length) {
            const avg = mean(allIntervals);
            metrics.avgStrideTimeS = avg * 2;
            metrics.cadenceSpm = avg > 0 ? 60 / avg : 0;
        }

        if (metrics.stepTimesLeft.length && metrics.stepTimesRight.length) {
            const al = mean(metrics.stepTimesLeft);
            const ar = mean(metrics.stepTimesRight);
            const d = (al + ar) / 2;
            metrics.symmetryIndex = d > 0 ? (Math.abs(al - ar) / d) * 100 : 0;
        }

        const buckets = {
            left_knee: [], right_knee: [],
            left_hip: [], right_hip: [],
            left_ankle: [], right_ankle: [],
        };
        const frameData = [];

        for (const fp of framePoses) {
            if (!fp.landmarks || Object.keys(fp.landmarks).length === 0) continue;
            const angles = computeJointAngles(fp.landmarks);
            const row = { frame: fp.frameNumber, timestampMs: fp.timestampMs, ...angles };
            frameData.push(row);
            for (const k of Object.keys(buckets)) {
                if (k in angles) buckets[k].push(angles[k]);
            }
        }

        for (const side of ["left", "right"]) {
            if (buckets[`${side}_knee`].length)
                metrics.avgKneeAngleStance[side] = mean(buckets[`${side}_knee`]);
            if (buckets[`${side}_hip`].length)
                metrics.avgHipAngle[side] = mean(buckets[`${side}_hip`]);
            if (buckets[`${side}_ankle`].length)
                metrics.avgAnkleAngle[side] = mean(buckets[`${side}_ankle`]);
        }

        metrics.verticalOscillationCm = computeVerticalOscillation(framePoses);
        const trunk = computeTrunkLean(framePoses);
        if (trunk.length) metrics.trunkLeanAvg = mean(trunk);

        const lo = computeOverstriding(framePoses, leftStrikes, "left");
        const ro = computeOverstriding(framePoses, rightStrikes, "right");
        metrics.overstridingScore = (lo + ro) / 2;

        return { metrics, frameData, cameraAngle };
    }

    function generateReport(metrics, cameraAngle) {
        const findings = [];
        const recommendations = [];
        const warnings = [];

        const reliable = new Set(cameraAngle?.reliable || []);
        const unreliable = new Set(cameraAngle?.unreliable || []);
        const partial = new Set(cameraAngle?.partial || []);

        function confidenceTag(metricKey) {
            if (unreliable.has(metricKey)) return " \u26a0\ufe0f unreliable from this angle";
            if (partial.has(metricKey)) return " \u2139\ufe0f reduced accuracy from this angle";
            return "";
        }

        // Camera angle finding
        if (cameraAngle && cameraAngle.view !== VIEW.UNKNOWN) {
            findings.unshift(
                `Camera Angle: ${cameraAngle.label} (${(cameraAngle.confidence * 100).toFixed(0)}% confidence)`
            );
        }

        if (metrics.cadenceSpm > 0) {
            findings.push(`Cadence: ${metrics.cadenceSpm.toFixed(0)} steps/min`);
            if (metrics.cadenceSpm < 160) {
                recommendations.push(
                    "Your cadence is below the typical range (160-180 spm). " +
                    "Try shorter, quicker steps to reduce impact forces."
                );
            } else if (metrics.cadenceSpm > 190) {
                recommendations.push(
                    "Your cadence is above typical range. Fine for sprinting, " +
                    "but for distance running consider a slightly lower cadence."
                );
            } else {
                recommendations.push("Your cadence is within a healthy range.");
            }
        }

        if (metrics.symmetryIndex > 0) {
            const tag = confidenceTag("symmetry");
            findings.push(`Left/Right Symmetry Index: ${metrics.symmetryIndex.toFixed(1)}%${tag}`);
            if (!unreliable.has("symmetry")) {
                if (metrics.symmetryIndex > 10) {
                    recommendations.push(
                        "Significant asymmetry detected between left and right sides. " +
                        "This could indicate muscle imbalance or injury compensation."
                    );
                } else if (metrics.symmetryIndex > 5) {
                    recommendations.push("Mild asymmetry detected. Consider single-leg strength exercises.");
                } else {
                    recommendations.push("Good bilateral symmetry.");
                }
            } else {
                warnings.push(
                    "Symmetry measurement is unreliable from a side-on camera. " +
                    "For accurate symmetry analysis, film from the front or back."
                );
            }
        }

        if (metrics.trunkLeanAvg > 0) {
            const tag = confidenceTag("trunk_lean");
            findings.push(`Average Trunk Lean: ${metrics.trunkLeanAvg.toFixed(1)} degrees${tag}`);
            if (!unreliable.has("trunk_lean")) {
                if (metrics.trunkLeanAvg > 15) {
                    recommendations.push("Excessive forward lean detected. Focus on running tall.");
                } else if (metrics.trunkLeanAvg < 3) {
                    recommendations.push(
                        "Very upright posture. A slight forward lean (5-10 deg) " +
                        "from the ankles can improve running economy."
                    );
                } else {
                    recommendations.push("Good trunk posture.");
                }
            }
        }

        if (metrics.verticalOscillationCm > 0) {
            findings.push(`Vertical Oscillation: ${metrics.verticalOscillationCm.toFixed(1)} (relative units)`);
            if (metrics.verticalOscillationCm > 10) {
                recommendations.push(
                    "High vertical oscillation detected. Focus on driving forward rather than upward."
                );
            }
        }

        for (const side of ["left", "right"]) {
            const label = side.charAt(0).toUpperCase() + side.slice(1);
            const tag = confidenceTag("knee_angles");
            if (side in metrics.avgKneeAngleStance)
                findings.push(`Avg ${label} Knee Angle: ${metrics.avgKneeAngleStance[side].toFixed(1)} deg${tag}`);
            const hipTag = confidenceTag("hip_angles");
            if (side in metrics.avgHipAngle)
                findings.push(`Avg ${label} Hip Angle: ${metrics.avgHipAngle[side].toFixed(1)} deg${hipTag}`);
        }

        if (metrics.overstridingScore > 50 && !unreliable.has("overstriding")) {
            recommendations.push(
                "Potential overstriding detected. Aim to land with your foot " +
                "under your center of mass to reduce braking forces."
            );
        }

        // Add angle-specific filming suggestions
        if (cameraAngle) {
            if (cameraAngle.view === VIEW.CORONAL) {
                warnings.push(
                    "For detailed joint angle analysis (knee, hip, ankle), try re-filming " +
                    "from the side. Side-on views give the most accurate biomechanical measurements."
                );
            } else if (cameraAngle.view === VIEW.SAGITTAL) {
                warnings.push(
                    "For left/right symmetry analysis, try re-filming from the front or back. " +
                    "Side-on views only capture one side clearly."
                );
            }
        }

        return { findings, recommendations, warnings };
    }

    function generateImprovementPlan(metrics) {
        const priorityCategories = [];

        if (metrics.cadenceSpm > 0 && (metrics.cadenceSpm < 160 || metrics.cadenceSpm > 190)) {
            priorityCategories.push("cadence");
        }
        if (metrics.symmetryIndex > 5) priorityCategories.push("symmetry");
        if (metrics.trunkLeanAvg > 15 || metrics.trunkLeanAvg < 3) {
            priorityCategories.push("posture");
        }
        if (metrics.verticalOscillationCm > 10) priorityCategories.push("vertical_oscillation");
        if (metrics.overstridingScore > 50) priorityCategories.push("overstriding");

        const plan = [];

        for (const cat of priorityCategories) {
            if (ImprovementTips[cat]) {
                plan.push({ priority: true, ...ImprovementTips[cat] });
            }
        }

        for (const key of ["general", "strength"]) {
            plan.push({ priority: false, ...ImprovementTips[key] });
        }

        const remaining = Object.keys(ImprovementTips).filter(
            (k) => !priorityCategories.includes(k) && k !== "general" && k !== "strength"
        );
        for (const key of remaining) {
            plan.push({ priority: false, ...ImprovementTips[key] });
        }

        return plan;
    }

    return { analyze, generateReport, generateImprovementPlan, VIEW };
})();
