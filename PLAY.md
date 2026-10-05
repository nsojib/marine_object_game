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
- Predictions are numbered **1–5**. Press the matching number key or double-click a predicted class to submit it immediately. Number shortcuts are ignored while typing in a field, paused, or viewing a dialog; holding a number does not repeat submissions. A single click selects the class; the dropdown and confirmation button remain available for other classes and unknown labels. A correct answer scores more at longer range, up to 6 distance points plus up to 2 offshore points. Incorrect answers cost 1 point and can be retried.
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

When a known object enters the recognition focus, the Objects panel shows a real reference photograph for that object's class. Use the inset arrows to browse five local photographs. The inset does not display the answer label and is a reference image, not a live camera crop. Unknown contacts have no reference photo. R toggles the entire Objects panel and H hides all instruments. Existing 1–5 identification shortcuts and mouse double-click continue to work.

All 65 photos are served locally from `public/reference-photos`. See `PHOTO-CREDITS.md` for author, source, license and resizing details. Rebuild the curated collection only deliberately using `scripts/download_reference_photos.py` (Python with Pillow and network access), and review any newly selected photos before shipping.

The photo inset frames the subject with a little surrounding space and an offset. Image detail follows contact distance: about 74 pixels across at 200 m, 200 pixels at 100 m, 414 pixels at 50 m, and full available detail within 20 m (up to 512 pixels). Original photos remain unchanged.

Recognition contacts retain their original geometry, including vessels, buoys, lighthouses, and turbines, but use a uniform matte gray material without textures, colored markings, or emissive details. Identify them using the photo inset; approach for more detail. Movement, wakes, and collisions remain. Expeditions spawn only classes with reference photos, so every contact can be identified from the inset.

Crashes into contacts, shore, or structures play a hull impact sound and deduct 2 points, with a minimum total score of zero. Move at least 2 metres clear before another impact can count; a one-second cooldown prevents rapid duplicate penalties. The survey boundary stops the boat without a crash penalty.

Identification audio uses the supplied error.wav for wrong choices and the first 1.5 seconds of ready.wav (80 ms fade-out) for success. Crashes use the supplied wilhelm.wav. Files are bundled locally in public/audio and respect the sound mute control.
