'PY'
import glob
import threading
import time

import serial

from vehicle_data import vehicle


class PicoSimulatorReader:
    BAUD = 115200

    def __init__(self):
        self.running = False
        self.thread = None
        self.serial = None
        self.port = None
        self.connected = False
        self.last_error = None

    def find_port(self):
        ports = sorted(glob.glob("/dev/ttyACM*"))

        if not ports:
            raise IOError("No Pico USB serial port found")

        return ports[0]

    def connect(self):
        if self.serial and self.serial.is_open:
            return

        self.port = self.find_port()

        self.serial = serial.Serial(
            self.port,
            self.BAUD,
            timeout=1.0
        )

        self.connected = True
        self.last_error = None

        print(f"Pico simulator connected: {self.port}")

    def disconnect(self):
        self.connected = False

        if self.serial:
            try:
                self.serial.close()
            except Exception:
                pass

        self.serial = None
        self.port = None

    @staticmethod
    def bool_value(value):
        return value.strip().upper() in ("1", "ON", "TRUE", "YES")

    def process_line(self, line):
        line = line.strip()

        if not line or "=" not in line:
            return

        key, value = line.split("=", 1)

        key = key.strip().upper()
        value = value.strip()
        state = self.bool_value(value)

        if key == "LEFT":
            vehicle.lights.left_turn = state

        elif key == "RIGHT":
            vehicle.lights.right_turn = state

        elif key == "HIGHBEAM":
            vehicle.lights.high_beams = state

        elif key == "HEADLIGHTS":
            vehicle.lights.headlights = state

        elif key == "PARKING":
            vehicle.lights.parking = state

        elif key == "BRAKE":
            vehicle.lights.brake = state

        elif key == "REVERSE":
            vehicle.lights.reverse = state

        elif key == "FOG":
            vehicle.lights.fog = state

        elif key == "DRIVER_DOOR":
            vehicle.doors.driver = state

        elif key == "PASSENGER_DOOR":
            vehicle.doors.passenger = state

        elif key == "HOOD":
            vehicle.doors.hood = state

        elif key == "HATCH":
            vehicle.doors.hatch = state

        elif key == "CHECK_ENGINE":
            vehicle.warnings.checkEngine = state

        elif key == "OIL_WARNING":
            vehicle.warnings.oil = state

        elif key == "BATTERY_WARNING":
            vehicle.warnings.battery = state

        elif key == "COOLANT_WARNING":
            vehicle.warnings.coolant = state

        elif key == "LOW_FUEL":
            vehicle.warnings.lowFuel = state

        elif key == "SEATBELT":
            vehicle.warnings.seatbelt = state

        elif key == "BRAKE_WARNING":
            vehicle.warnings.brake = state

        elif key == "DOOR_AJAR":
            vehicle.warnings.doorAjar = state

        elif key == "SECURITY":
            vehicle.warnings.security = state

        else:
            return

        print(f"PICO SIM: {key}={int(state)}")

    def _run(self):
        print("Pico simulator reader started")

        while self.running:
            try:
                self.connect()

                line = self.serial.readline()

                if line:
                    self.process_line(
                        line.decode("utf-8", errors="ignore")
                    )

            except Exception as exc:
                self.last_error = str(exc)
                self.disconnect()
                time.sleep(1)

        self.disconnect()
        print("Pico simulator reader stopped")

    def start(self):
        if self.running:
            return

        self.running = True

        self.thread = threading.Thread(
            target=self._run,
            name="pico-simulator-reader",
            daemon=True
        )

        self.thread.start()

    def stop(self):
        self.running = False

pico_simulator = PicoSimulatorReader()

'PY'
