# Play NOMaD Explorer

On this computer, double-click **START-GAME.cmd**. It uses the portable Node runtime installed in `.runtime` and opens the game in your browser. Keep its terminal running while playing.

For a fresh checkout, install Node.js 22+, then run:

```sh
npm install
npm run dev
```

Open the local address printed in the terminal. Production output is generated with `npm run build`; serve it using `npm run preview`. Run the gameplay rule tests with `npm test`.

## Scene overlays

The ocean fills the screen. Translucent instruments float over it, leaving the center open for navigation. Use the top toolbar or keyboard shortcuts: **M** map, **R** object predictions, **I** mission statistics, **C** controls/settings, **H** all instruments. H restores your previous panel choices. Shortcuts do not trigger while typing labels or choosing a dropdown option.

## Controls and mission

- Click **Begin expedition** to start the eight-minute mission.
- Hold **W / Up** to accelerate, **S / Down** to brake and reverse, and **A / D / Left / Right** to steer. Throttle coasts gradually when released. Press **Space** to stop immediately; holding Space overrides acceleration.
- Center a vessel in the narrow recognition beam to select it. **Tab** cycles contacts within the narrow forward recognition beam; clicking a vessel in that beam also selects it. The tight bounding box shows distance and disappears when the contact leaves the beam.
- Predictions are numbered **1–4**. Press the matching number key or double-click a predicted class to submit it immediately. Number shortcuts are ignored while typing in a field, paused, or viewing a dialog; holding a number does not repeat submissions. A single click selects the class; the dropdown and confirmation button remain available for other classes and unknown labels. A correct answer scores more at longer range, up to 6 distance points plus up to 2 offshore points. Incorrect answers cost 1 point and can be retried.
- For an unfamiliar object, choose **Unknown / label it**, enter a short description, and confirm. Correct unknown labels earn 2 bonus points.
- **Escape** or the **Pause** button pauses the mission. Returning from a hidden browser tab requires manually resuming.
- Weather and sea conditions can be changed during the expedition. Islands, the survey boundary, and unidentified vessel hulls block travel. A collision stops your boat; reverse or steer clear. The bow turns with the arrow keys and the chase camera follows smoothly.
- Sound begins when you start the expedition: engine and water ambience, collision impacts, and correct/incorrect identification cues. Use **Sound on / Sound off** to mute. Pausing silences the engine and water.
- After eight minutes or thirty-five successful identifications, download the JSON session log or begin a randomized expedition.

## Implementation

Vite + TypeScript + Three.js. The ten known vessel classes and two unknown contacts use detailed locally generated geometry with curved hulls, class-specific deck equipment, windows, railings, rigging, and occupants on small craft. The classifier is a deterministic distance-based simulation, not a trained ML model. Top-five probabilities are normalized over the five displayed candidates. A procedural sky with environment reflections, sculpted rocky islands, reflective ocean waves, rough-sea camera motion, rain, fog, coastline occlusion, discovery tracking, and the navigation map are implemented. Coordinates are fictional.

`src/main.ts` owns rendering, input, UI, and session state; `src/rules.js` contains tested prediction, bearing, and scoring rules. `src/vessels.ts` builds the fleet and ASV; `src/scenery.ts` builds the sky and terrain. `src/style.css` styles the instrument panel. The original `README.md` remains the design brief.

The game requires WebGL 2 and is designed for keyboard-and-mouse play. Fonts are optionally loaded from Google Fonts, with local fallbacks. GLB art assets and a real inference backend are future work. Logs stay in memory until downloaded; reloading discards the active session.

## Offshore expedition

The survey covers 1.8 by 6 kilometres, starting at a sheltered departure pier and extending north into deep water. Navy water darkens offshore. Whales, dolphins, sharks, flying birds, and navigation buoys populate the route. All 18 buoys are detectable contacts: choose Buoy or double-click its prediction to identify one. They collide with the ASV and disappear after correct recognition. Animals remain environmental scenery. Auto weather and sea settings respond to offshore distance and score; manual overrides are available.

