import pytest

@pytest.fixture(autouse=True)
def no_real_hardware(monkeypatch):
    monkeypatch.setattr('backend.app.dispense_chocolate', lambda **kwargs: None)
