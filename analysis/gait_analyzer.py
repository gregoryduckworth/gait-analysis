import numpy as np
import pandas as pd
from dataclasses import dataclass, field


@dataclass
class GaitMetrics:
    cadence_spm: float = 0.0
    avg_stride_time_s: float = 0.0
    vertical_oscillation_cm: float = 0.0
    ground_contact_ratio: float = 0.0
    avg_knee_angle_stance: dict = field(default_factory=dict)
    avg_knee_angle_swing: dict = field(default_factory=dict)
    avg_hip_angle: dict = field(default_factory=dict)
    avg_ankle_angle: dict = field(default_factory=dict)
    symmetry_index: float = 0.0
    overstriding_score: float = 0.0
    trunk_lean_avg: float = 0.0
    step_times_left: list = field(default_factory=list)
    step_times_right: list = field(default_factory=list)


IMPROVEMENT_TIPS = {
    "cadence": {
        "title": "Cadence & Turnover",
        "icon": "metronome",
        "tips": [
            {
                "name": "Metronome Drills",
                "description": (
                    "Use a metronome app set to your target cadence (start 5% above your current). "
                    "Run for 1-2 minutes matching the beat, then rest. Repeat 4-6 times."
                ),
                "frequency": "2-3x per week during easy runs",
            },
            {
                "name": "Strides",
                "description": (
                    "After an easy run, do 4-6 x 80-100m accelerations focusing on quick, "
                    "light foot turnover. Don't sprint — aim for 90-95% effort with fast feet."
                ),
                "frequency": "2-3x per week after easy runs",
            },
            {
                "name": "Downhill Running",
                "description": (
                    "Run gentle downhill slopes (2-4% grade) to naturally increase your leg turnover "
                    "rate. Your body learns the faster cadence pattern with less effort."
                ),
                "frequency": "1x per week, 4-6 short reps",
            },
        ],
    },
    "symmetry": {
        "title": "Left/Right Balance",
        "icon": "balance",
        "tips": [
            {
                "name": "Single-Leg Deadlifts",
                "description": (
                    "Stand on one leg, hinge at the hips with a flat back, lower a weight toward "
                    "the floor, then return. This builds hip stability and highlights side-to-side "
                    "strength differences."
                ),
                "frequency": "3 sets of 8-10 per leg, 2-3x per week",
            },
            {
                "name": "Single-Leg Squats (Pistol Progressions)",
                "description": (
                    "Start with assisted single-leg squats using a bench or TRX strap. "
                    "Progress to unassisted. Focus on keeping the knee tracking over the toes."
                ),
                "frequency": "3 sets of 6-8 per leg, 2x per week",
            },
            {
                "name": "Single-Leg Calf Raises",
                "description": (
                    "Stand on one foot on a step edge. Rise fully, then lower your heel below "
                    "the step. Compare the strength and endurance of each side."
                ),
                "frequency": "3 sets of 12-15 per leg, 3x per week",
            },
            {
                "name": "Side-Lying Hip Abduction",
                "description": (
                    "Lie on your side with legs straight. Lift the top leg 30-45 degrees, hold "
                    "for 2 seconds, lower slowly. Add an ankle weight to progress."
                ),
                "frequency": "3 sets of 15 per side, 3x per week",
            },
        ],
    },
    "posture": {
        "title": "Trunk Posture & Core",
        "icon": "posture",
        "tips": [
            {
                "name": "Run Tall Cue",
                "description": (
                    "Imagine a string pulling you up from the crown of your head. Keep your chest "
                    "open, shoulders relaxed, and lean slightly forward from the ankles — not the waist."
                ),
                "frequency": "Every run — check in every 5 minutes",
            },
            {
                "name": "Plank Variations",
                "description": (
                    "Hold front plank (30-60s), side plank each side (30-45s), and bird-dog "
                    "(10 per side). These build the core stability needed to maintain posture when fatigued."
                ),
                "frequency": "Daily, 2-3 rounds",
            },
            {
                "name": "Dead Bugs",
                "description": (
                    "Lie on your back, arms extended to ceiling, knees at 90 degrees. Slowly extend "
                    "opposite arm and leg while pressing your lower back into the floor. "
                    "This teaches your core to stabilize during reciprocal limb movement — exactly what running demands."
                ),
                "frequency": "3 sets of 10 per side, daily",
            },
            {
                "name": "Thoracic Spine Mobility",
                "description": (
                    "Foam roll your upper back for 1-2 minutes, then do open-book rotations "
                    "(lying on your side, rotate your top arm and chest open). "
                    "A mobile upper back prevents compensatory hunching."
                ),
                "frequency": "Daily, especially before runs",
            },
        ],
    },
    "vertical_oscillation": {
        "title": "Reduce Bouncing",
        "icon": "bounce",
        "tips": [
            {
                "name": "Low Ceiling Visualization",
                "description": (
                    "Imagine running in a room with a very low ceiling. Focus on pushing "
                    "forward rather than upward. Your head should stay at a relatively consistent height."
                ),
                "frequency": "Every run — mental cue",
            },
            {
                "name": "Glute Activation Drills",
                "description": (
                    "Before running, do glute bridges (3x15), clamshells (3x12 per side), and "
                    "monster walks with a resistance band. Strong glutes drive you forward, not up."
                ),
                "frequency": "Pre-run activation, 3-4x per week",
            },
            {
                "name": "Hill Sprints",
                "description": (
                    "Short (8-12 second) hill sprints naturally teach your body to drive forward. "
                    "The incline forces horizontal propulsion. Walk back down for full recovery."
                ),
                "frequency": "6-8 reps, 1-2x per week",
            },
        ],
    },
    "overstriding": {
        "title": "Fix Overstriding",
        "icon": "footstrike",
        "tips": [
            {
                "name": "Increase Cadence Gradually",
                "description": (
                    "The easiest fix for overstriding is shorter, quicker steps. Increase your "
                    "cadence by 5% and your foot will naturally land closer to your center of mass."
                ),
                "frequency": "Focus on this during 2-3 runs per week",
            },
            {
                "name": "Wall Drill",
                "description": (
                    "Lean against a wall at 45 degrees with arms extended. Drive one knee up, "
                    "then switch rapidly. This teaches proper knee drive and foot placement "
                    "under the hips rather than out in front."
                ),
                "frequency": "3 sets of 20 switches, 3x per week",
            },
            {
                "name": "Barefoot Strides on Grass",
                "description": (
                    "Remove your shoes and do short (50-80m) strides on soft grass. "
                    "Without cushioned shoes, your body naturally avoids heel-striking and overstriding "
                    "because it hurts. This rewires your motor patterns."
                ),
                "frequency": "4-6 strides, 1-2x per week",
            },
            {
                "name": "A-Skip Drill",
                "description": (
                    "Skip forward driving one knee up sharply while keeping the support leg straight. "
                    "Focus on landing with your foot directly under your hip. "
                    "This reinforces proper foot placement timing."
                ),
                "frequency": "3 x 30m each leg, during warm-up",
            },
        ],
    },
    "general": {
        "title": "General Running Form",
        "icon": "running",
        "tips": [
            {
                "name": "Arms at 90 Degrees",
                "description": (
                    "Keep your elbows bent at roughly 90 degrees. Swing arms forward and back "
                    "(not across your body). Relaxed hands — imagine holding a crisp you don't want to crush."
                ),
                "frequency": "Every run — check in regularly",
            },
            {
                "name": "Relaxed Shoulders",
                "description": (
                    "Every 10 minutes during a run, do a quick shoulder check: shrug them up to "
                    "your ears, then let them drop completely. Tension in the shoulders wastes energy "
                    "and restricts arm swing."
                ),
                "frequency": "Every run",
            },
            {
                "name": "Hip Flexor Stretching",
                "description": (
                    "Tight hip flexors limit hip extension and shorten your stride. "
                    "Do a kneeling lunge stretch (hold 30-60s per side) and couch stretch daily. "
                    "This is especially important if you sit at a desk."
                ),
                "frequency": "Daily, hold each stretch 30-60 seconds",
            },
            {
                "name": "Ankle Mobility Work",
                "description": (
                    "Stand facing a wall, one foot forward. Push your knee past your toes toward "
                    "the wall while keeping your heel down. Good ankle dorsiflexion helps with proper "
                    "foot strike and push-off mechanics."
                ),
                "frequency": "3 sets of 10 per side, daily",
            },
            {
                "name": "Progressive Running Drills Warm-Up",
                "description": (
                    "Before harder sessions, do high knees, butt kicks, A-skips, B-skips, "
                    "and carioca for 30m each. These prime your neuromuscular system for efficient form."
                ),
                "frequency": "Before every quality session",
            },
        ],
    },
    "strength": {
        "title": "Strength for Runners",
        "icon": "strength",
        "tips": [
            {
                "name": "Squats",
                "description": (
                    "The foundation of running strength. Start with bodyweight, progress to "
                    "goblet squats, then barbell back/front squats. Focus on depth (thighs parallel) "
                    "and control."
                ),
                "frequency": "3 sets of 8-12, 2x per week",
            },
            {
                "name": "Romanian Deadlifts",
                "description": (
                    "Strengthens the posterior chain (hamstrings, glutes, lower back) — "
                    "the primary propulsion muscles in running. Keep a flat back, hinge at the hips, "
                    "feel the stretch in your hamstrings."
                ),
                "frequency": "3 sets of 8-10, 2x per week",
            },
            {
                "name": "Step-Ups",
                "description": (
                    "Use a box or bench at knee height. Step up driving through the heel, "
                    "fully extend at the top, lower with control. Mimics the single-leg demands of running."
                ),
                "frequency": "3 sets of 10 per leg, 2x per week",
            },
            {
                "name": "Calf Raises (Bent & Straight Knee)",
                "description": (
                    "Straight-knee calf raises target the gastrocnemius; bent-knee targets the soleus. "
                    "Both are critical for push-off power and Achilles tendon resilience."
                ),
                "frequency": "3 sets of 15 each variation, 3x per week",
            },
        ],
    },
}


