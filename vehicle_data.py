from dataclasses import dataclass, field


@dataclass
class EngineState:
    rpm: int = 850
    speed: int = 0
    coolant: int = 185
    fuel: int = 78
    oil: int = 52
    battery: float = 14.2


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
class VehicleState:
    engine: EngineState = field(default_factory=EngineState)
    doors: DoorState = field(default_factory=DoorState)
    lights: LightState = field(default_factory=LightState)


vehicle = VehicleState()
