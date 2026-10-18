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

## Sensor chocolate dispenser

Close other serial applications before playing. `myarduino.py` sends one `DISPENSE` command at 115200 baud and requires `ACK DISPENSE`, then `RESULT SUCCESS`. Sensor events are progress only. The Arduino controls motor timing, detects a chocolate, clears the path, and stops itself. The old ON/OFF pulse protocol is no longer used.

`dispenser` settings: `enabled`, `score_threshold`, `record_bonus_enabled`, `port`, `baudrate`, and `response_timeout_seconds` (default 10; allowed 8�15). This timeout is a communication watchdog, not motor run time. Board startup adds 2 seconds. A missing terminal result triggers a best-effort STOP. Firmware has its own timeout if USB communication fails.

BLOCKED, BUSY, HARDWARE, TIMEOUT, STUCK, CANCELLED, and communication/disconnection failures are reported without losing scores. Reward animation has a Continue button (controller A/B/Menu or Escape also works), plus a bounded automatic timeout. Players can resume or end while a request completes; a late response appears as a notification. No automatic re-dispensing occurs after failure or ambiguous results.

Maximum two attempts per game: one after exceeding the configured threshold, one when the final score beats an existing all-time record. Empty leaderboards and ties do not earn a record bonus. Durable claims are committed before contacting hardware and survive retries/restarts. Hardware operations are serialized within the server process; a busy request returns promptly.

Scores remain client-reported; use this as a trusted local kiosk, not a public prize API. Test with `python -m pytest backend -q`; all hardware is mocked. Manual sensor test: `python myarduino.py`, then enter `dispense`.
