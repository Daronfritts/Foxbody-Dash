const tach = new Gauge(
    "tach",
    0,
    8000,
    0,
    "RPM",
    {
        majorTicks: 8,
        minorTicks: 40,
        redlineStart: 6000,
        labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
        title: "RPM",
        subtitle: "x1000",
        variant: "main",
        size: 430,
        radius: 176,
        needleLength: 132
    }
);

const speed = new Gauge(
    "speed",
    0,
    200,
    0,
    "MPH",
    {
        majorTicks: 10,
        minorTicks: 50,
        labels: ["0", "20", "40", "60", "80", "100", "120", "140", "160", "180", "200"],
        title: "MPH",
        variant: "main",
        size: 430,
        radius: 176,
        needleLength: 132
    }
);

const fuel = new MiniGauge(
    "fuelGauge",
    "FUEL",
    78,
    "",
    {
        min: 0,
        max: 100,
        labels: ["E", "", "1/2", "", "F"],
        majorTicks: 4,
        minorTicks: 20,
        warningLow: 15,
        subtitle: "",
        radius: 48,
        needleLength: 34
    }
);

const oil = new MiniGauge(
    "oilGauge",
    "OIL PSI",
    40,
    "",
    {
        min: 0,
        max: 80,
        labels: ["0", "", "40", "", "80"],
        majorTicks: 4,
        minorTicks: 20,
        warningLow: 12,
        subtitle: "",
        radius: 48,
        needleLength: 34
    }
);

const coolant = new MiniGauge(
    "coolantGauge",
    "COOLANT",
    185,
    "",
    {
        min: 100,
        max: 260,
        labels: ["C", "", "180", "", "H"],
        majorTicks: 4,
        minorTicks: 20,
        warningHigh: 230,
        subtitle: "",
        radius: 48,
        needleLength: 34
    }
);

const battery = new MiniGauge(
    "batteryGauge",
    "VOLTS",
    14.2,
    "",
    {
        min: 10,
        max: 18,
        labels: ["10", "", "14", "", "18"],
        majorTicks: 4,
        minorTicks: 20,
        warningLow: 11.5,
        warningHigh: 16,
        subtitle: "",
        radius: 48,
        needleLength: 34
    }
);

// Sequential startup sweep keeps the cluster feeling like an OEM self-test.
tach.sweep();
setTimeout(() => speed.sweep(), 90);
setTimeout(() => fuel.sweep(), 180);
setTimeout(() => oil.sweep(), 250);
setTimeout(() => coolant.sweep(), 320);
setTimeout(() => battery.sweep(), 390);

async function updateVehicleData() {
    try {
        const response = await fetch("/api/vehicle");
        if (!response.ok) return;

        const data = await response.json();
        const engine = data.engine || {};

        if (typeof engine.rpm === "number") tach.setValue(engine.rpm);
        if (typeof engine.speed === "number") speed.setValue(engine.speed);
        if (typeof engine.fuel === "number") fuel.setValue(engine.fuel);
        if (typeof engine.oil === "number") oil.setValue(engine.oil);
        if (typeof engine.coolant === "number") coolant.setValue(engine.coolant);
        if (typeof engine.battery === "number") battery.setValue(engine.battery);
    } catch (error) {
        console.warn("Vehicle data unavailable:", error);
    }
}

setInterval(updateVehicleData, 500);
