"""Sensor-based Arduino dispenser. Importing this module never touches hardware."""
import logging
import threading
import time
import serial

PORT = "COM4"
_machine_lock = threading.Lock()

class DispenserError(RuntimeError):
    def __init__(self, code):
        self.code = code
        super().__init__(code)

def _write(device, command):
    device.write((command + "\n").encode("ascii"))

def dispense_chocolate(port=PORT, baudrate=115200, response_timeout_seconds=10):
    """Request one sensor-confirmed chocolate, with a bounded host watchdog."""
    if not 8 <= response_timeout_seconds <= 15:
        raise ValueError("Response timeout must be between 8 and 15 seconds")
    if not _machine_lock.acquire(blocking=False):
        raise DispenserError("busy")
    try:
        with serial.Serial(port, baudrate, timeout=.2, write_timeout=1) as device:
            time.sleep(2)  # Allow board reset after opening USB.
            device.reset_input_buffer()
            completed = False
            try:
                _write(device, "DISPENSE")
                deadline = time.monotonic() + response_timeout_seconds
                acknowledged = False
                while time.monotonic() < deadline:
                    reply = device.readline().decode("ascii", errors="replace").strip()
                    if reply == "ACK DISPENSE":
                        acknowledged = True
                    elif reply.startswith("REJECT "):
                        completed = True
                        raise DispenserError(reply.split(" ", 1)[1].lower())
                    elif reply.startswith("RESULT ") and acknowledged:
                        completed = True  # Firmware stops the motor before RESULT.
                        result = reply.split(" ", 1)[1]
                        if result == "SUCCESS":
                            return
                        raise DispenserError(result.lower())
                    # EVENT OBJECT_DETECTED / PUSH are progress, never success.
                raise DispenserError("communication_timeout")
            finally:
                if not completed:
                    try:
                        _write(device, "STOP")
                    except Exception:
                        logging.exception("Could not send STOP; firmware timeout must stop the motor")
    except serial.SerialException as error:
        raise DispenserError("disconnected") from error
    finally:
        _machine_lock.release()

def main():
    print("Enter dispense or quit. Each dispense waits for sensor confirmation.")
    while True:
        try:
            command = input("> ").strip().lower()
            if command in ("quit", "exit"):
                return
            if command != "dispense":
                print("Use dispense or quit.")
                continue
            try:
                dispense_chocolate()
                print("Chocolate confirmed by sensor.")
            except Exception as error:
                print("Dispenser issue:", error)
        except (KeyboardInterrupt, EOFError):
            return

if __name__ == "__main__":
    main()
