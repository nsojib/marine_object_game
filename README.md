# NOMaD Explorer 3D

A 3D browser game for **active marine exploration and object recognition**.

The player pilots an Autonomous Surface Vehicle (ASV), explores a small marine environment, discovers distant objects, and tries to identify them as early as possible.

Objects start as small, ambiguous shapes near the horizon and become clearer as the ASV approaches. A simulated ML model continuously predicts the currently targeted object with a top-5 class distribution.

The player earns more points for correct recognition at longer distances.

---

## Core Gameplay

1. Drive the ASV around a small 3D marine map.
2. Explore unknown areas.
3. Objects appear when they enter the forward camera's visibility range.
4. A narrow recognition beam selects one object.
5. The model continuously shows top-5 predictions for that target.
6. The player identifies the object whenever confident enough.
7. Earlier correct predictions earn more points.
8. Some objects may be outside the known classes and can be labeled as **Unknown**.

---

## Initial Object Classes

Start with 10 classes:

1. Merchant ship
2. Ferry
3. Tug
4. Barge
5. Dredger
6. Commercial fishing boat
7. Pleasure craft
8. Sailboat
9. Personal watercraft
10. Kayak / canoe

Later versions can expand toward the full NOMaD class set.

---

## Technology

- Vite
- TypeScript
- Three.js
- HTML/CSS HUD
- GLTF / GLB 3D assets
- JSON gameplay logging

### Setup

```bash
npm create vite@latest nomad-explorer -- --template vanilla-ts
cd nomad-explorer
npm install
npm install three
npm run dev
```

---

## ASV Controls

```text
W / Up Arrow       Throttle
A / Left Arrow     Turn left
D / Right Arrow    Turn right
S / Down Arrow     Slow down

Tab                Cycle visible targets
Mouse click        Select visible target
```

Use simple arcade-style movement for the MVP.

---

## Camera and Target Selection

The ASV has a forward-facing camera.

### Camera FOV

Approximately:

```text
70°
```

All objects inside this region may be visible.

### Recognition Beam

A narrower central beam:

```text
10–15°
```

The object closest to the beam center becomes the active target.

The minimap should show:

- ASV
- islands / coastline
- explored area
- camera FOV
- recognition beam
- discovered objects
- selected target

The selected object should have a **single transparent bounding box**.

Above the box, show only the model's highest-confidence prediction:

```text
Commercial fishing boat 34%
```

No extra target circles or `LOCKED` text.

---

## Model Predictions

Only the selected target receives model predictions.

Example:

```text
Commercial fishing boat   31%
Tug                       25%
Pleasure craft            19%
Ferry                     14%
Dredger                   11%
```

At long range:

- object is small
- visual detail is poor
- predictions are uncertain
- model may be wrong

At close range:

- object becomes larger
- more detail becomes visible
- confidence generally increases

For the MVP, simulate these probabilities.

Later, replace the simulator with predictions from a real detector.

---

## Scoring

Reward early recognition.

Example:

| Recognition Distance | Score |
|---|---:|
| 600+ m | 1000 |
| 500 m | 800 |
| 400 m | 650 |
| 300 m | 450 |
| 200 m | 250 |
| 100 m | 100 |

Wrong classification:

```text
-100 points
```

Unknown object correctly flagged:

```text
distance score + novelty bonus
```

---

## Unknown Objects

Some spawned objects should be outside the 10 known classes.

Examples:

- floating debris
- lobster / pot marker
- floating platform
- unusual vessel

The model should still produce incorrect predictions among its known classes.

The player can select:

```text
Unknown / Label it
```

and provide a short free-text label.

These labels should be saved in the gameplay log.

---

## Environment Difficulty

### Weather

Start with:

- Clear
- Rain
- Fog

Weather mainly changes visibility and image clarity.

### Sea State

Start with:

- Calm
- Moderate
- Rough

Sea state affects:

- camera movement
- wave height
- partial object occlusion

Do not implement full fluid dynamics for the MVP.

---

## World

Use one small marine environment containing:

- open ocean
- 2–4 islands
- coastline
- harbor region
- near-shore region

Spawn approximately:

```text
10–15 objects per game
```

Object positions should change between runs.

Undiscovered objects should not appear on the minimap.

---

## Game Session

Target session length:

```text
3–5 minutes
```

Goal:

> Explore the environment and correctly identify as many objects as possible before time expires.

End-of-game summary:

- final score
- objects discovered
- correct classifications
- unknown objects labeled
- average recognition distance
- map explored %

---

## Logging

Record each classification event.

Example:

```json
{
  "object_id": 4,
  "true_class": "commercial_fishing_boat",
  "distance_m": 437,
  "weather": "fog",
  "sea_state": "moderate",
  "model_top5": [
    ["commercial_fishing_boat", 0.31],
    ["tug", 0.25],
    ["pleasure_craft", 0.19]
  ],
  "human_prediction": "commercial_fishing_boat",
  "correct": true,
  "time_to_decision_s": 2.8
}
```

This allows the game to later function as a human-vs-model perception experiment or active-learning data collection system.

---

## Suggested Project Structure

```text
nomad-explorer/
│
├── public/
│   ├── models/
│   │   ├── asv.glb
│   │   ├── merchant_ship.glb
│   │   ├── ferry.glb
│   │   └── ...
│   │
│   └── textures/
│
├── src/
│   ├── main.ts
│   │
│   ├── game/
│   │   ├── Game.ts
│   │   ├── World.ts
│   │   ├── ASV.ts
│   │   ├── ObjectSpawner.ts
│   │   └── Weather.ts
│   │
│   ├── perception/
│   │   ├── TargetSelector.ts
│   │   ├── PredictionSimulator.ts
│   │   └── DetectionModel.ts
│   │
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── MiniMap.ts
│   │   └── PredictionPanel.ts
│   │
│   ├── data/
│   │   └── classes.ts
│   │
│   └── logging/
│       └── GameLogger.ts
│
├── index.html
├── package.json
└── README.md
```

---

## Development Order

1. Create Three.js scene, ocean, lighting, and camera.
2. Add controllable ASV.
3. Add minimap.
4. Add islands and exploration.
5. Add the 10 object classes.
6. Add distance-based visibility.
7. Add camera FOV and recognition beam.
8. Add target selection and highlighting.
9. Add simulated top-5 predictions.
10. Add classification and scoring.
11. Add unknown-object labeling.
12. Add weather and sea-state effects.
13. Add gameplay logging.
14. Replace placeholder objects with higher-quality GLB models.
15. Connect a real object-detection model.

---

## MVP

The first playable version only needs:

```text
3D ocean
+ controllable ASV
+ small explorable map
+ minimap
+ 10 object classes
+ recognition beam
+ target highlighting
+ simulated top-5 predictions
+ classification
+ scoring
+ unknown labeling
```

Focus first on making the exploration + early-recognition loop fun.

Graphics and real ML integration can come afterward.
