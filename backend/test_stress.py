from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
from fastapi.testclient import TestClient
from backend.app import create_app

def test_parallel_scores_and_retry_storm(tmp_path):
    client=TestClient(create_app(tmp_path/'scores.db'))
    payloads=[dict(run_id=str(uuid4()),player_name='Dolphin',score=i,duration_seconds=30,correct_identifications=5) for i in range(100)]
    with ThreadPoolExecutor(max_workers=12) as pool:
        results=list(pool.map(lambda body:client.post('/api/scores',json=body),payloads+payloads))
    assert all(r.status_code==200 for r in results)
    by_run={}
    for result in results:
        row=result.json()
        if row['run_id'] in by_run:assert by_run[row['run_id']]==row['id']
        by_run[row['run_id']]=row['id']
    assert len(by_run)==100
    import sqlite3
    with sqlite3.connect(tmp_path/'scores.db') as con:
        assert con.execute('SELECT count(*),count(DISTINCT player_name) FROM scores').fetchone()==(100,100)
    entries=client.get('/api/leaderboard').json()['entries']
    assert [e['score'] for e in entries]==list(range(99,89,-1))

def test_parallel_chocolate_requests_only_one_attempt(tmp_path,monkeypatch):
    calls=[]
    monkeypatch.setattr('backend.app.dispense_chocolate',lambda **kw:calls.append(kw))
    client=TestClient(create_app(tmp_path/'scores.db'))
    body=dict(run_id=str(uuid4()),player_name='Orca',score=10000,duration_seconds=30,correct_identifications=10)
    with ThreadPoolExecutor(max_workers=12) as pool:
        responses=list(pool.map(lambda _:client.post('/api/chocolate',json=body),range(40)))
    assert all(r.status_code==200 for r in responses)
    assert len(calls)==1
