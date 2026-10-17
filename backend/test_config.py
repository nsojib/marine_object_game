import json
from fastapi.testclient import TestClient
from backend.app import create_app

def test_configuration_is_read_fresh_and_validated(tmp_path, monkeypatch):
    from backend import app as module
    root=tmp_path / 'root'
    (root / 'backend').mkdir(parents=True)
    config=json.loads((module.ROOT / 'backend/game_config.json').read_text())
    path=root / 'backend/game_config.json'
    path.write_text(json.dumps(config))
    monkeypatch.setattr(module,'ROOT',root)
    client=TestClient(create_app(tmp_path / 'scores.db'))
    assert client.get('/api/config').json()==config
    config['wrong_penalty']=12
    path.write_text(json.dumps(config))
    assert client.get('/api/config').json()['wrong_penalty']==12
    config['speed_knots_per_point']=0
    path.write_text(json.dumps(config))
    assert client.get('/api/config').status_code==503