The total score ranges from 0 to 100. Each known contact, including buoys, can earn up to 8 points; either unknown contact can earn up to 10. With 35 contacts available, the session total is capped at 100. Recognition farther away and farther offshore earns more. Wrong answers subtract 1 point.

Lighthouses and wind turbines are known object classes. One lighthouse and four turbines join the detection, classification, collision, minimap, and scoring systems. Correct recognition removes them; restarting restores them. Their foundations stay fixed rather than bobbing with waves.

## Evolving conditions

Auto weather develops fronts over mission time, even while stationary. Offshore distance and score strengthen the conditions. Fog density, rain, clouds, sunlight and wave height change continuously; sun glare depends on your heading. Spray and lens droplets increase with speed, swell and rain, then fade. Pausing freezes the effects. Clear/Rain/Fog and Calm/Moderate/Rough overrides remain available in Controls (C). Actual effect values are included in classification logs.

## Camera views

Press **V** during gameplay to switch between **TPS** (third-person chase camera) and **FPS** (first-person onboard camera). The **View** button in Controls (**C**) does the same. FPS uses a tighter 50-degree vertical camera FOV versus 70 degrees in TPS. FPS follows the bow directly and includes gentle sea motion; TPS follows turns smoothly. Switching views does not change scoring, movement, or the recognition beam.

## Moving boat traffic

Seven vessels (cargo ship, ferry, tug, fishing boat, pleasure craft, sailboat, and personal watercraft) follow local patrol routes at different speeds. They turn gradually and stop/choose another waypoint when blocked by land, structures, other contacts, or your ASV. Traffic and wakes pause with the mission; identified boats and wakes disappear. Distances, targeting, map positions and collision footprints update with movement.


## Real photo inset

When a known object enters the recognition focus, the Objects panel shows a real reference photograph for that object's class. Use the inset arrows to browse five local photographs. The inset does not display the answer label and is a reference image, not a live camera crop. Unknown contacts have no reference photo. R toggles the entire Objects panel and H hides all instruments. Existing 1–4 identification shortcuts and mouse double-click continue to work.

All 65 photos are served locally from `public/reference-photos`. See `PHOTO-CREDITS.md` for author, source, license and resizing details. Rebuild the curated collection only deliberately using `scripts/download_reference_photos.py` (Python with Pillow and network access), and review any newly selected photos before shipping.

The photo inset frames the subject with a little surrounding space and an offset. Image detail follows contact distance: about 74 pixels across at 200 m, 200 pixels at 100 m, 414 pixels at 50 m, and full available detail within 20 m (up to 512 pixels). Original photos remain unchanged.

Recognition contacts retain their original geometry, including vessels, buoys, lighthouses, and turbines, but use a uniform matte gray material without textures, colored markings, or emissive details. Identify them using the photo inset; approach for more detail. Movement, wakes, and collisions remain. Expeditions spawn only classes with reference photos, so every contact can be identified from the inset.

Crashes into contacts, shore, or structures play a hull impact sound and deduct 2 points, with a minimum total score of zero. Move at least 2 metres clear before another impact can count; a one-second cooldown prevents rapid duplicate penalties. The survey boundary stops the boat without a crash penalty.

Identification audio uses the supplied error.wav for wrong choices and the first 1.5 seconds of ready.wav (80 ms fade-out) for success. Crashes use the supplied wilhelm.wav. Files are bundled locally in public/audio and respect the sound mute control.

NOMaD inset overrides: public/nomad-inset/manifest.json supplies reviewed user-provided crops for matching classes. Existing photos fill missing classes and unsuitable examples. Native padding is preserved; no second subject crop is applied. Import with scripts/import_nomad_photos.py; images are reduced to at most 800 x 600 without upscaling. Distance-dependent resolution still applies.

The selected_nomad_objects class folders are now authoritative for NOMaD inset images. Add or delete PNG/JPEG/WebP files there; Vite synchronizes on startup, build, and file changes during development. Restart an already-running server once to load this configuration. Photo counts are variable and removed images are not replaced. Existing reference photos remain only for classes absent from the selected collection (barge, dredger, wind turbine). The initial selections use optimized WebP copies; newly added or changed files are copied at their supplied size. Manual sync: node scripts/sync_selected_photos.mjs.

