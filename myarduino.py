import time
import serial
import threading

PORT = "COM4"

def send_command(device, command):
    device.write((command + "\n").encode("ascii"))
    device.flush()

    expected = f"OK {command}"
    deadline = time.monotonic() + 3

    while time.monotonic() < deadline:
        reply = device.readline().decode("ascii", errors="replace").strip()

        if reply == expected:
            print(reply)
            return

        if reply.startswith("ERROR"):
            raise RuntimeError(reply)

    raise TimeoutError(f"No confirmation for {command}")

_machine_lock = threading.Lock()

def dispense_chocolate(port=PORT, baudrate=115200, pulse_seconds=3):
    """One serialized pulse. Always attempt OFF, including an unacknowledged ON."""
    if not 0 < pulse_seconds <= 10:
        raise ValueError("Pulse duration must be between 0 and 10 seconds")
    with _machine_lock:
        with serial.Serial(port, baudrate, timeout=0.2, write_timeout=2) as device:
            try:
                time.sleep(2)
                device.reset_input_buffer()
                send_command(device, "OFF")
                send_command(device, "ON")
                time.sleep(pulse_seconds)
            finally:
                send_command(device, "OFF")


def main():
    with serial.Serial(PORT, 115200, timeout=0.2, write_timeout=2) as device:
        # Opening the port may reset the board.
        time.sleep(2)
        device.reset_input_buffer()

        try:
            send_command(device, "OFF")
            print("Enter on, off, or quit.")

            while True:
                command = input("> ").strip().upper()

                if command in ("QUIT", "EXIT"):
                    break

                if command in ("ON", "OFF"):
                    send_command(device, command)
                else:
                    print("Use on, off, or quit.")

        except KeyboardInterrupt:
            pass
        finally:
            send_command(device, "OFF")


if __name__ == "__main__":
    main()
