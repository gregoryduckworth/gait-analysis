import cv2
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots


SKELETON_CONNECTIONS = [
    ("left_shoulder", "left_hip"),
    ("right_shoulder", "right_hip"),
    ("left_hip", "left_knee"),
    ("right_hip", "right_knee"),
    ("left_knee", "left_ankle"),
    ("right_knee", "right_ankle"),
    ("left_ankle", "left_heel"),
    ("right_ankle", "right_heel"),
    ("left_ankle", "left_foot_index"),
    ("right_ankle", "right_foot_index"),
    ("left_shoulder", "right_shoulder"),
    ("left_hip", "right_hip"),
]


class Visualizer:
    @staticmethod
    def draw_skeleton_on_frame(frame, landmarks, color=(0, 255, 0), thickness=2):
        h, w = frame.shape[:2]
        overlay = frame.copy()
        points = {}
        for name, lm in landmarks.items():
            if lm["visibility"] >= 0.5:
                px = int(lm["x"] * w)
                py = int(lm["y"] * h)
                points[name] = (px, py)
                cv2.circle(overlay, (px, py), 4, color, -1)
        for a, b in SKELETON_CONNECTIONS:
            if a in points and b in points:
                cv2.line(overlay, points[a], points[b], color, thickness)
        return overlay

    @staticmethod
    def create_annotated_video(video_path, frame_poses, output_path, progress_callback=None):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx < len(frame_poses) and frame_poses[frame_idx].landmarks:
                frame = Visualizer.draw_skeleton_on_frame(
                    frame, frame_poses[frame_idx].landmarks,
                    color=(0, 255, 128), thickness=2,
                )
            out.write(frame)
            frame_idx += 1
            if progress_callback and total > 0:
                progress_callback(frame_idx / total)
        cap.release()
        out.release()
        return output_path

    @staticmethod
    def plot_joint_angles(df, fps):
        if df.empty:
            return None
        df = df.copy()
        if "timestamp_ms" in df.columns:
            df["time_s"] = df["timestamp_ms"] / 1000
        else:
            df["time_s"] = df["frame"] / fps
        angle_columns = [c for c in df.col_data if c.endswith(("_knee",))]
        angle_cols = [c for c in df.columns if c.endswith(("_knee", "_hip", "_ankle"))]
        if not angle_cols:
            return None
        fig = make_subplots(
            rows=3, cols=1,
            subplot_titles=["Knee Angles", "Hip Angles", "Ankle Angles"],
            shared_xaxes=True, vertical_spacing=0.08,
        )
        color_map = {"left": "#636EFA", "right": "#EF553B"}
        for col in angle_cols:
            if "_knee" in col:
                row = 1
            elif "_hip" in col:
                row = 2
            else:
                row = 3
            side = "left" if col.startswith("left") else "right"
            fig.add_trace(
                go.Scatter(x=df["time_s"], y=df[col],
                           name=col.replace("_", " ").title(),
                           line=dict(color=color_map[side], width=1.5),
                           showlegend=True),
                row=row, col=1,
            )
        fig.update_layout(height=700, template="plotly_dark",
                          title_text="Joint Angles Over Time",
                          legend=dict(orientation="h", yanchor="bottom", y=-0.15))
        fig.update_xaxes(title_text="Time (s)", row=3, col=1)
        for r in range(1, 4):
            fig.update_yaxes(title_text="Angle (deg)", row=r, col=1)
        return fig

    @staticmethod
    def plot_step_timing(step_times_left, step_times_right, fps):
        fig = go.Figure()
        if step_times_left:
            fig.add_trace(go.Bar(
                x=list(range(1, len(step_times_left) + 1)),
                y=step_times_left, name="Left Steps", marker_color="#636EFA",
            ))
        if step_times_right:
            fig.add_trace(go.Bar(
                x=list(range(1, len(step_times_right) + 1)),
                y=step_times_right, name="Right Steps", marker_color="#EF553B",
            ))
        fig.update_layout(title="Step Timing Consistency",
                          xaxis_title="Step Number", yaxis_title="Step Duration (s)",
                          template="plotly_dark", barmode="group", height=400)
        return fig

    @staticmethod
    def plot_symmetry_gauge(symmetry_index):
        if symmetry_index < 5:
            color = "#2ecc71"
        elif symmetry_index < 10:
            color = "#f39c12"
        else:
            color = "#e74c3c"
        fig = go.Figure(go.Indicator(
            mode="gauge+number", value=symmetry_index,
            title={"text": "Symmetry Index (%)"},
            number={"suffix": "%"},
            gauge={
                "axis": {"range": [0, 20]},
                "bar": {"color": color},
                "steps": [
                    {"range": [0, 5], "color": "rgba(46,204,113,0.2)"},
                    {"range": [5, 10], "color": "rgba(243,156,18,0.2)"},
                    {"range": [10, 20], "color": "rgba(231,76,60,0.2)"},
                ],
                "threshold": {
                    "line": {"color": "white", "width": 2},
                    "thickness": 0.75, "value": symmetry_index,
                },
            },
        ))
        fig.update_layout(height=300, template="plotly_dark")
        return fig
