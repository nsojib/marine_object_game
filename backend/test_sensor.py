import pytest
import myarduino as machine

class FakeDevice:
    def __init__(self,replies):self.replies=list(replies);self.commands=[]
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def reset_input_buffer(self):pass
    def write(self,value):self.commands.append(value.decode().strip())
    def readline(self):return ((self.replies.pop(0) if self.replies else '')+'\n').encode()

def install(monkeypatch,replies):
    device=FakeDevice(replies);clock=[0]
    def now():clock[0]+=.25;return clock[0]
    monkeypatch.setattr(machine.serial,'Serial',lambda *a,**kw:device)
    monkeypatch.setattr(machine.time,'sleep',lambda _:None)
    monkeypatch.setattr(machine.time,'monotonic',now)
    return device

def test_success_requires_terminal_sensor_confirmation(monkeypatch):
    device=install(monkeypatch,['boot','ACK DISPENSE','EVENT OBJECT_DETECTED','EVENT PUSH 1','RESULT SUCCESS'])
    machine.dispense_chocolate()
    assert device.commands==['DISPENSE']

@pytest.mark.parametrize('reply,code',[
 ('REJECT BLOCKED','blocked'),('REJECT BUSY','busy'),('REJECT HARDWARE','hardware'),
 ('REJECT INVALID_COMMAND','invalid_command'),('REJECT COMMAND_TOO_LONG','command_too_long'),
 ('RESULT TIMEOUT','timeout'),('RESULT STUCK','stuck'),('RESULT CANCELLED','cancelled')])
def test_terminal_failure_is_not_success(monkeypatch,reply,code):
    device=install(monkeypatch,['ACK DISPENSE',reply])
    with pytest.raises(machine.DispenserError) as error:machine.dispense_chocolate()
    assert error.value.code==code
    assert device.commands==['DISPENSE']

@pytest.mark.parametrize('replies',[[],['RESULT SUCCESS'],['ACK DISPENSE','EVENT OBJECT_DETECTED']])
def test_missing_confirmation_times_out_and_stops(monkeypatch,replies):
    device=install(monkeypatch,replies)
    with pytest.raises(machine.DispenserError) as error:machine.dispense_chocolate()
    assert error.value.code=='communication_timeout'
    assert device.commands==['DISPENSE','STOP']

def test_busy_lock_does_not_wait():
    machine._machine_lock.acquire()
    try:
        with pytest.raises(machine.DispenserError,match='busy'):machine.dispense_chocolate()
    finally:machine._machine_lock.release()

def test_disconnection_attempts_stop_and_releases_lock(monkeypatch):
    device=install(monkeypatch,[])
    def broken():raise machine.serial.SerialException('unplugged')
    device.readline=broken
    with pytest.raises(machine.DispenserError,match='disconnected'):machine.dispense_chocolate()
    assert device.commands==['DISPENSE','STOP']
    assert not machine._machine_lock.locked()
