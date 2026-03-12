import cv2
import mediapipe as mp
import numpy as np
from dataclasses import dataclass, field


@dataclass
class FramePose:
    frame_number: int
    timestamp_ms: float
    landmarks: dict = field(default_factory=dict)
    world_landmarks: dict = field(default_factory=dict)


LANDMARK_NAMES = {
    0: "nose",
    11: "left_shoulder", 12: "right_shoulder",
    23: "left_hip", 24: "right_hip",
    25: "left_knee", 26: "right_knee",
    27: "left_ankle", 28: "right_ankle",
    29: "left_heel", 30: "right_heel",
    31: "left_foot_index", 32: "right_foot_index",
}

RUNNING_LANDMARKS = list(LANDMARK_NAMES.keys())


class PoseEstimator:
    def __init__(self, model_complexity: int = 2, min_detection_confidence: float = 0.5,
                 min_tracking_confidence: float = 0.5):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def process_video(self, video_path: str, progress_callback=None) -> tuple[list[FramePose], dict]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        video_info = {
            "fps": fps,
            "total_frames": total_frames,
            "width": width,
            "height": height,
            "duration_s": total_frames / fps if fps > 0 else 0,
        }

        frame_poses = []
        frame_number = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)

            frame_pose = FramePose(
                frame_number=frame_number,
                timestamp_ms=(frame_number / fps * 1000) if fps > 0 else 0,
            )

            if results.pose_landmarks:
                for idx in RUNNING_LANDMARKS:
                    lm = results.pose_landmarks.landmark[idx]
                    frame_pose.landmarks[LANDMARK_NAMES[idx]] = {
                        "x": lm.x, "y": lm.y, "z": lm.z,
                        "visibility": lm.visibility,
                    }

            if results.pose_world_landmarks:
                for idx in RUNNING_LANDMARKS:
                    wlm = results.pose_world_landmarks.landmark[idx]
                    frame_pose.world_landmarks[LANDMARK_NAMES[idx]] = {
                        "x": wlm.x, "y": wlm.y, "z": wlm.z,
                        "visibility": wlm.visibility,
                    }

            frame_poses.append(frame_pose)
            frame_number += 1

            if progress_callback and total_frames > 0:
                progress_callback(frame_number / total_frames)

        cap.release()
        return frame_poses, video_info

    def close(self):
        self.pose.close()
