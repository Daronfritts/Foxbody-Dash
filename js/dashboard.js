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

const miniGaugeOptions = {
    size: 155,
    radius: 61,
    needleLength: 46,
    majorTicks: 4,
    minorTicks: 20,
    subtitle: ""
};

const fuel = new MiniGauge(
    "fuelGauge",
    "FUEL",
    78,
    "",
    {
        ...miniGaugeOptions,
        min: 0,
        max: 100,
        labels: ["E", "", "1/2", "", "F"],
        warningLow: 15
    }
);

const oil = new MiniGauge(
    "oilGauge",
    "OIL PSI",
    40,
    "",
    {
        ...miniGaugeOptions,
        min: 0,
        max: 80,
        labels: ["0", "", "40", "", "80"],
        warningLow: 12
    }
);

const coolant = new MiniGauge(
    "coolantGauge",
    "COOLANT",
    185,
    "",
    {
        ...miniGaugeOptions,
        min: 100,
        max: 260,
        labels: ["C", "", "180", "", "H"],
        warningHigh: 230
    }
);

const battery = new MiniGauge(
    "batteryGauge",
    "VOLTS",
    14.2,
    "",
    {
        ...miniGaugeOptions,
        min: 10,
        max: 18,
        labels: ["10", "", "14", "", "18"],
        warningLow: 11.5,
        warningHigh: 16
    }
);

const warningDefinitions = [
    {
        key: "oil",
        tileId: "warning-oil",
        icon: "assets/icons/dashboard/warnings/oil.svg",
        title: "CHECK OIL PRESSURE",
        message: "Oil pressure is below the safe operating range.",
        severity: "critical",
        priority: 100
    },
    {
        key: "coolant",
        tileId: "warning-coolant",
        icon: "assets/icons/dashboard/warnings/coolant.svg",
        title: "ENGINE TEMP HIGH",
        message: "Coolant temperature is above the safe operating range.",
        severity: "critical",
        priority: 95
    },
    {
        key: "checkEngine",
        tileId: "warning-check-engine",
        icon: "assets/icons/dashboard/warnings/check-engine.svg",
        title: "CHECK ENGINE",
        message: "The ECU has reported an active engine fault.",
        severity: "warning",
        priority: 90
    },
    {
        key: "battery",
        tileId: "warning-battery",
        icon: "assets/icons/dashboard/warnings/battery.svg",
        title: "CHARGING SYSTEM",
        message: "System voltage is outside the normal operating range.",
        severity: "warning",
        priority: 85
    },
    {
        key: "brake",
        tileId: "warning-brake",
        icon: "assets/icons/dashboard/warnings/brake.svg",
        title: "BRAKE WARNING",
        message: "The brake system warning input is active.",
        severity: "critical",
        priority: 80
    },
    {
        key: "tpms",
        tileId: "warning-tpms",
        icon: "assets/icons/dashboard/warnings/tpms.svg",
        title: "LOW TIRE PRESSURE",
        message: "One or more tires are below the configured pressure threshold.",
        severity: "warning",
        priority: 70
    },
    {
        key: "abs",
        tileId: "warning-abs",
        icon: "assets/icons/dashboard/warnings/abs.svg",
        title: "ABS WARNING",
        message: "The anti-lock brake warning input is active.",
        severity: "warning",
        priority: 65
    },
    {
        key: "lowFuel",
        tileId: "warning-low-fuel",
        icon: "assets/icons/dashboard/warnings/low-fuel.svg",
        title: "LOW FUEL",
        message: "Fuel level is below 15 percent.",
        severity: "warning",
        priority: 50
    },
    {
        key: "doorAjar",
        tileId: "warning-door",
        icon: "assets/icons/dashboard/warnings/door-ajar.svg",
        title: "DOOR AJAR",
        message: "A door or hatch is not fully closed.",
        severity: "warning",
        priority: 40
    },
    {
        key: "seatbelt",
        tileId: "warning-seatbelt",
        icon: "assets/icons/dashboard/warnings/seatbelt.svg",
        title: "SEATBELT",
        message: "Driver seatbelt warning is active.",
        severity: "warning",
        priority: 30
    },
    {
        key: "security",
        tileId: "warning-security",
        icon: "assets/icons/dashboard/warnings/security.svg",
        title: "SECURITY",
        message: "Vehicle security warning is active.",
        severity: "warning",
        priority: 20
    }
];

const warningState = Object.fromEntries(warningDefinitions.map(def => [def.key, false]));

function setShiftLight(rpm) {
    const logo = document.getElementById("mustangLogo");
    if (!logo) return;

    logo.classList.remove("shiftYellow", "shiftRed");

    if (rpm >= 6000) {
        logo.classList.add("shiftRed");
    } else if (rpm >= 5500) {
        logo.classList.add("shiftYellow");
    }
}

function setWarning(key, active) {
    if (!(key in warningState)) return;
    warningState[key] = Boolean(active);

    const def = warningDefinitions.find(item => item.key === key);
    const tile = def ? document.getElementById(def.tileId) : null;
    if (!tile) return;

    tile.classList.toggle("active", warningState[key]);
    tile.classList.toggle("critical", warningState[key] && def.severity === "critical");
}

