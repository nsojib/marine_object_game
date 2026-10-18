"""Local score service. Run: python -m uvicorn backend.app:app --port 8000."""
import logging
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from uuid import UUID
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, field_validator

from myarduino import dispense_chocolate, DispenserError

ROOT = Path(__file__).resolve().parents[1]

class ScoreInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    run_id: UUID
    player_name: str = Field(min_length=1, max_length=32)
    score: float = Field(ge=0)
    duration_seconds: float = Field(ge=0, le=480)
    correct_identifications: int = Field(ge=0, le=300)

    @field_validator("player_name", mode="before")
    @classmethod
    def clean_name(cls, value):
        if not isinstance(value, str):
            raise ValueError("Name must be text")
        value = " ".join(value.split())
        if not value or any(ord(c) < 32 for c in value):
            raise ValueError("Enter a player name")
        return value


class ObjectCounts(BaseModel):
    model_config = ConfigDict(extra="forbid")
    merchant_ship: int = Field(ge=0, le=20, strict=True)
    ferry: int = Field(ge=0, le=20, strict=True)
    tug: int = Field(ge=0, le=20, strict=True)
    regulatory_marker: int = Field(ge=0, le=20, strict=True)
    channel_marker: int = Field(ge=0, le=20, strict=True)
    safe_water_marker: int = Field(ge=0, le=20, strict=True)
    commercial_fishing_boat: int = Field(ge=0, le=20, strict=True)
    sailboat: int = Field(ge=0, le=20, strict=True)
    personal_watercraft: int = Field(ge=0, le=20, strict=True)
    kayak: int = Field(ge=0, le=20, strict=True)
    law_enforcement: int = Field(ge=0, le=20, strict=True)
    buoys_channel: int = Field(ge=0, le=20, strict=True)
    buoys_offshore: int = Field(ge=0, le=20, strict=True)
    birds_flying: int = Field(ge=0, le=20, strict=True)
    birds_surface: int = Field(ge=0, le=20, strict=True)
    lighthouses: int = Field(ge=0, le=10, strict=True)
    wind_turbines: int = Field(ge=0, le=10, strict=True)

class WildlifeCounts(BaseModel):
    model_config = ConfigDict(extra="forbid")
    whales: int = Field(ge=0, le=30, strict=True)
    dolphins: int = Field(ge=0, le=30, strict=True)
    sharks: int = Field(ge=0, le=30, strict=True)

