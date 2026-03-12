/**
 * ImprovementTips — structured data for gait improvement recommendations.
 */
const ImprovementTips = {
    cadence: {
        title: "Cadence & Turnover",
        tips: [
            {
                name: "Metronome Drills",
                description:
                    "Use a metronome app set to your target cadence (start 5% above your current). " +
                    "Run for 1-2 minutes matching the beat, then rest. Repeat 4-6 times.",
                frequency: "2-3x per week during easy runs",
            },
            {
                name: "Strides",
                description:
                    "After an easy run, do 4-6 x 80-100m accelerations focusing on quick, " +
                    "light foot turnover. Don't sprint \u2014 aim for 90-95% effort with fast feet.",
                frequency: "2-3x per week after easy runs",
            },
            {
                name: "Downhill Running",
                description:
                    "Run gentle downhill slopes (2-4% grade) to naturally increase your leg turnover " +
                    "rate. Your body learns the faster cadence pattern with less effort.",
                frequency: "1x per week, 4-6 short reps",
            },
        ],
    },
    symmetry: {
        title: "Left/Right Balance",
        tips: [
            {
                name: "Single-Leg Deadlifts",
                description:
                    "Stand on one leg, hinge at the hips with a flat back, lower a weight toward " +
                    "the floor, then return. Builds hip stability and highlights side-to-side " +
                    "strength differences.",
                frequency: "3 sets of 8-10 per leg, 2-3x per week",
            },
            {
                name: "Single-Leg Squats (Pistol Progressions)",
                description:
                    "Start with assisted single-leg squats using a bench or TRX strap. " +
                    "Progress to unassisted. Focus on keeping the knee tracking over the toes.",
                frequency: "3 sets of 6-8 per leg, 2x per week",
            },
            {
                name: "Single-Leg Calf Raises",
                description:
                    "Stand on one foot on a step edge. Rise fully, then lower your heel below " +
                    "the step. Compare the strength and endurance of each side.",
                frequency: "3 sets of 12-15 per leg, 3x per week",
            },
            {
                name: "Side-Lying Hip Abduction",
                description:
                    "Lie on your side with legs straight. Lift the top leg 30-45 degrees, hold " +
                    "for 2 seconds, lower slowly. Add an ankle weight to progress.",
                frequency: "3 sets of 15 per side, 3x per week",
            },
        ],
    },
    posture: {
        title: "Trunk Posture & Core",
        tips: [
            {
                name: "Run Tall Cue",
                description:
                    "Imagine a string pulling you up from the crown of your head. Keep your chest " +
                    "open, shoulders relaxed, and lean slightly forward from the ankles \u2014 not the waist.",
                frequency: "Every run \u2014 check in every 5 minutes",
            },
            {
                name: "Plank Variations",
                description:
                    "Hold front plank (30-60s), side plank each side (30-45s), and bird-dog " +
                    "(10 per side). These build the core stability needed to maintain posture when fatigued.",
                frequency: "Daily, 2-3 rounds",
            },
            {
                name: "Dead Bugs",
                description:
                    "Lie on your back, arms extended to ceiling, knees at 90 degrees. Slowly extend " +
                    "opposite arm and leg while pressing your lower back into the floor. " +
                    "This teaches your core to stabilize during reciprocal limb movement.",
                frequency: "3 sets of 10 per side, daily",
            },
            {
                name: "Thoracic Spine Mobility",
                description:
                    "Foam roll your upper back for 1-2 minutes, then do open-book rotations " +
                    "(lying on your side, rotate your top arm and chest open). " +
                    "A mobile upper back prevents compensatory hunching.",
                frequency: "Daily, especially before runs",
            },
        ],
    },
    vertical_oscillation: {
        title: "Reduce Bouncing",
        tips: [
            {
                name: "Low Ceiling Visualization",
                description:
                    "Imagine running in a room with a very low ceiling. Focus on pushing " +
                    "forward rather than upward. Your head should stay at a relatively consistent height.",
                frequency: "Every run \u2014 mental cue",
            },
            {
                name: "Glute Activation Drills",
                description:
                    "Before running, do glute bridges (3x15), clamshells (3x12 per side), and " +
                    "monster walks with a resistance band. Strong glutes drive you forward, not up.",
                frequency: "Pre-run activation, 3-4x per week",
            },
            {
                name: "Hill Sprints",
                description:
                    "Short (8-12 second) hill sprints naturally teach your body to drive forward. " +
                    "The incline forces horizontal propulsion. Walk back down for full recovery.",
                frequency: "6-8 reps, 1-2x per week",
            },
        ],
    },
    overstriding: {
        title: "Fix Overstriding",
        tips: [
            {
                name: "Increase Cadence Gradually",
                description:
                    "The easiest fix for overstriding is shorter, quicker steps. Increase your " +
                    "cadence by 5% and your foot will naturally land closer to your center of mass.",
                frequency: "Focus on this during 2-3 runs per week",
            },
            {
                name: "Wall Drill",
                description:
                    "Lean against a wall at 45 degrees with arms extended. Drive one knee up, " +
                    "then switch rapidly. This teaches proper knee drive and foot placement " +
                    "under the hips rather than out in front.",
                frequency: "3 sets of 20 switches, 3x per week",
            },
            {
                name: "Barefoot Strides on Grass",
                description:
                    "Remove your shoes and do short (50-80m) strides on soft grass. " +
                    "Without cushioned shoes, your body naturally avoids heel-striking and overstriding. " +
                    "This rewires your motor patterns.",
                frequency: "4-6 strides, 1-2x per week",
            },
            {
                name: "A-Skip Drill",
                description:
                    "Skip forward driving one knee up sharply while keeping the support leg straight. " +
                    "Focus on landing with your foot directly under your hip. " +
                    "This reinforces proper foot placement timing.",
                frequency: "3 x 30m each leg, during warm-up",
            },
        ],
    },
    general: {
        title: "General Running Form",
        tips: [
            {
                name: "Arms at 90 Degrees",
                description:
                    "Keep your elbows bent at roughly 90 degrees. Swing arms forward and back " +
                    "(not across your body). Relaxed hands \u2014 imagine holding a crisp you don't want to crush.",
                frequency: "Every run \u2014 check in regularly",
            },
            {
                name: "Relaxed Shoulders",
                description:
                    "Every 10 minutes during a run, do a quick shoulder check: shrug them up to " +
                    "your ears, then let them drop completely. Tension in the shoulders wastes energy " +
                    "and restricts arm swing.",
                frequency: "Every run",
            },
            {
                name: "Hip Flexor Stretching",
                description:
                    "Tight hip flexors limit hip extension and shorten your stride. " +
                    "Do a kneeling lunge stretch (hold 30-60s per side) and couch stretch daily. " +
                    "This is especially important if you sit at a desk.",
                frequency: "Daily, hold each stretch 30-60 seconds",
            },
            {
                name: "Ankle Mobility Work",
                description:
                    "Stand facing a wall, one foot forward. Push your knee past your toes toward " +
                    "the wall while keeping your heel down. Good ankle dorsiflexion helps with proper " +
                    "foot strike and push-off mechanics.",
                frequency: "3 sets of 10 per side, daily",
            },
            {
                name: "Progressive Running Drills Warm-Up",
                description:
                    "Before harder sessions, do high knees, butt kicks, A-skips, B-skips, " +
                    "and carioca for 30m each. These prime your neuromuscular system for efficient form.",
                frequency: "Before every quality session",
            },
        ],
    },
    strength: {
        title: "Strength for Runners",
        tips: [
            {
                name: "Squats",
                description:
                    "The foundation of running strength. Start with bodyweight, progress to " +
                    "goblet squats, then barbell back/front squats. Focus on depth (thighs parallel) " +
                    "and control.",
                frequency: "3 sets of 8-12, 2x per week",
            },
            {
                name: "Romanian Deadlifts",
                description:
                    "Strengthens the posterior chain (hamstrings, glutes, lower back) \u2014 " +
                    "the primary propulsion muscles in running. Keep a flat back, hinge at the hips.",
                frequency: "3 sets of 8-10, 2x per week",
            },
            {
                name: "Step-Ups",
                description:
                    "Use a box or bench at knee height. Step up driving through the heel, " +
                    "fully extend at the top, lower with control. Mimics the single-leg demands of running.",
                frequency: "3 sets of 10 per leg, 2x per week",
            },
            {
                name: "Calf Raises (Bent & Straight Knee)",
                description:
                    "Straight-knee calf raises target the gastrocnemius; bent-knee targets the soleus. " +
                    "Both are critical for push-off power and Achilles tendon resilience.",
                frequency: "3 sets of 15 each variation, 3x per week",
            },
        ],
    },
};
