import struct
import threading
import time

import serial

from vehicle_data import get_rpm_override, vehicle


class MicroSquirtReader:
    PORT = "/dev/ttyUSB0"
    BAUD = 115200
    PACKET_SIZE = 212
    POLL_SECONDS = 0.10

    def __init__(self):
        self.running = False
        self.thread = None
        self.serial = None
        self.connected = False
        self.last_error = None

    @staticmethod
    def _u16(data, offset):
        return struct.unpack_from(">H", data, offset)[0]

    @staticmethod
    def _s16(data, offset):
        return struct.unpack_from(">h", data, offset)[0]

    def decode_packet(self, data):
        rpm = self._u16(data, 6)
        advance = self._s16(data, 8) * 0.1
        map_kpa = self._s16(data, 18) * 0.1
        iat = self._s16(data, 20) * 0.1
        coolant = self._s16(data, 22) * 0.1
        tps = self._s16(data, 24) * 0.1
        battery = self._s16(data, 26) * 0.1
        afr = self._s16(data, 28) * 0.1
        pulse_width = self._u16(data, 2) * 0.000666

        # Small negative TPS values can occur around calibrated closed throttle.
        if tps < 0:
            tps = 0.0

        # During Pico 2 bench testing, let the temporary simulated RPM win.
        # When its short timeout expires, live MicroSquirt RPM resumes automatically.
        simulated_rpm = get_rpm_override()
        vehicle.engine.rpm = simulated_rpm if simulated_rpm is not None else int(rpm)
        vehicle.engine.coolant = round(coolant, 1)
        vehicle.engine.battery = round(battery, 1)

        vehicle.engine.map = round(map_kpa, 1)
        vehicle.engine.tps = round(tps, 1)
        vehicle.engine.afr = round(afr, 1)
        vehicle.engine.advance = round(advance, 1)
        vehicle.engine.iat = round(iat, 1)
        vehicle.engine.pulse_width = round(pulse_width, 3)

    def connect(self):
        if self.serial and self.serial.is_open:
            return

        self.serial = serial.Serial(
            self.PORT,
            self.BAUD,
            timeout=0.5
        )

        self.serial.reset_input_buffer()
        self.connected = True
        self.last_error = None
        print(f"MicroSquirt connected: {self.PORT} @ {self.BAUD}")

    def disconnect(self):
        self.connected = False

        if self.serial:
            try:
                self.serial.close()
            except Exception:
                pass

        self.serial = None

    def read_once(self):
        self.connect()

        self.serial.reset_input_buffer()
        self.serial.write(b"A")
        self.serial.flush()

        data = self.serial.read(self.PACKET_SIZE)

        if len(data) != self.PACKET_SIZE:
            raise IOError(
                f"MicroSquirt packet length {len(data)}, "
                f"expected {self.PACKET_SIZE}"
            )

        self.decode_packet(data)

    def _run(self):
        print("MicroSquirt reader started")

        while self.running:
            try:
                self.read_once()

            except Exception as exc:
                self.last_error = str(exc)
                self.disconnect()

                # ECU may be switched off with the ignition.
                # Don't crash the dashboard; just keep trying.
                time.sleep(1.0)
                continue

            time.sleep(self.POLL_SECONDS)

        self.disconnect()
        print("MicroSquirt reader stopped")

    def start(self):
        if self.running:
            return

        self.running = True
        self.thread = threading.Thread(
            target=self._run,
            name="microsquirt-reader",
            daemon=True
        )
        self.thread.start()

    def stop(self):
        self.running = False


microsquirt = MicroSquirtReader()
