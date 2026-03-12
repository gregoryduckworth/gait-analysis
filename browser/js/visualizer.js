/**
 * Visualizer — Canvas skeleton overlay, camera angle display, and Chart.js chart rendering.
 */
const Visualizer = (() => {
    const SKELETON_CONNECTIONS = [
        ["left_shoulder", "left_hip"],
        ["right_shoulder", "right_hip"],
        ["left_hip", "left_knee"],
        ["right_hip", "right_knee"],
        ["left_knee", "left_ankle"],
        ["right_knee", "right_ankle"],
        ["left_ankle", "left_heel"],
        ["right_ankle", "right_heel"],
        ["left_ankle", "left_foot_index"],
        ["right_ankle", "right_foot_index"],
        ["left_shoulder", "right_shoulder"],
        ["left_hip", "right_hip"],
    ];

    const LEFT_COLOR = "rgba(99, 110, 250, 0.9)";
    const RIGHT_COLOR = "rgba(239, 85, 59, 0.9)";
    const JOINT_COLOR = "rgba(0, 255, 128, 0.9)";
    const BONE_COLOR = "rgba(0, 255, 128, 0.7)";

    let chartInstances = {};

    const VIEW_CONFIG = {
        sagittal:  { icon: "\ud83d\udcf7", label: "Side View", css: "sagittal" },
        coronal:   { icon: "\ud83d\udcf7", label: "Front/Back View", css: "coronal" },
        diagonal:  { icon: "\ud83d\udcf7", label: "Diagonal View", css: "diagonal" },
        unknown:   { icon: "\u2753", label: "Unknown Angle", css: "unknown" },
    };

    const METRIC_DISPLAY_NAMES = {
        cadence: "Cadence",
        stride_time: "Stride Time",
        knee_angles: "Knee Angles",
        hip_angles: "Hip Angles",
        ankle_angles: "Ankle Angles",
        trunk_lean: "Trunk Lean",
        vertical_oscillation: "Vertical Osc.",
        overstriding: "Overstriding",
        symmetry: "Symmetry",
    };

    // Maps metric keys to the dot element IDs on metric cards
    const METRIC_DOT_MAP = {
        cadence: "dotCadence",
        stride_time: "dotStride",
        trunk_lean: "dotTrunk",
        symmetry: "dotSymmetry",
    };

    function drawSkeleton(canvas, landmarks) {
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (!landmarks || Object.keys(landmarks).length === 0) return;

        const points = {};
        for (const [name, lm] of Object.entries(landmarks)) {
            if ((lm.visibility ?? 0) >= 0.5) {
                points[name] = { x: lm.x * w, y: lm.y * h };
            }
        }

        ctx.lineWidth = 3;
        ctx.strokeStyle = BONE_COLOR;
        for (const [a, b] of SKELETON_CONNECTIONS) {
            if (points[a] && points[b]) {
                ctx.beginPath();
                ctx.moveTo(points[a].x, points[a].y);
                ctx.lineTo(points[b].x, points[b].y);
                ctx.stroke();
            }
        }

        for (const [name, pt] of Object.entries(points)) {
            let color = JOINT_COLOR;
            if (name.startsWith("left_")) color = LEFT_COLOR;
            else if (name.startsWith("right_")) color = RIGHT_COLOR;

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    function destroyCharts() {
        for (const key of Object.keys(chartInstances)) {
            if (chartInstances[key]) {
                chartInstances[key].destroy();
                delete chartInstances[key];
            }
        }
    }

    function createChart(canvasId, config) {
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }
        const ctx = document.getElementById(canvasId).getContext("2d");
        chartInstances[canvasId] = new Chart(ctx, config);
        return chartInstances[canvasId];
    }

    const CHART_DEFAULTS = {
        responsive: true,
        plugins: {
            legend: { labels: { color: "#e0e0e0" } },
        },
        scales: {
            x: { ticks: { color: "#888" }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "#888" }, grid: { color: "rgba(255,255,255,0.05)" } },
        },
    };

    function plotJointAngles(frameData, fps) {
        if (!frameData.length) return;

        const times = frameData.map((r) => (r.timestampMs / 1000).toFixed(2));

        const makeDataset = (key, label, color) => {
            const data = frameData.map((r) => r[key] ?? null);
            if (data.every((v) => v === null)) return null;
            return {
                label,
                data,
                borderColor: color,
                backgroundColor: color.replace("0.9", "0.1"),
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.3,
                fill: false,
            };
        };

        const kneeDatasets = [
            makeDataset("left_knee", "Left Knee", LEFT_COLOR),
            makeDataset("right_knee", "Right Knee", RIGHT_COLOR),
        ].filter(Boolean);

        if (kneeDatasets.length) {
            createChart("kneeChart", {
                type: "line",
                data: { labels: times, datasets: kneeDatasets },
                options: {
                    ...CHART_DEFAULTS,
                    plugins: {
                        ...CHART_DEFAULTS.plugins,
                        title: { display: true, text: "Knee Angles Over Time", color: "#e0e0e0" },
                    },
                    scales: {
                        ...CHART_DEFAULTS.scales,
                        x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: "Time (s)", color: "#888" } },
                        y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: "Angle (deg)", color: "#888" } },
                    },
                },
            });
        }

        const hipDatasets = [
            makeDataset("left_hip", "Left Hip", LEFT_COLOR),
            makeDataset("right_hip", "Right Hip", RIGHT_COLOR),
        ].filter(Boolean);

        if (hipDatasets.length) {
            createChart("hipChart", {
                type: "line",
                data: { labels: times, datasets: hipDatasets },
                options: {
                    ...CHART_DEFAULTS,
                    plugins: {
                        ...CHART_DEFAULTS.plugins,
                        title: { display: true, text: "Hip Angles Over Time", color: "#e0e0e0" },
                    },
                    scales: {
                        ...CHART_DEFAULTS.scales,
                        x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: "Time (s)", color: "#888" } },
                        y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: "Angle (deg)", color: "#888" } },
                    },
                },
            });
        }

        const ankleDatasets = [
            makeDataset("left_ankle", "Left Ankle", LEFT_COLOR),
            makeDataset("right_ankle", "Right Ankle", RIGHT_COLOR),
        ].filter(Boolean);

        if (ankleDatasets.length) {
            createChart("ankleChart", {
                type: "line",
                data: { labels: times, datasets: ankleDatasets },
                options: {
                    ...CHART_DEFAULTS,
                    plugins: {
                        ...CHART_DEFAULTS.plugins,
                        title: { display: true, text: "Ankle Angles Over Time", color: "#e0e0e0" },
                    },
                    scales: {
                        ...CHART_DEFAULTS.scales,
                        x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: "Time (s)", color: "#888" } },
                        y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: "Angle (deg)", color: "#888" } },
                    },
                },
            });
        }
    }

    function plotStepTiming(stepTimesLeft, stepTimesRight) {
        const maxLen = Math.max(stepTimesLeft.length, stepTimesRight.length);
        if (maxLen === 0) return;

        const labels = Array.from({ length: maxLen }, (_, i) => `Step ${i + 1}`);
        const datasets = [];

        if (stepTimesLeft.length) {
            datasets.push({
                label: "Left Steps",
                data: stepTimesLeft,
                backgroundColor: LEFT_COLOR,
                borderRadius: 4,
            });
        }
        if (stepTimesRight.length) {
            datasets.push({
                label: "Right Steps",
                data: stepTimesRight,
                backgroundColor: RIGHT_COLOR,
                borderRadius: 4,
            });
        }

        createChart("stepChart", {
            type: "bar",
            data: { labels, datasets },
            options: {
                ...CHART_DEFAULTS,
                plugins: {
                    ...CHART_DEFAULTS.plugins,
                    title: { display: true, text: "Step Timing Consistency", color: "#e0e0e0" },
                },
                scales: {
                    ...CHART_DEFAULTS.scales,
                    y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: "Duration (s)", color: "#888" } },
                },
            },
        });
    }

    function plotSymmetryGauge(symmetryIndex) {
        const color =
            symmetryIndex < 5 ? "#2ecc71" : symmetryIndex < 10 ? "#f39c12" : "#e74c3c";

        const data = {
            labels: ["Symmetry Index", "Remaining"],
            datasets: [
                {
                    data: [Math.min(symmetryIndex, 20), Math.max(0, 20 - symmetryIndex)],
                    backgroundColor: [color, "rgba(255,255,255,0.05)"],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                },
            ],
        };

        createChart("symmetryChart", {
            type: "doughnut",
            data,
            options: {
                responsive: true,
                cutout: "75%",
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: "Symmetry Index", color: "#e0e0e0" },
                    tooltip: { enabled: false },
                },
            },
            plugins: [
                {
                    id: "symmetryText",
                    afterDraw(chart) {
                        const { ctx, width, height } = chart;
                        ctx.save();
                        ctx.font = "bold 28px sans-serif";
                        ctx.fillStyle = color;
                        ctx.textAlign = "center";
                        ctx.fillText(`${symmetryIndex.toFixed(1)}%`, width / 2, height - 20);
                        ctx.font = "14px sans-serif";
                        ctx.fillStyle = "#888";
                        const label =
                            symmetryIndex < 5 ? "Good" : symmetryIndex < 10 ? "Mild" : "Significant";
                        ctx.fillText(label, width / 2, height);
                        ctx.restore();
                    },
                },
            ],
        });
    }

    function renderCameraAngle(cameraAngle) {
        const banner = document.getElementById("cameraAngleBanner");
        const badge = document.getElementById("angleBadge");
        const iconEl = document.getElementById("angleIcon");
        const labelEl = document.getElementById("angleLabel");
        const confPct = document.getElementById("angleConfPct");
        const confBar = document.getElementById("angleConfBar");
        const noteEl = document.getElementById("angleNote");
        const reliabilityEl = document.getElementById("metricReliability");

        if (!cameraAngle) {
            banner.classList.remove("visible");
            return;
        }

        const viewCfg = VIEW_CONFIG[cameraAngle.view] || VIEW_CONFIG.unknown;

        badge.className = `angle-badge ${viewCfg.css}`;
        iconEl.textContent = viewCfg.icon;
        labelEl.textContent = cameraAngle.label || viewCfg.label;
        confPct.textContent = `${(cameraAngle.confidence * 100).toFixed(0)}%`;
        confBar.style.width = `${(cameraAngle.confidence * 100).toFixed(0)}%`;
        noteEl.textContent = cameraAngle.notes || "";

        // Color confidence bar based on view type
        const barColors = { sagittal: "var(--success)", coronal: "var(--accent)", diagonal: "var(--warning)", unknown: "var(--text-secondary)" };
        confBar.style.background = barColors[cameraAngle.view] || barColors.unknown;

        // Render reliability tags
        let tagsHtml = "";
        if (cameraAngle.reliable) {
            for (const m of cameraAngle.reliable) {
                const name = METRIC_DISPLAY_NAMES[m] || m;
                tagsHtml += `<span class="reliability-tag reliable">\u2713 ${name}</span>`;
            }
        }
        if (cameraAngle.partial) {
            for (const m of cameraAngle.partial) {
                const name = METRIC_DISPLAY_NAMES[m] || m;
                tagsHtml += `<span class="reliability-tag partial">\u223c ${name}</span>`;
            }
        }
        if (cameraAngle.unreliable) {
            for (const m of cameraAngle.unreliable) {
                const name = METRIC_DISPLAY_NAMES[m] || m;
                tagsHtml += `<span class="reliability-tag unreliable">\u2717 ${name}</span>`;
            }
        }
        reliabilityEl.innerHTML = tagsHtml;

        // Update metric card confidence dots
        const reliableSet = new Set(cameraAngle.reliable || []);
        const partialSet = new Set(cameraAngle.partial || []);
        const unreliableSet = new Set(cameraAngle.unreliable || []);

        for (const [metricKey, dotId] of Object.entries(METRIC_DOT_MAP)) {
            const dot = document.getElementById(dotId);
            if (!dot) continue;

            dot.className = "metric-confidence-dot";
            if (unreliableSet.has(metricKey)) {
                dot.classList.add("unreliable");
                dot.title = "Unreliable from this angle";
            } else if (partialSet.has(metricKey)) {
                dot.classList.add("partial");
                dot.title = "Reduced accuracy";
            } else {
                dot.classList.add("reliable");
                dot.title = "Reliable";
            }
        }

        banner.classList.add("visible");
    }

    function renderReport(report) {
        const findingsEl = document.getElementById("findingsContainer");
        const recsEl = document.getElementById("recommendationsContainer");
        const warningsEl = document.getElementById("warningsContainer");

        findingsEl.innerHTML = report.findings
            .map((f) => `<div class="finding-item">${f}</div>`)
            .join("");

        recsEl.innerHTML = report.recommendations
            .map((r) => `<div class="recommendation-box">${r}</div>`)
            .join("");

        if (report.warnings && report.warnings.length) {
            warningsEl.innerHTML = report.warnings
                .map((w) => `<div class="warning-box">\u26a0\ufe0f ${w}</div>`)
                .join("");
        } else {
            warningsEl.innerHTML = "";
        }
    }

    function renderImprovementPlan(plan) {
        const container = document.getElementById("improvementContainer");
        let html = "";

        const prioritySections = plan.filter((s) => s.priority);
        const generalSections = plan.filter((s) => !s.priority);

        if (prioritySections.length) {
            html += '<h3 style="margin-bottom:8px;">Your Priority Areas</h3>';
            html += '<p style="color:#888;margin-bottom:16px;">Based on your gait analysis, these areas would benefit most from focused work:</p>';

            for (const section of prioritySections) {
                html += `<div class="section-header priority">${section.title} <span class="priority-badge">PRIORITY</span></div>`;
                for (const tip of section.tips) {
                    html += `<div class="tip-card">
                        <h4>${tip.name}</h4>
                        <p>${tip.description}</p>
                        <p class="tip-frequency">Frequency: ${tip.frequency}</p>
                    </div>`;
                }
            }
            html += '<hr style="border-color:#333;margin:24px 0;">';
        }

        html += '<h3 style="margin-bottom:16px;">General Improvement Guide</h3>';
        html += '<p style="color:#888;margin-bottom:16px;">These drills and exercises will help any runner improve their form and efficiency:</p>';

        for (const section of generalSections) {
            html += `<div class="expander" onclick="this.classList.toggle('open')">
                <div class="expander-header">
                    ${section.title}
                    <span class="expander-arrow">&#9660;</span>
                </div>
                <div class="expander-body">`;
            for (const tip of section.tips) {
                html += `<div class="tip-card">
                    <h4>${tip.name}</h4>
                    <p>${tip.description}</p>
                    <p class="tip-frequency">Frequency: ${tip.frequency}</p>
                </div>`;
            }
            html += "</div></div>";
        }

        html += '<hr style="border-color:#333;margin:24px 0;">';
        html += '<h3 style="margin-bottom:16px;">Suggested Weekly Schedule</h3>';

        if (prioritySections.length) {
            const names = prioritySections.map((s) => s.title).join(", ");
            html += `<div class="alert alert-info" style="margin-bottom:16px;">
                This schedule is shaped around your priority areas: <strong>${names}</strong>.
                Adjust based on your fitness level.
            </div>`;
        }

        const schedule = [
            { day: "Monday", run: "Easy run (30-45 min)", drills: "Metronome cadence practice", strength: "Squats, RDLs, Planks" },
            { day: "Tuesday", run: "Rest or cross-training", drills: "Hip flexor stretching, mobility", strength: "Single-leg work" },
            { day: "Wednesday", run: "Tempo or intervals", drills: "A-skips, B-skips, high knees", strength: "Core circuit" },
            { day: "Thursday", run: "Easy run + strides", drills: "Arm swing, shoulder relaxation", strength: "Calf raises, step-ups" },
            { day: "Friday", run: "Rest or gentle yoga", drills: "Ankle mobility, foam rolling", strength: "Glute activation" },
            { day: "Saturday", run: "Long run", drills: "Form check every 10 min", strength: "Focus on the run" },
            { day: "Sunday", run: "Rest or recovery jog", drills: "Full stretching routine", strength: "Optional light circuit" },
        ];

        html += '<div class="schedule-grid">';
        for (const s of schedule) {
            html += `<div class="schedule-day">
                <h4>${s.day}</h4>
                <div class="schedule-item"><strong>Run:</strong> ${s.run}</div>
                <div class="schedule-item"><strong>Drills:</strong> ${s.drills}</div>
                <div class="schedule-item"><strong>Strength:</strong> ${s.strength}</div>
            </div>`;
        }
        html += "</div>";

        container.innerHTML = html;
    }

    return {
        drawSkeleton,
        destroyCharts,
        plotJointAngles,
        plotStepTiming,
        plotSymmetryGauge,
        renderCameraAngle,
        renderReport,
        renderImprovementPlan,
    };
})();
