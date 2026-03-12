# Running Gait Analyzer

A local, AI-powered gait analysis tool that uses computer vision to analyze your running form from video. Runs entirely in your browser — no installation required.

## Features

- **Video Upload** — supports MP4, MOV, AVI, MKV, WebM
- **Pose Estimation** — MediaPipe BlazePose detects 13 key body landmarks per frame
- **Gait Metrics** — cadence, stride time, joint angles, trunk lean, vertical oscillation, symmetry index
- **Overstriding Detection** — flags if your foot lands too far ahead of your center of mass
- **Interactive Charts** — visualizations of joint angles over time and step timing consistency
- **Skeleton Replay** — real-time skeleton overlay synced to your video playback
- **Personalized Recommendations** — actionable tips based on your specific analysis results
- **Improve Your Gait** — comprehensive improvement program with drills, exercises, and a suggested weekly schedule tailored to your detected issues
- **100% Local** — all processing runs in your browser, no data leaves your computer

## Quick Start

```bash
cd gait-analysis/browser
python3 -m http.server 8080
```

Open `http://localhost:8080` in Chrome. The `python3 -m http.server` command just serves the static files — all actual processing happens client-side in your browser via WebAssembly.

## Tips for Best Results

- Film from the **side** (sagittal plane) for the most accurate joint angle measurements
- Keep your **full body in frame** throughout the clip
- Use a **stable camera** or tripod
- Good lighting improves landmark detection
- **5-15 seconds** of steady running is ideal

## How It Works

1. **Pose Estimation** — MediaPipe BlazePose processes each frame to extract 2D/3D body landmarks
2. **Foot Strike Detection** — ankle position peaks identify ground contact events
3. **Joint Angle Computation** — knee, hip, and ankle angles computed via 3D vector math
4. **Gait Metrics** — cadence, stride time, symmetry, trunk lean, vertical oscillation
5. **Report Generation** — findings compared against biomechanics norms to produce recommendations
6. **Improvement Plan** — priority areas identified from your metrics, matched with targeted drills, strength exercises, and a weekly schedule

## Project Structure

```
gait-analysis/browser/
  index.html            # Full UI
  js/
    app.js              # Main controller
    pose-estimator.js   # MediaPipe WASM wrapper
    gait-analyzer.js    # Gait analysis engine
    visualizer.js       # Chart.js charts + Canvas overlay
    improvement-tips.js # Drills, exercises, and tips data
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| UI | HTML / CSS / vanilla JS |
| Pose Estimation | MediaPipe Tasks Vision (WASM) |
| Video Processing | Canvas API |
| Visualization | Chart.js |
| Server | None — fully client-side |
