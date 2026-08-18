import time
from dataclasses import dataclass, field


# Temporary test override used by Pico 2. It is intentionally kept outside the
# VehicleState dataclasses so /api/vehicle stays clean and production data is
# unchanged. MicroSquirt resumes control automatically when the override expires.
_rpm_override = None
_rpm_override_until = 0.0


def set_rpm_override(rpm, seconds=4.0):
    global _rpm_override, _rpm_override_until
    _rpm_override = max(0, int(rpm))
    _rpm_override_until = time.monotonic() + max(0.0, float(seconds))


def get_rpm_override():
    global _rpm_override, _rpm_override_until
    if _rpm_override is None:
        return None
    if time.monotonic() >= _rpm_override_until:
        _rpm_override = None
        _rpm_override_until = 0.0
        return None
    return _rpm_override


@dataclass
class EngineState:
    rpm: int = 0
    speed: int = 0
    coolant: int = 185
    fuel: int = 78
    oil: int = 52
    battery: float = 14.2

    # Live MicroSquirt values
    afr: float = 14.7
    map: float = 100.0
    tps: float = 0.0
    iat: float = 70.0
    advance: float = 0.0
    pulse_width: float = 0.0


@dataclass
class DoorState:
    driver: bool = False
    passenger: bool = False
    hood: bool = False
    hatch: bool = False


@dataclass
class LightState:
    headlights: bool = False
    high_beams: bool = False
    parking: bool = False
    left_turn: bool = False
    right_turn: bool = False
    brake: bool = False
    reverse: bool = False
    fog: bool = False


@dataclass
class WarningState:
    abs: bool = False
    battery: bool = False
    brake: bool = False
    checkEngine: bool = False
    coolant: bool = False
    doorAjar: bool = False
    lowFuel: bool = False
    oil: bool = False
    seatbelt: bool = False
    security: bool = False
    tpms: bool = False


@dataclass
class VehicleState:
    engine: EngineState = field(default_factory=EngineState)
    doors: DoorState = field(default_factory=DoorState)
    lights: LightState = field(default_factory=LightState)
    warnings: WarningState = field(default_factory=WarningState)


vehicle = VehicleState()
