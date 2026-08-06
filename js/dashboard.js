const tach = new Gauge(
    "tach",
    0,
    8000,
    0,
    "RPM",
    {
        unit: "",
        majorTicks: 8,
        minorTicks: 40,
        redlineStart: 6000,
        labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
        title: "RPM"
    }
);

const speed = new Gauge(
    "speed",
    0,
    180,
    0,
    "MPH",
    {
        unit: "",
        majorTicks: 9,
        minorTicks: 45,
        labels: ["0", "20", "40", "60", "80", "100", "120", "140", "160", "180"],
        title: "MPH"
    }
);

const coolant = new MiniGauge(
    "coolantGauge",
    "COOLANT",
    185,
    "°F",
    {
        min: 100,
        max: 260,
        labels: ["100", "", "180", "", "260"],
        majorTicks: 4,
        minorTicks: 20,
        radius: 46
    }
);

const fuel = new MiniGauge(
    "fuelGauge",
    "FUEL",
    78,
    "%",
    {
        min: 0,
        max: 100,
        labels: ["E", "", "1/2", "", "F"],
        majorTicks: 4,
        minorTicks: 20,
        radius: 46
    }
);

const oil = new MiniGauge(
    "oilGauge",
    "OIL",
    40,
    "PSI",
    {
        min: 0,
        max: 80,
        labels: ["0", "", "40", "", "80"],
        majorTicks: 4,
        minorTicks: 20,
        radius: 46
    }
);

const battery = new MiniGauge(
    "batteryGauge",
    "BATTERY",
    14.2,
    "V",
    {
        min: 8,
        max: 18,
        labels: ["8", "", "14", "", "18"],
        majorTicks: 4,
        minorTicks: 20,
        radius: 46
    }
);

tach.sweep();
setTimeout(() => speed.sweep(), 100);
setTimeout(() => coolant.sweep(), 200);
setTimeout(() => fuel.sweep(), 300);
setTimeout(() => oil.sweep(), 400);
setTimeout(() => battery.sweep(), 500);

async function updateVehicleData() {
    try {
        const response = await fetch("/api/vehicle");
        if (!response.ok) return;

        const data = await response.json();
        const engine = data.engine || {};

        if (typeof engine.rpm === "number") tach.setValue(engine.rpm);
        if (typeof engine.speed === "number") speed.setValue(engine.speed);
        if (typeof engine.coolant === "number") coolant.setValue(engine.coolant);
        if (typeof engine.fuel === "number") fuel.setValue(engine.fuel);
        if (typeof engine.oil === "number") oil.setValue(engine.oil);
        if (typeof engine.battery === "number") battery.setValue(engine.battery);
    } catch (error) {
        console.warn("Vehicle data unavailable:", error);
    }
}

setInterval(updateVehicleData, 500);