function renderMessageCenter() {
    const active = warningDefinitions
        .filter(def => warningState[def.key])
        .sort((a, b) => b.priority - a.priority);

    const center = document.getElementById("messageCenter");
    const icon = document.getElementById("messageIcon");
    const normalIcon = document.getElementById("messageNormalIcon");
    const title = document.getElementById("messageTitle");
    const text = document.getElementById("messageText");

    if (!center || !icon || !normalIcon || !title || !text) return;

    center.classList.remove("messageNormal", "messageWarning", "messageCritical");

    if (active.length === 0) {
        center.classList.add("messageNormal");
        normalIcon.hidden = false;
        icon.hidden = true;
        title.textContent = "SYSTEMS NORMAL";
        text.textContent = "No active vehicle warnings.";
        return;
    }

    const primary = active[0];
    normalIcon.hidden = true;
    icon.hidden = false;
    icon.src = primary.icon;
    title.textContent = primary.title;
    text.textContent = active.length > 1
        ? `${primary.message} ${active.length - 1} additional warning${active.length > 2 ? "s" : ""} active.`
        : primary.message;

    center.classList.add(primary.severity === "critical" ? "messageCritical" : "messageWarning");
}

function firstBoolean(...values) {
    for (const value of values) {
        if (typeof value === "boolean") return value;
        if (value === 1 || value === "1" || value === "true") return true;
        if (value === 0 || value === "0" || value === "false") return false;
    }
    return false;
}

function updateWarnings(data, engine) {
    const warnings = data.warnings || data.alerts || {};
    const tires = data.tires || data.tpms || {};
    const body = data.body || {};

    const rpm = Number(engine.rpm) || 0;
    const oilPressure = Number(engine.oil);
    const coolantTemp = Number(engine.coolant);
    const voltage = Number(engine.battery);
    const fuelLevel = Number(engine.fuel);

    setWarning(
        "oil",
        firstBoolean(warnings.oil, warnings.lowOil, warnings.lowOilPressure) ||
        (rpm > 500 && Number.isFinite(oilPressure) && oilPressure < 12)
    );

    setWarning(
        "coolant",
        firstBoolean(warnings.coolant, warnings.highCoolant, warnings.overTemp) ||
        (Number.isFinite(coolantTemp) && coolantTemp >= 230)
    );

    setWarning(
        "battery",
        firstBoolean(warnings.battery, warnings.charging, warnings.lowVoltage) ||
        (Number.isFinite(voltage) && (voltage < 11.5 || voltage > 16))
    );

    setWarning(
        "lowFuel",
        firstBoolean(warnings.lowFuel) ||
        (Number.isFinite(fuelLevel) && fuelLevel <= 15)
    );

    setWarning("checkEngine", firstBoolean(warnings.checkEngine, warnings.cel, engine.checkEngine, engine.cel));
    setWarning("brake", firstBoolean(warnings.brake, warnings.brakeWarning, body.brakeWarning));
    setWarning("abs", firstBoolean(warnings.abs, warnings.absWarning));
    setWarning("seatbelt", firstBoolean(warnings.seatbelt, warnings.seatBelt, body.seatbelt));
    setWarning("security", firstBoolean(warnings.security, body.security));
    setWarning("doorAjar", firstBoolean(warnings.doorAjar, body.doorAjar, body.hatchAjar));
    setWarning("tpms", firstBoolean(warnings.tpms, warnings.lowTire, tires.lowPressure, tires.warning));

    renderMessageCenter();
}

function updateLiveRibbon(data, engine) {
    const write = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    if (typeof engine.oil === "number") write("liveOil", `Oil ${Math.round(engine.oil)} PSI`);
    if (typeof engine.afr === "number") write("liveAfr", `AFR ${engine.afr.toFixed(1)}`);
    if (typeof engine.map === "number") write("liveMap", `MAP ${Math.round(engine.map)} kPa`);
    if (typeof engine.battery === "number") write("liveBattery", `Battery ${engine.battery.toFixed(1)} V`);
    if (typeof engine.fuelPressure === "number") write("liveFuelPressure", `Fuel ${Math.round(engine.fuelPressure)} PSI`);
    if (typeof engine.coolant === "number") write("liveEct", `ECT ${Math.round(engine.coolant)}°`);

    const vehicle = data.vehicle || {};
    if (typeof vehicle.outsideTemp === "number") {
        const outsideTemp = document.getElementById("outsideTemp");
        if (outsideTemp) outsideTemp.textContent = `${Math.round(vehicle.outsideTemp)}°F`;
    }
}

function updateClock() {
    const clock = document.getElementById("clockDisplay");
    if (!clock) return;

    clock.textContent = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
}

// Sequential startup sweep gives the cluster an OEM self-test feel.
tach.sweep();
setTimeout(() => speed.sweep(), 90);
setTimeout(() => fuel.sweep(), 180);
setTimeout(() => oil.sweep(), 250);
setTimeout(() => coolant.sweep(), 320);
setTimeout(() => battery.sweep(), 390);

setShiftLight(0);
renderMessageCenter();
updateClock();
setInterval(updateClock, 30000);

async function updateVehicleData() {
    try {
        const response = await fetch("/api/vehicle");
        if (!response.ok) return;

        const data = await response.json();
        const engine = data.engine || {};

        if (typeof engine.rpm === "number") {
            tach.setValue(engine.rpm);
            setShiftLight(engine.rpm);
        }
        if (typeof engine.speed === "number") speed.setValue(engine.speed);
        if (typeof engine.fuel === "number") fuel.setValue(engine.fuel);
        if (typeof engine.oil === "number") oil.setValue(engine.oil);
        if (typeof engine.coolant === "number") coolant.setValue(engine.coolant);
        if (typeof engine.battery === "number") battery.setValue(engine.battery);

        updateLiveRibbon(data, engine);
        updateWarnings(data, engine);
    } catch (error) {
        console.warn("Vehicle data unavailable:", error);
    }
}

setInterval(updateVehicleData, 500);
