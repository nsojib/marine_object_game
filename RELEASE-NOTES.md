# NOMaD Explorer 1.0.1

- Live dispenser USB indicator refreshed every five seconds.
- Retry after refilling an empty dispenser without restarting the game.
- Prevent duplicate successful dispensing; do not repeat historical errors when saving scores.
- Shorter landing instructions.

Validation: 43 game tests, 39 backend tests, TypeScript, production build and browser reward checks passed. Hardware tests use mocks. USB presence does not confirm chocolate availability.

Extract the Windows x64 ZIP and double-click PLAY.cmd. No separate Python or Node.js installation is needed. Keep your previous backend/data folder to preserve scores when upgrading.

## Previous release

# NOMaD Explorer 1.0.0 — Exhibition edition

Download the Windows x64 ZIP, extract it completely, and double-click **PLAY.cmd**. Python and Node.js are included/not required separately. The launcher opens the local game in your browser. Close it with Ctrl+C in its console.

- Offline game assets and bundled Python runtime; fresh leaderboard.
- Keyboard and Xbox controls, haptics where supported, and automatic keyboard fallback.
- Clearer instructions, optional player names, examples available during pauses, and arrow-key menu navigation.
- 46 identification targets, top-10 leaderboard, configurable scoring/life/object counts.
- Sensor-confirmed chocolate rewards with failure handling; milestone medals when hardware is unavailable.
- Portable settings in backend/game_config.json; set dispenser.enabled to false for no-machine use.

Validation: 43 game tests, 31 backend tests, 26 browser start/end/replay cycles, 200 score requests, and 40 duplicate reward requests. All hardware tests used mocks. Real controller vibration, physical dispensing, and an all-day soak still need checking on the exhibition PC.

Requirements: Windows 10/11 x64 and current Edge or Chrome with WebGL. Arduino USB drivers may be needed when using the optional dispenser. Unzip to a writable folder; don't run inside the ZIP. No existing scores or private environment files are bundled.

The portable ZIP also passed a fresh-extraction/offline test using only its own runtime. All 15 example categories, gameplay, saving and the leaderboard loaded successfully.
