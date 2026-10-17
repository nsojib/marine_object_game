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
    assert len(calls)==1 and calls[0]['pulse_seconds']==3
    def fail(**kw):calls.append(kw);raise OSError('Disconnected')
    monkeypatch.setattr('backend.app.dispense_chocolate',fail)
    failed=data(threshold+2)
    assert client.post('/api/chocolate',json=failed).json()['chocolate_status']=='failed'
    assert client.post('/api/chocolate',json=failed).json()['chocolate_status']=='failed'
    assert len(calls)==2
    assert client.post('/api/scores',json=winner).status_code==200
    assert client.post('/api/scores',json=data(threshold+100)).status_code==200
    assert len(calls)==2
    assert client.get('/api/leaderboard').json()['entries'][0]['score']==threshold+100

@pytest.mark.parametrize('fail_on',[False,True])
def test_pulse_always_turns_off(monkeypatch,fail_on):
    class Device:
        def __enter__(self):return self
        def __exit__(self,*args):pass
        def reset_input_buffer(self):pass
    commands=[];sleeps=[]
    monkeypatch.setattr(myarduino.serial,'Serial',lambda *a,**kw:Device())
    monkeypatch.setattr(myarduino.time,'sleep',sleeps.append)
    def command(device,value):
        commands.append(value)
        if fail_on and value=='ON':raise TimeoutError('No ACK')
    monkeypatch.setattr(myarduino,'send_command',command)
    if fail_on:
        with pytest.raises(TimeoutError):myarduino.dispense_chocolate()
    else:
        myarduino.dispense_chocolate()
        assert sleeps==[2,3]
    assert commands==['OFF','ON','OFF']
