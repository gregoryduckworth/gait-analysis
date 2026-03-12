import streamlit as st
import tempfile
import os
import time
from pathlib import Path

st.set_page_config(
    page_title="Running Gait Analyzer",
    page_icon="\U0001f3c3",
    layout="wide",
    initial_sidebar_state="expanded",
)

CUSTOM_CSS = """
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0;
    }
    .sub-header {
        color: #888;
        font-size: 1.1rem;
        margin-top: -10px;
        margin-bottom: 30px;
    }
    .recommendation-box {
        background: #1a1a2e;
        border-left: 4px solid #667eea;
        padding: 12px 16px;
        margin: 8px 0;
        border-radius: 0 8px 8px 0;
    }
    .priority-badge {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 8px;
        vertical-align: middle;
    }
    .tip-card {
        background: #1a1a2e;
        border: 1px solid #333;
        border-radius: 10px;
        padding: 16px 20px;
        margin: 10px 0;
    }
    .tip-card h4 {
        margin-top: 0;
        color: #667eea;
    }
    .tip-frequency {
        color: #888;
        font-size: 0.85rem;
        font-style: italic;
        margin-top: 6px;
    }
    .section-priority {
        border-left: 4px solid #e74c3c;
        padding-left: 12px;
    }
    .section-general {
        border-left: 4px solid #667eea;
        padding-left: 12px;
    }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


def main():
    st.markdown(
        '<p class="main-header">Running Gait Analyzer</p>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p class="sub-header">'
        "Upload a video of your running form for AI-powered gait analysis "
        "&mdash; 100% local processing</p>",
        unsafe_allow_html=True,
    )

    with st.sidebar:
        st.header("Settings")
        model_complexity = st.selectbox(
            "Pose Model Complexity",
            options=[0, 1, 2],
            index=2,
            help="Higher = more accurate but slower. 2 is recommended for gait analysis.",
        )
        min_detection = st.slider("Min Detection Confidence", 0.1, 1.0, 0.5, 0.05)
        min_tracking = st.slider("Min Tracking Confidence", 0.1, 1.0, 0.5, 0.05)
        generate_video = st.checkbox(
            "Generate annotated video",
            value=True,
            help="Creates a video with skeleton overlay",
        )
        st.divider()
        st.markdown("**Tips for best results:**")
        st.markdown(
            "- Film from the side (sagittal plane)\n"
            "- Keep the full body in frame\n"
            "- Use stable camera / tripod\n"
            "- Good lighting helps accuracy\n"
            "- 5-15 seconds of running is ideal"
        )

    uploaded = st.file_uploader(
        "Upload your running video",
        type=["mp4", "mov", "avi", "mkv", "webm"],
        help="Supported formats: MP4, MOV, AVI, MKV, WebM",
    )

    if uploaded is not None:
        col_vid, col_info = st.columns([2, 1])
        with col_vid:
            st.video(uploaded)
        with col_info:
            st.markdown(f"**File:** {uploaded.name}")
            size_mb = uploaded.size / (1024 * 1024)
            st.markdown(f"**Size:** {size_mb:.1f} MB")

        if st.button("Analyze Gait", type="primary", use_container_width=True):
            _run_analysis(
                uploaded, model_complexity, min_detection, min_tracking, generate_video
            )


def _render_improvement_plan(plan):
    """Render the improvement plan in the Streamlit UI."""
    priority_sections = [s for s in plan if s.get("priority")]
    general_sections = [s for s in plan if not s.get("priority")]

    if priority_sections:
        st.markdown("### Your Priority Areas")
        st.markdown(
            "Based on your gait analysis, these areas would benefit most from focused work:"
        )
        for section in priority_sections:
            st.markdown(
                f'<div class="section-priority">'
                f'<h3>{section["title"]} <span class="priority-badge">PRIORITY</span></h3>'
                f"</div>",
                unsafe_allow_html=True,
            )
            for tip in section["tips"]:
                st.markdown(
                    f'<div class="tip-card">'
                    f'<h4>{tip["name"]}</h4>'
                    f'<p>{tip["description"]}</p>'
                    f'<p class="tip-frequency">Frequency: {tip["frequency"]}</p>'
                    f"</div>",
                    unsafe_allow_html=True,
                )
        st.divider()

    st.markdown("### General Improvement Guide")
    st.markdown(
        "These drills and exercises will help any runner improve their form and efficiency:"
    )

    for section in general_sections:
        with st.expander(f"{section['title']}", expanded=False):
            for tip in section["tips"]:
                st.markdown(
                    f'<div class="tip-card">'
                    f'<h4>{tip["name"]}</h4>'
                    f'<p>{tip["description"]}</p>'
                    f'<p class="tip-frequency">Frequency: {tip["frequency"]}</p>'
                    f"</div>",
                    unsafe_allow_html=True,
                )


def _render_weekly_plan(plan):
    """Render a suggested weekly schedule based on the improvement plan."""
    priority_sections = [s for s in plan if s.get("priority")]

    st.markdown("### Suggested Weekly Schedule")
    st.markdown("A sample week integrating these drills with your running:")

    schedule = {
        "Monday": {
            "run": "Easy run (30-45 min)",
            "drills": "Metronome cadence practice during run",
            "strength": "Squats, Romanian Deadlifts, Planks",
        },
        "Tuesday": {
            "run": "Rest or easy cross-training",
            "drills": "Hip flexor stretching, thoracic mobility",
            "strength": "Single-leg work: pistol progressions, single-leg deadlifts",
        },
        "Wednesday": {
            "run": "Tempo run or intervals",
            "drills": "Running drills warm-up (A-skips, B-skips, high knees)",
            "strength": "Core circuit: dead bugs, side planks, bird-dogs",
        },
        "Thursday": {
            "run": "Easy run (30-40 min) + 4-6 strides",
            "drills": "Focus on arm swing and relaxed shoulders",
            "strength": "Calf raises (bent + straight knee), step-ups",
        },
        "Friday": {
            "run": "Rest or gentle yoga/mobility",
            "drills": "Ankle mobility, foam rolling",
            "strength": "Glute activation: bridges, clamshells, monster walks",
        },
        "Saturday": {
            "run": "Long run",
            "drills": "Form check every 10 min (posture, cadence, relaxation)",
            "strength": "None — focus on the run",
        },
        "Sunday": {
            "run": "Rest or very easy recovery jog",
            "drills": "Full stretching routine",
            "strength": "Optional: light bodyweight circuit",
        },
    }

    if priority_sections:
        priority_names = [s["title"] for s in priority_sections]
        st.info(
            f"This schedule has been shaped around your priority areas: "
            f"**{', '.join(priority_names)}**. Adjust based on your fitness level."
        )

    cols = st.columns(7)
    for i, (day, activities) in enumerate(schedule.items()):
        with cols[i]:
            st.markdown(f"**{day}**")
            st.caption(f"Run: {activities['run']}")
            st.caption(f"Drills: {activities['drills']}")
            st.caption(f"Strength: {activities['strength']}")


def _run_analysis(uploaded, model_complexity, min_detection, min_tracking, generate_video):
    from analysis import PoseEstimator, GaitAnalyzer, Visualizer

    with tempfile.TemporaryDirectory() as tmp:
        video_path = os.path.join(tmp, uploaded.name)
        with open(video_path, "wb") as f:
            f.write(uploaded.getbuffer())

        # Pose estimation
        st.subheader("Step 1: Pose Estimation")
        progress1 = st.progress(0, text="Detecting body landmarks...")
        estimator = PoseEstimator(
            model_complexity=model_complexity,
            min_detection_confidence=min_detection,
            min_tracking_confidence=min_tracking,
        )
        t0 = time.time()
        frame_poses, video_info = estimator.process_video(
            video_path,
            progress_callback=lambda p: progress1.progress(
                p, text=f"Processing frames... {p * 100:.0f}%"
            ),
        )
        estimator.close()
        elapsed_pose = time.time() - t0
        progress1.progress(1.0, text="Pose estimation complete!")

        detected = sum(1 for fp in frame_poses if fp.landmarks)
        total_frames = max(video_info["total_frames"], 1)
        pct = detected / total_frames * 100
        st.success(
            f"Processed {video_info['total_frames']} frames in {elapsed_pose:.1f}s "
            f"({video_info['fps']:.0f} fps). "
            f"Landmarks detected in {detected} frames ({pct:.0f}%)"
        )

        # Gait analysis
        st.subheader("Step 2: Gait Analysis")
        with st.spinner("Analyzing gait patterns..."):
            analyzer = GaitAnalyzer(fps=video_info["fps"])
            metrics, angle_df = analyzer.analyze(frame_poses)
            report = analyzer.generate_report(metrics)
            improvement_plan = analyzer.generate_improvement_plan(metrics)

        # Results
        st.subheader("Step 3: Results")
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Cadence", f"{metrics.cadence_spm:.0f} spm")
        with col2:
            st.metric("Stride Time", f"{metrics.avg_stride_time_s:.2f} s")
        with col3:
            st.metric("Trunk Lean", f"{metrics.trunk_lean_avg:.1f} deg")
        with col4:
            st.metric("Symmetry", f"{metrics.symmetry_index:.1f}%")

        tab_charts, tab_report, tab_improve, tab_video = st.tabs(
            ["Charts", "Report & Recommendations", "Improve Your Gait", "Annotated Video"]
        )

        with tab_charts:
            fig_angles = Visualizer.plot_joint_angles(angle_df, video_info["fps"])
            if fig_angles:
                st.plotly_chart(fig_angles, use_container_width=True)
            col_a, col_b = st.columns(2)
            with col_a:
                fig_steps = Visualizer.plot_step_timing(
                    metrics.step_times_left, metrics.step_times_right, video_info["fps"]
                )
                st.plotly_chart(fig_steps, use_container_width=True)
            with col_b:
                fig_sym = Visualizer.plot_symmetry_gauge(metrics.symmetry_index)
                st.plotly_chart(fig_sym, use_container_width=True)

        with tab_report:
            st.markdown("#### Findings")
            for finding in report["findings"]:
                st.markdown(f"- {finding}")
            st.markdown("#### Recommendations")
            for rec in report["recommendations"]:
                st.markdown(
                    f'<div class="recommendation-box">{rec}</div>',
                    unsafe_allow_html=True,
                )

        with tab_improve:
            _render_improvement_plan(improvement_plan)
            st.divider()
            _render_weekly_plan(improvement_plan)

        with tab_video:
            if generate_video:
                st.info("Generating annotated video with skeleton overlay...")
                progress2 = st.progress(0)
                out_path = os.path.join(tmp, "annotated_" + uploaded.name)
                if not out_path.endswith(".mp4"):
                    out_path = out_path.rsplit(".", 1)[0] + ".mp4"
                Visualizer.create_annotated_video(
                    video_path,
                    frame_poses,
                    out_path,
                    progress_callback=lambda p: progress2.progress(p),
                )
                progress2.progress(1.0)
                if os.path.exists(out_path):
                    st.video(out_path)
                    with open(out_path, "rb") as vf:
                        st.download_button(
                            "Download Annotated Video",
                            data=vf.read(),
                            file_name="gait_analysis_" + uploaded.name,
                            mime="video/mp4",
                        )
            else:
                st.info(
                    "Enable 'Generate annotated video' in the sidebar to see the skeleton overlay."
                )


if __name__ == "__main__":
    main()
