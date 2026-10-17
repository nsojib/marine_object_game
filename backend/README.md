# Score backend

Python 3.10+ and SQLite. Install from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\START-GAME.cmd
```

The launcher starts FastAPI on port 8000 and Vite on port 5173. Stop any older frontend server first. Ctrl+C stops both. Vite proxies `/api` to FastAPI. For production, run `npm run build`, then `.venv/Scripts/python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000`; FastAPI serves both the built game and API at port 8000.

- `POST /api/scores`: run_id (UUID), player_name (1–32 characters), score (0–100), duration_seconds (0–480), correct_identifications.
- `GET /api/leaderboard?limit=20`: top completed runs, highest score first; ties keep the earliest submission first. Repeated player names are allowed.
- `GET /api/health`: health check. `/docs`: interactive API documentation.

Scores persist in `backend/data/scores.sqlite3`, ignored by Git. Set `NOMAD_DB_PATH` to use another database. Score posts use parameterized SQL and run IDs make retries idempotent. Browser-unsaved results are retained locally and can be retried. End of mission or End & save submits the current score.

This is a casual leaderboard: names are not authenticated and scores are reported by the browser. Validation prevents malformed values, but does not verify gameplay or prevent cheating.

Tests: install `backend/requirements-dev.txt`, then run `python -m pytest backend -q`.

## Scoring configuration

Edit `backend/game_config.json` to set the base reward, bonus caps and divisors, and wrong-answer/crash penalties. FastAPI serves these settings at `/api/config`. Refresh the game after saving changes; no rebuild or server restart is needed. Settings are fixed for an already-open game. Invalid settings prevent new games from loading. Score totals remain client-reported.

Serve the built game with `.\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000`, then open http://127.0.0.1:8000.

The same configuration also sets `total_life`, `wrong_life_penalty`, `crash_life_penalty`, `objects` (counts by category, including flying/surface birds and channel/offshore buoys), and `wildlife` (decorative whales, dolphins, sharks). Set a count to 0 to omit it. Vessel geography remains category-based: big ships offshore, kayaks and personal watercraft near shore. Only categories with selected photos become identification targets. Counts are bounded for browser performance.

## Chocolate dispenser

`myarduino.py` is now importable and still works as a standalone manual controller. Install backend dependencies including pyserial. Close the manual controller before running the game so COM4 is available.

`dispenser` in game_config.json controls enabled, score_threshold (strictly greater than), port, baudrate, and pulse_seconds (default 3). When gameplay first exceeds the configured threshold (100 by default), the client calls `/api/chocolate` and FastAPI sends OFF, ON, waits 3 seconds, then OFF. It waits 2 seconds when opening the board to allow reset. One attempt is recorded per run before hardware activation; repeated submissions and server restarts never repeat it. Saving a final score can award one additional chocolate if it strictly beats an existing all-time leaderboard record and `dispenser.record_bonus_enabled` is true. Empty leaderboards and ties do not qualify. The comparison and durable bonus claim occur in the same database transaction as score insertion. Each run is limited to one threshold attempt and one record attempt (maximum two chocolates); failed or interrupted attempts are not automatically retried. Existing saved scores are not retroactively rewarded. The game shows a chocolate animation, freezes gameplay during dispensing, and then opens Resume / End & save. Failures preserve the score and show a machine-attention message. Interrupted attempts require operator inspection; there is no automatic retry. Software attempts OFF on error, but firmware should enforce its own motor timeout if USB or server power fails. The protocol confirms commands, not physical chocolate delivery.

Scores are client-reported: keep this a trusted local kiosk; this is not an authenticated prize system for public internet access.
