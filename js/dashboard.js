const tach = new Gauge(
    "tach",
    0,
    8000,
    0,
    "RPM"
);

const speed = new Gauge(
    "speed",
    0,
    180,
    0,
    "MPH"
);

const coolant = new MiniGauge(
    "coolantGauge",
    "COOLANT",
    185,
    "°F",
    {
        min:100,
        max:260,
        labels:["100","","180","","260"],
        majorTicks:4,
        minorTicks:20
    }
);

const fuel = new MiniGauge(
    "fuelGauge",
    "FUEL",
    78,
    "%",
    {
        min:0,
        max:100,
        labels:["E","","1/2","","F"],
        majorTicks:4,
        minorTicks:20
    }
);

const oil = new MiniGauge(
    "oilGauge",
    "OIL",
    40,
    "PSI",
    {
        min:0,
        max:80,
        labels:["0","","40","","80"],
        majorTicks:4,
        minorTicks:20
    }
);

const battery = new MiniGauge(
    "batteryGauge",
    "BATTERY",
    14.2,
    "V",
    {
        min:8,
        max:18,
        labels:["8","","14","","18"],
        majorTicks:4,
        minorTicks:20
    }
);


tach.sweep();

setTimeout(() => {
    speed.sweep();
}, 100);

setTimeout(() => {
    coolant.sweep();
}, 200);

setTimeout(() => {
    fuel.sweep();
}, 300);

setTimeout(() => {
    oil.sweep();
}, 400);

setTimeout(() => {
    battery.sweep();
}, 500);

async function updateVehicleData() {

    const response = await fetch("/api/vehicle");
    const data = await response.json();

    const engine = data.engine;

    tach.setValue(engine.rpm);
    speed.setValue(engine.speed);

    coolant.setValue(engine.coolant);
    fuel.setValue(engine.fuel);
    oil.setValue(engine.oil);
    battery.setValue(engine.battery);

}

setInterval(updateVehicleData, 500);