Pleasure craft is retired: it is excluded from spawned targets, prediction candidates, identification choices, and inset photos. Historical numeric class IDs remain unchanged.

Law enforcement is an active moving vessel class, using the law_enforcement folder in selected_nomad_objects for its inset photos and a plain gray motorboat shape in the scene.

Birds are identifiable flying contacts using selected_nomad_objects/bird. They retain flight animation, disappear after correct identification, and do not block boats or incur water-level collision penalties.

Enter a captain name before playing. Scores save through FastAPI when the expedition ends or when you choose End & save in Controls. Leaderboard shows the top 20 completed runs. Vehicle speed remains visible in knots and km/h even with controls hidden. Use START-GAME.cmd to start both services; see backend/README.md for setup and production serving.

Selected-only mode: active categories are generated exclusively from nonempty selected_nomad_objects folders. There is no legacy photo fallback. Missing/empty categories do not spawn or appear in predictions or identification choices. Old reference files are retained on disk only and are not loaded by the inset.

Wind turbine and Dredger are restored using five existing photos each copied into selected_nomad_objects/wind-turbine and selected_nomad_objects/dredger. Their photos.json files retain subject crop coordinates and original credits. These classes now use the same selected-folder synchronization as all other classes.

Current scoring: 100 base points per correct identification, up to 200 distance bonus and 100 deep-sea bonus. Wrong choices cost 50 and crashes cost 100. No upper score cap; minimum zero. Escape opens a pause menu with Resume and End & save; Escape again resumes.

Life: start with 100; wrong identification costs 10, crash costs 20. Zero life ends the run and saves its score. A persistent life meter shows remaining life; restart restores it to 100. Existing collision rearm rules also prevent repeated life loss while stuck against an obstacle.

The player vessel is a lightweight DriX-inspired red monohull built from the supplied photos, with a dorsal sensor tower, antennas, radar, and aft GNSS platform. It is a visual approximation, not a manufacturer CAD model. The collision footprint and onboard camera match the new hull.

Life now uses a 10-point scale: wrong identification costs 1 and crash costs 2. At zero the game ends. The expedition HUD is removed; current score appears at the top of the Objects panel.

The landing instructions list WASD and arrow-key steering. Detection offers four ranked choices, with shortcuts 1-4 or mouse double-click.

Minimum forward cruise is 2 knots, including at expedition start. Space and collisions still stop the boat; reverse remains available. Extra landing and live-view explanatory labels are hidden; detailed controls remain in Help.

Identification is keyboard-only: press 1-4 for the displayed choices. The identification dropdown, confirm button, and prediction mouse handlers have been removed.

Each contact receives one random category photo per expedition; it stays consistent when refocused. Restarting resets photo assignments. Inset arrows and photo counter are removed.

Current motion: minimum 2 knots while playing, no reverse or Space stop; S/down slows to the minimum. Crashes automatically turn toward clear water. Pause and game-over still freeze play. Current rubric: correct +10; distance bonus +0 below 100m, +2 at 100-299m, +4 at 300-599m, +6 at 600m or more. Depth bonus +0 coastal, +2 offshore (22% route depth), +4 deep sea (65%). Wrong -3 points/-1 life; crash -5 points/-2 life. No total cap; minimum score zero.

The Scoring dashboard button opens the rubric and pauses active play. Correct identification adds a speed bonus: +1 at 5 knots, +2 at 10 knots, +3 at 15 knots or more. Speed is sampled when answering. Maximum reward per identification is now 23 points.

Large ships (merchant ships, ferries, dredger) spawn in the middle ocean corridor, 2.1-3.7 km forward from the starting shore. Personal watercraft and kayak start 250-550 m forward; remaining vessels are spread 1.3-4.8 km along the route. Spawn counts are unchanged.

Object distribution: 21 vessels (2 merchant, 2 ferry, 2 tug, 1 dredger, 4 commercial fishing, 3 sailboat, 2 personal watercraft, 3 kayak/canoe, 2 law enforcement), 18 buoys, 5 birds (3 flying, 2 floating), 4 wind turbines, 2 lighthouses. Total 50. Personal watercraft and kayaks spawn near shore.
