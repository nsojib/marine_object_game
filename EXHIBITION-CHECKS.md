# Exhibition readiness checks — 18 October 2026

## Completed checks

- 43 JavaScript tests passed (movement, scoring, life, controller input/haptics, selected photos, spawning).
- 31 backend tests passed (configuration, persistence, reward idempotency, sensor outcomes, concurrency).
- TypeScript checks and production build passed. Vite still reports a bundle-size advisory (~687 kB main JavaScript, ~188 kB gzip).
- 200 concurrent/repeated score requests (100 unique runs, 12 workers): exactly 100 saved runs and unique display names; top 10 sorted correctly.
- 40 concurrent requests for one threshold reward: exactly one mocked hardware invocation.
- Headless Edge completed 26 consecutive start/end/replay cycles without JavaScript errors. Temporary database and mocked hardware only.
- Tested optional-name Play, name/button arrow navigation, reminder default focus, all 15 guide categories, guide return to reminder/pause, controller connection/disconnection and keyboard fallback, leaderboard failure, and layouts at 1280×720, 1024×768, 800×600, and 390×844.
- JavaScript heap after forced collection: 8.7 MB before the 25-repeat loop, 10.5 MB afterward. This is a short-run observation, not proof of no long-term memory growth; GPU memory was not measured.
- Reward dialog checks passed for success, blocked, stuck, disconnected, disabled/unavailable, and communication timeout. Continue works before a response; late replies do not reopen the dialog. Successful rewards stay open until the player chooses Continue or Escape.

## Usability changes

The landing screen now explains the task and both control schemes. The live identification panel tells players to look at the real photo and choose its name. The first reminder explains that approaching improves clarity and skipping difficult targets is allowed. Examples have visible scrolling controls and controller right-stick scrolling. Buttons have larger hit areas and visible focus. Service errors use player-facing language instead of backend terminology.

Repeated Play cannot replace an active run. Pausing while another dialog is open no longer stacks a second pause menu. Controller answers use the same focus/visibility checks as keyboard answers; unplugging the controller explains the keyboard fallback.

## Run the tests again

From the project folder in PowerShell:

```powershell
.\.runtime\node.exe --test --test-reporter=dot tests/*.test.mjs
.\.venv\Scripts\python.exe -m pytest backend -q
.\.runtime\node.exe node_modules/typescript/bin/tsc --noEmit
.\.runtime\node.exe node_modules/vite/bin/vite.js build
.\.venv\Scripts\python.exe scripts/exhibition_smoke.py
.\.venv\Scripts\python.exe scripts/reward_ui_smoke.py
```

Browser scripts use local Edge, Playwright, and temporary servers on ports 8003 and 5174. They clean up their own servers and never activate the real dispenser or modify the live leaderboard. Install test dependencies from backend/requirements-dev.txt if needed.

## Still requires the actual exhibition setup

These tests cannot guarantee flawless all-day operation. No real Xbox vibration or physical chocolate release was exercised. Before opening, run a full game with the actual controller, confirm a sensor-detected release, and check disconnect/empty-machine behavior with an adult operating the dispenser. Close other serial-port applications. Confirm the USB port, controller battery, audio level, and selected config values. Test on the actual display, then leave the game running for several hours to check browser/GPU stability and PC sleep settings.

The game uses client-reported scores and is intended for a supervised local kiosk. Saved records and reward claims remain in backend/data; do not delete them while dispensing is in progress. The real server was not started or stopped by these test scripts.

## Portable release

A Windows x64 release bundles Python 3.13.16 (official python.org archive, SHA-256 verified), pinned backend dependencies, built game assets, and a double-click PLAY.cmd launcher. It excludes development files and live leaderboard data. Font loading uses local system fonts; no external font service is required. Build it with `python scripts/build_release.py --version 1.0.0` after the frontend build (the target version directory must not already exist).

Clean ZIP extraction was tested in a temporary path with spaces using its bundled Python 3.13.16, with system Python/Node removed from PATH and external browser requests blocked. Startup, all 15 example categories, gameplay, score saving, replay and leaderboard passed; the initial database was empty. A clean Playwright Chromium was used for the offline check because locally installed Edge injected AdBlock360 requests even with extension-disable flags. The shipped HTML does not include those requests. Use a clean browser profile for the exhibition.

Portable recheck: `python scripts/test_portable_release.py` (requires Playwright Chromium; install with `python -m playwright install chromium` on the development/test computer). No browser install command is needed for end users who already have Edge or Chrome.
