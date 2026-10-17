from uuid import uuid4
from fastapi.testclient import TestClient
from backend.app import create_app

def payload(**changes):
    return dict(run_id=str(uuid4()), player_name="Captain", score=72.5, duration_seconds=120, correct_identifications=9, **changes)

def test_save_persist_rank_and_retry(tmp_path):
    path=tmp_path/"scores.db"
    client=TestClient(create_app(path)); data=payload()
    first=client.post('/api/scores',json=data)
    assert first.status_code==200
    assert client.post('/api/scores',json=data).json()['id']==first.json()['id']
    changed={**data,'score':90}
    assert client.post('/api/scores',json=changed).status_code==409
    high={**payload(),'score':2500,'player_name':'Ada'}
    assert client.post('/api/scores',json=high).status_code==200
    again=TestClient(create_app(path))
    entries=again.get('/api/leaderboard').json()['entries']
    assert [e['player_name'] for e in entries]==['Ada','Captain']
    assert [e['rank'] for e in entries]==[1,2]
    assert len(again.get('/api/leaderboard?limit=1').json()['entries'])==1

def test_validation_and_names(tmp_path):
    client=TestClient(create_app(tmp_path/'scores.db'))
    for patch in [{'score':-1},{'player_name':'   '},{'player_name':'x'*33},{'duration_seconds':481},{'correct_identifications':-1},{'run_id':'bad'}]:
        assert client.post('/api/scores',json={**payload(),**patch}).status_code==422
    data={**payload(),'player_name':"  O'Reilly  "}
    assert client.post('/api/scores',json=data).json()['player_name']=="O'Reilly"
    assert client.get('/api/leaderboard?limit=10000').status_code==422
    assert client.get('/api/health').json()=={'status':'ok'}

def test_migrate_capped_database(tmp_path):
    import sqlite3
    path=tmp_path/'legacy.db'
    with sqlite3.connect(path) as con:
        con.execute("CREATE TABLE scores (id INTEGER PRIMARY KEY AUTOINCREMENT,run_id TEXT UNIQUE,player_name TEXT,score REAL CHECK(score BETWEEN 0 AND 100),duration_seconds REAL,correct_identifications INTEGER,created_at TEXT)")
        con.execute("INSERT INTO scores VALUES (1,?,'Old Captain',80,120,8,'2026-01-01')",(str(uuid4()),))
    client=TestClient(create_app(path))
    assert client.post('/api/scores',json={**payload(),'score':3200}).status_code==200
    entries=client.get('/api/leaderboard').json()['entries']
    assert entries[0]['score']==3200
    assert entries[1]['player_name']=='Old Captain'

def test_names_are_numbered_and_retries_keep_assigned_name(tmp_path):
    client=TestClient(create_app(tmp_path/'names.db'))
    requests=[payload() for _ in range(3)]
    names=[client.post('/api/scores',json=data).json()['player_name'] for data in requests]
    assert names==['Captain','Captain 2','Captain 3']
    assert client.post('/api/scores',json=requests[1]).json()['player_name']=='Captain 2'
    assert len(client.get('/api/leaderboard').json()['entries'])==3
    assert client.post('/api/scores',json={**payload(),'player_name':'captain'}).json()['player_name']=='captain 4'