class GaitAnalyzer:
    def __init__(self, fps: float):
        self.fps = fps

    @staticmethod
    def _angle_between(a, b, c):
        ba = a - b
        bc = c - b
        cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
        return np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))

    @staticmethod
    def _point(landmarks, name):
        if name not in landmarks or landmarks[name]["visibility"] < 0.5:
            return None
        lm = landmarks[name]
        return np.array([lm["x"], lm["y"], lm["z"]])

    def _compute_joint_angles(self, landmarks):
        angles = {}
        for side in ["left", "right"]:
            hip = self._point(landmarks, f"{side}_hip")
            knee = self._point(landmarks, f"{side}_knee")
            ankle = self._point(landmarks, f"{side}_ankle")
            shoulder = self._point(landmarks, f"{side}_shoulder")
            foot = self._point(landmarks, f"{side}_foot_index")
            if hip is not None and knee is not None and ankle is not None:
                angles[f"{side}_knee"] = self._angle_between(hip, knee, ankle)
            if shoulder is not None and hip is not None and knee is not None:
                angles[f"{side}_hip"] = self._angle_between(shoulder, hip, knee)
            if knee is not None and ankle is not None and foot is not None:
                angles[f"{side}_ankle"] = self._angle_between(knee, ankle, foot)
        return angles

    def _detect_foot_strikes(self, frame_poses):
        left_y, right_y = [], []
        for fp in frame_poses:
            la = self._point(fp.landmarks, "left_ankle")
            ra = self._point(fp.landmarks, "right_ankle")
            left_y.append(la[1] if la is not None else np.nan)
            right_y.append(ra[1] if ra is not None else np.nan)
        return self._find_peaks(np.array(left_y)), self._find_peaks(np.array(right_y))

    @staticmethod
    def _find_peaks(signal, window=5):
        valid = ~np.isnan(signal)
        if valid.sum() < window * 2:
            return []
        smoothed = np.copy(signal)
        kernel = np.ones(window) / window
        vi = np.where(valid)[0]
        if len(vi) > window:
            smoothed[vi] = np.convolve(signal[vi], kernel, mode="same")[:len(vi)]
        peaks = []
        for i in range(window, len(smoothed) - window):
            if np.isnan(smoothed[i]):
                continue
            local_region = smoothed[max(0, i - window):i + window + 1]
            if not np.isnan(local_region).all() and smoothed[i] == np.nanmax(local_region):
                if not peaks or (i - peaks[-1]) > window:
                    peaks.append(i)
        return peaks

    def _compute_vertical_oscillation(self, frame_poses):
        nose_y = []
        for fp in frame_poses:
            pt = self._point(fp.landmarks, "nose")
            if pt is not None:
                nose_y.append(pt[1])
        if len(nose_y) < 10:
            return 0.0
        arr = np.array(nose_y)
        smoothed = np.convolve(arr, np.ones(5) / 5, mode="valid")
        return (np.max(smoothed) - np.min(smoothed)) * 100

    def _compute_trunk_lean(self, frame_poses):
        angles = []
        for fp in frame_poses:
            pts = [self._point(fp.landmarks, n)
                   for n in ("left_shoulder", "right_shoulder", "left_hip", "right_hip")]
            if any(p is None for p in pts):
                continue
            mid_s = (pts[0] + pts[1]) / 2
            mid_h = (pts[2] + pts[3]) / 2
            trunk = mid_s - mid_h
            vert = np.array([0, -1, 0])
            cos_a = np.dot(trunk, vert) / (np.linalg.norm(trunk) + 1e-8)
            angles.append(np.degrees(np.arccos(np.clip(cos_a, -1.0, 1.0))))
        return angles

    def _compute_overstriding(self, frame_poses, strikes, side):
        count, total = 0, 0
        for sf in strikes:
            if sf >= len(frame_poses):
                continue
            fp = frame_poses[sf]
            ankle = self._point(fp.landmarks, f"{side}_ankle")
            knee = self._point(fp.landmarks, f"{side}_knee")
            hip = self._point(fp.landmarks, f"{side}_hip")
            if ankle is not None and knee is not None and hip is not None:
                total += 1
                if abs(ankle[1] - hip[1]) > abs(knee[1] - hip[1]):
                    count += 1
        return (count / total * 100) if total > 0 else 0.0

    def analyze(self, frame_poses):
        metrics = GaitMetrics()
        left_strikes, right_strikes = self._detect_foot_strikes(frame_poses)

        if len(left_strikes) > 1:
            metrics.step_times_left = (np.diff(left_strikes) / self.fps).tolist()
        if len(right_strikes) > 1:
            metrics.step_times_right = (np.diff(right_strikes) / self.fps).tolist()

        all_intervals = metrics.step_times_left + metrics.step_times_right
        if all_intervals:
            avg = np.mean(all_intervals)
            metrics.avg_stride_time_s = avg * 2
            metrics.cadence_spm = 60.0 / avg if avg > 0 else 0

        if metrics.step_times_left and metrics.step_times_right:
            al = np.mean(metrics.step_times_left)
            ar = np.mean(metrics.step_times_right)
            d = (al + ar) / 2
            metrics.symmetry_index = abs(al - ar) / d * 100 if d > 0 else 0

        buckets = {k: [] for k in ("left_knee", "right_knee", "left_hip",
                                    "right_hip", "left_ankle", "right_ankle")}
        frame_data = []
        for fp in frame_poses:
            if not fp.landmarks:
                continue
            angles = self._compute_joint_angles(fp.landmarks)
            row = {"frame": fp.frame_number, "timestamp_ms": fp.timestamp_ms}
            row.update(angles)
            frame_data.append(row)
            for k in buckets:
                if k in angles:
                    buckets[k].append(angles[k])

        for side in ("left", "right"):
            if buckets[f"{side}_knee"]:
                metrics.avg_knee_angle_stance[side] = float(np.mean(buckets[f"{side}_knee"]))
            if buckets[f"{side}_hip"]:
                metrics.avg_hip_angle[side] = float(np.mean(buckets[f"{side}_hip"]))
            if buckets[f"{side}_ankle"]:
                metrics.avg_ankle_angle[side] = float(np.mean(buckets[f"{side}_ankle"]))

        metrics.vertical_oscillation_cm = self._compute_vertical_oscillation(frame_poses)
        trunk = self._compute_trunk_lean(frame_poses)
        if trunk:
            metrics.trunk_lean_avg = float(np.mean(trunk))
        lo = self._compute_overstriding(frame_poses, left_strikes, "left")
        ro = self._compute_overstriding(frame_poses, right_strikes, "right")
        metrics.overstriding_score = (lo + ro) / 2

        df = pd.DataFrame(frame_data) if frame_data else pd.DataFrame()
        return metrics, df

    def generate_report(self, metrics):
        findings, recs = [], []

        if metrics.cadence_spm > 0:
            findings.append(f"Cadence: {metrics.cadence_spm:.0f} steps/min")
            if metrics.cadence_spm < 160:
                recs.append("Your cadence is below the typical range (160-180 spm). "
                            "Try shorter, quicker steps to reduce impact forces.")
            elif metrics.cadence_spm > 190:
                recs.append("Your cadence is above typical range. Fine for sprinting, "
                            "but for distance running consider a slightly lower cadence.")
            else:
                recs.append("Your cadence is within a healthy range.")

        if metrics.symmetry_index > 0:
            findings.append(f"Left/Right Symmetry Index: {metrics.symmetry_index:.1f}%")
            if metrics.symmetry_index > 10:
                recs.append("Significant asymmetry detected between left and right sides. "
                            "This could indicate muscle imbalance or injury compensation.")
            elif metrics.symmetry_index > 5:
                recs.append("Mild asymmetry detected. Consider single-leg strength exercises.")
            else:
                recs.append("Good bilateral symmetry.")

        if metrics.trunk_lean_avg > 0:
            findings.append(f"Average Trunk Lean: {metrics.trunk_lean_avg:.1f} degrees")
            if metrics.trunk_lean_avg > 15:
                recs.append("Excessive forward lean detected. Focus on running tall.")
            elif metrics.trunk_lean_avg < 3:
                recs.append("Very upright posture. A slight forward lean (5-10 deg) "
                            "from the ankles can improve running economy.")
            else:
                recs.append("Good trunk posture.")

        if metrics.vertical_oscillation_cm > 0:
            findings.append(f"Vertical Oscillation: {metrics.vertical_oscillation_cm:.1f} (relative units)")
            if metrics.vertical_oscillation_cm > 10:
                recs.append("High vertical oscillation detected. Focus on driving forward "
                            "rather than upward.")

        for side in ("left", "right"):
            if side in metrics.avg_knee_angle_stance:
                findings.append(f"Avg {side.title()} Knee Angle: "
                                f"{metrics.avg_knee_angle_stance[side]:.1f} deg")
            if side in metrics.avg_hip_angle:
                findings.append(f"Avg {side.title()} Hip Angle: "
                                f"{metrics.avg_hip_angle[side]:.1f} deg")

        if metrics.overstriding_score > 50:
            recs.append("Potential overstriding detected. Aim to land with your foot "
                        "under your center of mass to reduce braking forces.")

        return {"findings": findings, "recommendations": recs}

    def generate_improvement_plan(self, metrics):
        """Build a personalised improvement plan based on detected issues."""
        priority_categories = []
        all_categories = []

        if metrics.cadence_spm > 0 and (metrics.cadence_spm < 160 or metrics.cadence_spm > 190):
            priority_categories.append("cadence")
        if metrics.symmetry_index > 5:
            priority_categories.append("symmetry")
        if metrics.trunk_lean_avg > 15 or metrics.trunk_lean_avg < 3:
            priority_categories.append("posture")
        if metrics.vertical_oscillation_cm > 10:
            priority_categories.append("vertical_oscillation")
        if metrics.overstriding_score > 50:
            priority_categories.append("overstriding")

        for cat in priority_categories:
            if cat in IMPROVEMENT_TIPS:
                all_categories.append({
                    "priority": True,
                    **IMPROVEMENT_TIPS[cat],
                })

        for key in ("general", "strength"):
            all_categories.append({
                "priority": False,
                **IMPROVEMENT_TIPS[key],
            })

        remaining = set(IMPROVEMENT_TIPS.keys()) - set(priority_categories) - {"general", "strength"}
        for key in remaining:
            all_categories.append({
                "priority": False,
                **IMPROVEMENT_TIPS[key],
            })

        return all_categories