class DispenserConfig(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    enabled: bool = True
    record_bonus_enabled: bool = True
    score_threshold: float = Field(default=100, ge=0)
    port: str = Field(default="COM4", min_length=1)
    baudrate: int = Field(default=115200, gt=0)
    response_timeout_seconds: float = Field(default=10, ge=8, le=15)

class GameConfig(BaseModel):
    dispenser: DispenserConfig = Field(default_factory=DispenserConfig)
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    total_life: int = Field(ge=1, le=100, strict=True)
    wrong_life_penalty: int = Field(ge=0, le=100, strict=True)
    crash_life_penalty: int = Field(ge=0, le=100, strict=True)
    objects: ObjectCounts
    wildlife: WildlifeCounts
    base_reward: float = Field(ge=0)
    distance_bonus_max: float = Field(ge=0)
    distance_meters_per_point: float = Field(gt=0)
    depth_bonus_max: float = Field(ge=0)
    speed_bonus_max: float = Field(ge=0)
    speed_knots_per_point: float = Field(gt=0)
    wrong_penalty: float = Field(ge=0)
    crash_penalty: float = Field(ge=0)


def create_app(db_path=None):
    database = Path(db_path or os.environ.get("NOMAD_DB_PATH", ROOT / "backend/data/scores.sqlite3"))
    database.parent.mkdir(parents=True, exist_ok=True)
    @contextmanager
    def connect():
        con = sqlite3.connect(database, timeout=10)
        con.row_factory = sqlite3.Row
        try:
            with con:
                yield con
        finally:
            con.close()
    with connect() as con:
        old = con.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='scores'").fetchone()
        if old and 'BETWEEN 0 AND 100' in old['sql']:
            con.execute('ALTER TABLE scores RENAME TO scores_legacy')
        con.execute("""CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL UNIQUE,
          player_name TEXT NOT NULL,
          score REAL NOT NULL CHECK(score >= 0),
          duration_seconds REAL NOT NULL,
          correct_identifications INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        )""")
        if old and 'BETWEEN 0 AND 100' in old['sql']:
            con.execute('INSERT INTO scores SELECT * FROM scores_legacy')
            con.execute('DROP TABLE scores_legacy')
        columns={row['name'] for row in con.execute('PRAGMA table_info(scores)')}
        if 'requested_name' not in columns:
            con.execute('ALTER TABLE scores ADD COLUMN requested_name TEXT')
            con.execute('UPDATE scores SET requested_name=player_name')
        con.execute("""CREATE TABLE IF NOT EXISTS chocolate_rewards (
            run_id TEXT PRIMARY KEY, status TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
        con.execute("""CREATE TABLE IF NOT EXISTS record_rewards (
            run_id TEXT PRIMARY KEY, status TEXT NOT NULL,
            previous_best REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
    app = FastAPI(title="NOMaD Scores", version="1.0.0")

    @app.get("/api/config")
    def game_config():
        # Read on each request so configuration edits need no rebuild or restart.
        try:
            return GameConfig.model_validate_json((ROOT / "backend/game_config.json").read_text()).model_dump()
        except (OSError, ValueError) as error:
            raise HTTPException(503, "Game configuration is invalid or unavailable") from error

    @app.get("/api/health")
    def health():
        with connect() as con:
            con.execute("SELECT 1 FROM scores LIMIT 1")
        return {"status": "ok"}

    @app.post("/api/scores")
    def save_score(body: ScoreInput):
        dispenser=GameConfig.model_validate_json((ROOT / "backend/game_config.json").read_text()).dispenser
        values = (str(body.run_id), body.player_name, round(body.score, 1), round(body.duration_seconds, 2), body.correct_identifications)
        with connect() as con:
            con.execute('BEGIN IMMEDIATE')
            row=con.execute('SELECT * FROM scores WHERE run_id=?',(values[0],)).fetchone()
            if row:
                if tuple(row[k] for k in ['run_id','requested_name','score','duration_seconds','correct_identifications']) != values:
                    raise HTTPException(409, "This run already has a different saved result")
                reward=con.execute('SELECT status FROM chocolate_rewards WHERE run_id=?',(values[0],)).fetchone()
                record=con.execute('SELECT status FROM record_rewards WHERE run_id=?',(values[0],)).fetchone()
                return {**dict(row), 'chocolate_status': reward['status'] if reward else 'not_eligible', 'record_chocolate_status':record['status'] if record else 'not_eligible'}
            previous_best=con.execute('SELECT MAX(score) FROM scores').fetchone()[0]
            record_eligible=dispenser.enabled and dispenser.record_bonus_enabled and previous_best is not None and values[2]>previous_best
            used={r['player_name'].casefold() for r in con.execute('SELECT player_name FROM scores')}
            display=body.player_name
            number=2
            while display.casefold() in used:
                suffix=f' {number}'
                display=body.player_name[:32-len(suffix)]+suffix
                number+=1
            con.execute('INSERT INTO scores (run_id,player_name,score,duration_seconds,correct_identifications,requested_name) VALUES (?,?,?,?,?,?)', (values[0],display,*values[2:],body.player_name))
            result=dict(con.execute('SELECT * FROM scores WHERE run_id=?',(values[0],)).fetchone())
            reward=con.execute('SELECT status FROM chocolate_rewards WHERE run_id=?',(values[0],)).fetchone()
            if record_eligible:
                con.execute("INSERT INTO record_rewards(run_id,status,previous_best) VALUES (?, 'attempted', ?)",(values[0],previous_best))
        record_status='not_eligible'
        if record_eligible:
            try:
                dispense_chocolate(port=dispenser.port,baudrate=dispenser.baudrate,response_timeout_seconds=dispenser.response_timeout_seconds)
                record_status='dispensed'
            except DispenserError as error:
                record_status=error.code
            except Exception:
                logging.exception('Record chocolate failed for run %s',values[0])
                record_status='failed'
            with connect() as con:
                con.execute('UPDATE record_rewards SET status=? WHERE run_id=?',(record_status,values[0]))
        return {**result, 'chocolate_status':reward['status'] if reward else 'not_eligible', 'record_chocolate_status':record_status}

    @app.post("/api/chocolate")
    def chocolate(body: ScoreInput):
        dispenser=GameConfig.model_validate_json((ROOT / "backend/game_config.json").read_text()).dispenser
        run_id=str(body.run_id)
        with connect() as con:
            con.execute('BEGIN IMMEDIATE')
            reward=con.execute('SELECT status FROM chocolate_rewards WHERE run_id=?',(run_id,)).fetchone()
            if reward:
                return {'chocolate_status':reward['status']}
            if con.execute('SELECT 1 FROM scores WHERE run_id=?',(run_id,)).fetchone():
                raise HTTPException(409,'This game has already ended')
            if not dispenser.enabled or body.score<=dispenser.score_threshold:
                return {'chocolate_status':'not_eligible'}
            con.execute("INSERT INTO chocolate_rewards(run_id,status) VALUES (?, 'attempted')",(run_id,))
        try:
            dispense_chocolate(port=dispenser.port,baudrate=dispenser.baudrate,response_timeout_seconds=dispenser.response_timeout_seconds)
            status='dispensed'
        except DispenserError as error:
            status=error.code
        except Exception:
            logging.exception('Chocolate dispenser failed for run %s',run_id)
            status='failed'
        with connect() as con:
            con.execute('UPDATE chocolate_rewards SET status=? WHERE run_id=?',(status,run_id))
        return {'chocolate_status':status}

    @app.get("/api/leaderboard")
    def leaderboard(limit: int = Query(default=10, ge=1, le=10)):
        with connect() as con:
            rows = con.execute("SELECT player_name,score,duration_seconds,correct_identifications,created_at FROM scores ORDER BY score DESC, id ASC LIMIT ?", (limit,)).fetchall()
        return {"entries": [{"rank": i+1, **dict(row)} for i, row in enumerate(rows)]}

    if (ROOT / "dist").is_dir():
        app.mount("/", StaticFiles(directory=ROOT / "dist", html=True), name="game")
    return app

app = create_app()
