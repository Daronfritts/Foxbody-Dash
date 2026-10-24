import glob
import os
import struct
import threading
import time

import serial

from vehicle_data import get_rpm_override, vehicle


class MicroSquirtReader:
    PORT_ENV = "FOXDASH_MICROSQUIRT_PORT"
    BAUD_ENV = "FOXDASH_MICROSQUIRT_BAUD"
    DEFAULT_BAUD = 115200
    PACKET_SIZE = 212
    POLL_SECONDS = 0.05
    RECONNECT_SECONDS = 1.0
    BAD_PORT_RETRY_SECONDS = 10.0
    PORT_PATTERNS = (
        "/dev/serial/by-id/*",
        "/dev/ttyACM*",
        "/dev/ttyUSB*",
    )

    def __init__(self):
        self.running = False
        self.thread = None
        self.serial = None
        self.port = None
        self.connected = False
        self.last_error = None
        self.last_packet_at = None
        self.bad_ports = {}

    @property
    def baud(self):
        try:
            return int(os.getenv(self.BAUD_ENV, self.DEFAULT_BAUD))
        except ValueError:
            return self.DEFAULT_BAUD

    @staticmethod
    def _u16(data, offset):
        return struct.unpack_from(">H", data, offset)[0]

    @staticmethod
    def _s16(data, offset):
        return struct.unpack_from(">h", data, offset)[0]

    def candidate_ports(self):
        configured = os.getenv(self.PORT_ENV)
        if configured:
            return [configured]

        ports = []
        for pattern in self.PORT_PATTERNS:
            ports.extend(sorted(glob.glob(pattern)))

        # Preserve order while removing duplicate real paths/symlinks.
        unique = []
        seen = set()
        now = time.monotonic()
        for port in ports:
            real = os.path.realpath(port)
            if real in seen:
                continue
            if self.bad_ports.get(real, 0) > now:
                continue
            seen.add(real)
            unique.append(port)
        return unique

    def mark_bad_port(self, port):
        if os.getenv(self.PORT_ENV) or not port:
            return
        self.bad_ports[os.path.realpath(port)] = time.monotonic() + self.BAD_PORT_RETRY_SECONDS

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
        self.last_packet_at = time.time()

    def connect(self):
        if self.serial and self.serial.is_open:
            return

        errors = []
        for port in self.candidate_ports():
            try:
                self.serial = serial.Serial(port, self.baud, timeout=0.5)
                self.serial.reset_input_buffer()
                self.port = port
                self.connected = True
                self.last_error = None
                print(f"MicroSquirt connected: {port} @ {self.baud}")
                return
            except Exception as exc:
                errors.append(f"{port}: {exc}")
                self.serial = None

        if not errors:
            errors.append(
                "no serial ports found; set "
                f"{self.PORT_ENV}=/dev/ttyACM0 or your /dev/serial/by-id path"
            )
        raise IOError("MicroSquirt connection failed: " + "; ".join(errors))

    def disconnect(self):
        self.connected = False

        if self.serial:
            try:
                self.serial.close()
            except Exception:
                pass

        self.serial = None
        self.port = None

    def read_once(self):
        self.connect()

        self.serial.reset_input_buffer()
        self.serial.write(b"A")
        self.serial.flush()

        data = self.serial.read(self.PACKET_SIZE)

        if len(data) != self.PACKET_SIZE:
            failed_port = self.port
            self.mark_bad_port(failed_port)
            raise IOError(
                f"MicroSquirt packet length {len(data)}, "
                f"expected {self.PACKET_SIZE} on {failed_port}"
            )

        self.decode_packet(data)

    def status(self):
        return {
            "connected": self.connected,
            "port": self.port,
            "baud": self.baud,
            "last_error": self.last_error,
            "last_packet_at": self.last_packet_at,
        }

    def _run(self):
        print("MicroSquirt reader started")

        while self.running:
            started = time.monotonic()
            try:
                self.read_once()

            except Exception as exc:
                self.last_error = str(exc)
                self.disconnect()

                # ECU may be switched off with the ignition.
                # Don't crash the dashboard; just keep trying.
                time.sleep(self.RECONNECT_SECONDS)
                continue

            # Include serial transfer time in the 20 Hz target interval rather
            # than adding a full delay after each completed packet. Slow ECU
            # responses stay serialized; no backlog of requests is created.
            remaining = self.POLL_SECONDS - (time.monotonic() - started)
            if remaining > 0:
                time.sleep(remaining)

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

    def stop(self, wait=False):
        self.running = False

        if wait and self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)

        # Make the handoff deterministic even if a serial timeout delayed the
        # reader thread's normal cleanup.
        if wait:
            self.disconnect()


microsquirt = MicroSquirtReader()
