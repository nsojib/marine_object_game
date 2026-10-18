from uuid import uuid4
from fastapi.testclient import TestClient
from backend.app import create_app
import myarduino
import pytest

def test_threshold_duplicate_and_failure(tmp_path,monkeypatch):
    calls=[]
    monkeypatch.setattr('backend.app.dispense_chocolate',lambda **kw:calls.append(kw))
    path=tmp_path/'scores.db'
    client=TestClient(create_app(path))
    threshold=client.get('/api/config').json()['dispenser']['score_threshold']
    def data(score):return dict(run_id=str(uuid4()),player_name='Test',score=score,duration_seconds=10,correct_identifications=10)
    assert client.post('/api/chocolate',json=data(threshold)).json()['chocolate_status']=='not_eligible'
    winner=data(threshold+1)
    assert client.post('/api/chocolate',json=winner).json()['chocolate_status']=='dispensed'
    assert TestClient(create_app(path)).post('/api/chocolate',json=winner).json()['chocolate_status']=='dispensed'
    assert len(calls)==1 and calls[0]['response_timeout_seconds']==10
    def fail(**kw):calls.append(kw);raise OSError('Disconnected')
    monkeypatch.setattr('backend.app.dispense_chocolate',fail)
    failed=data(threshold+2)
    assert client.post('/api/chocolate',json=failed).json()['chocolate_status']=='failed'
    assert client.post('/api/chocolate',json=failed).json()['chocolate_status']=='failed'
    assert len(calls)==2
    assert client.post('/api/scores',json=winner).status_code==200
    assert client.post('/api/scores',json=data(threshold+100)).status_code==200
    assert len(calls)==3
    assert client.get('/api/leaderboard').json()['entries'][0]['score']==threshold+100

def test_record_bonus_maximum_two_and_retries(tmp_path,monkeypatch):
    calls=[]
    monkeypatch.setattr('backend.app.dispense_chocolate',lambda **kw:calls.append(kw))
    path=tmp_path/'scores.db';client=TestClient(create_app(path))
    def data(score):return dict(run_id=str(uuid4()),player_name='Test',score=score,duration_seconds=10,correct_identifications=10)
    assert client.post('/api/scores',json=data(100)).json()['record_chocolate_status']=='not_eligible'
    assert client.post('/api/scores',json=data(100)).json()['record_chocolate_status']=='not_eligible'
    assert client.post('/api/scores',json=data(99)).json()['record_chocolate_status']=='not_eligible'
    winner=data(client.get('/api/config').json()['dispenser']['score_threshold']+101)
    assert client.post('/api/chocolate',json=winner).json()['chocolate_status']=='dispensed'
    assert client.post('/api/scores',json=winner).json()['record_chocolate_status']=='dispensed'
    again=TestClient(create_app(path))
    assert again.post('/api/scores',json=winner).json()['record_chocolate_status']=='dispensed'
    assert again.post('/api/chocolate',json=winner).json()['chocolate_status']=='dispensed'
    assert len(calls)==2
    def fail(**kw):calls.append(kw);raise OSError('offline')
    monkeypatch.setattr('backend.app.dispense_chocolate',fail)
    higher=data(winner['score']+1)
    assert client.post('/api/scores',json=higher).json()['record_chocolate_status']=='failed'
    assert client.post('/api/scores',json=higher).json()['record_chocolate_status']=='failed'
    assert len(calls)==3

@pytest.mark.parametrize('code',['blocked','stuck','timeout','busy','hardware','disconnected','communication_timeout'])
def test_machine_issue_preserves_game_score(tmp_path,monkeypatch,code):
    calls=[]
    def fail(**kwargs):calls.append(kwargs);raise myarduino.DispenserError(code)
    monkeypatch.setattr('backend.app.dispense_chocolate',fail)
    client=TestClient(create_app(tmp_path/'scores.db'))
    data=dict(run_id=str(uuid4()),player_name='Sensor test',score=10000,duration_seconds=10,correct_identifications=10)
    assert client.post('/api/chocolate',json=data).json()['chocolate_status']==code
    assert client.post('/api/chocolate',json=data).json()['chocolate_status']==code
    assert len(calls)==1
    assert client.post('/api/scores',json=data).status_code==200
    assert client.get('/api/leaderboard').json()['entries'][0]['score']==10000
