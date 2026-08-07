// ======================================================
// FOXBODY DASH - VEHICLE PAGE
// Correct paths, working view buttons, inline SVG interaction
// ======================================================

const vehicleViews = {
    front: {
        label: "FRONT VIEW",
        path: "../assets/vehicle/exterior/frontView.svg"
    },
    driver: {
        label: "DRIVER SIDE VIEW",
        path: "../assets/vehicle/exterior/driverSideView.svg"
    },
    passenger: {
        label: "PASSENGER SIDE VIEW",
        path: "../assets/vehicle/exterior/passengerSideView.svg"
    },
    top: {
        label: "TOP VIEW",
        path: "../assets/vehicle/exterior/topDownView.svg"
    },
    engine: {
        label: "ENGINE BAY VIEW",
        path: "../assets/vehicle/engine/engineBayView.svg"
    }
};

const partNames = {
    driverDoor: "Driver Door",
    passengerDoor: "Passenger Door",
    driverWindow: "Driver Window",
    passengerWindow: "Passenger Window",
    hood: "Hood",
    hatch: "Rear Hatch",
    leftHeadlight: "Left Headlight",
    rightHeadlight: "Right Headlight",
    leftSignal: "Left Turn Signal",
    rightSignal: "Right Turn Signal",
    spoilerBrakeLight: "Spoiler Brake Light",
    battery: "Battery",
    engine: "Engine",
    intakeAirSystem: "Intake Air System",
    alternatorChargeSystem: "Alternator",
    acCompressor: "A/C Compressor",
    distributorFiringSystem: "Distributor",
    radiatorCoolingFanSystem: "Radiator / Cooling Fan",
    powerSteering: "Power Steering",
    brakeSystem: "Brake System",
    wiperMotor: "Wiper Motor"
};

const partInfo = {
    driverDoor: { Status: "Closed", Lock: "Locked", Window: "100%" },
    passengerDoor: { Status: "Closed", Lock: "Locked", Window: "100%" },
    hood: { Status: "Closed", Latch: "Locked" },
    hatch: { Status: "Closed", Latch: "Locked" },
    engine: { RPM: "0", Coolant: "-- °F", OilPressure: "-- PSI", AFR: "--.--" },
    battery: { Voltage: "14.2 V", Health: "Good", Charging: "Normal" },
    alternatorChargeSystem: { Output: "14.2 V", Current: "-- A", Status: "Charging" },
    intakeAirSystem: { MAP: "-- kPa", IAT: "-- °F", Status: "OK" },
    distributorFiringSystem: { Timing: "10° BTDC", Spark: "Normal", PIP: "OK" },
    radiatorCoolingFanSystem: { Fan: "OFF", Coolant: "-- °F", Status: "Ready" },
    brakeSystem: { Fluid: "OK", Warning: "Off" },
    wiperMotor: { Speed: "Off", Park: "OK" }
};

let currentView = "front";
let selectedPartId = null;

function setActiveButton(view) {
    document.querySelectorAll(".vehicleViewButton").forEach(button => {
        button.classList.toggle("active", button.dataset.view === view);
    });
}

function setViewLabel(view) {
    const label = document.getElementById("vehicleViewName");
    if (label && vehicleViews[view]) label.textContent = vehicleViews[view].label;
}

async function loadVehicle(view) {
    const config = vehicleViews[view];
    const container = document.getElementById("vehicleView");

    if (!config || !container) return;

    currentView = view;
    selectedPartId = null;
    setActiveButton(view);
    setViewLabel(view);

    container.innerHTML = "<p>Loading vehicle view…</p>";

    try {
        const response = await fetch(config.path, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`${config.path} returned HTTP ${response.status}`);
        }

        const svgText = await response.text();
        if (!svgText.trim()) {
            throw new Error(`${config.path} is empty`);
        }

        container.innerHTML = svgText;
        initializeVehicleParts();

        const info = document.getElementById("vehicleInfo");
        if (info) {
            info.innerHTML = `
                <h2>${config.label}</h2>
                <p>Select a vehicle component for information.</p>
            `;
        }
    } catch (error) {
        console.error("Vehicle view load failed:", error);
        container.innerHTML = `
            <div class="vehicleLoadError">
                <strong>Unable to load ${config.label}</strong><br>
                ${error.message}
            </div>
        `;
    }
}

function initializeVehicleParts() {
    const container = document.getElementById("vehicleView");
    const svg = container ? container.querySelector("svg") : null;
    if (!svg) return;

    svg.querySelectorAll("[id]").forEach(part => {
        if (
            part.id.startsWith("svg") ||
            part.id.startsWith("defs") ||
            part.id.startsWith("clipPath") ||
            part.id.startsWith("image") ||
            part.closest("defs")
        ) {
            return;
        }

        part.style.cursor = "pointer";

        part.addEventListener("mouseenter", () => {
            if (part.id !== selectedPartId) part.style.opacity = "0.78";
        });

        part.addEventListener("mouseleave", () => {
            if (part.id !== selectedPartId) part.style.opacity = "1";
        });

        part.addEventListener("click", event => {
            event.stopPropagation();
            selectPart(part);
        });
    });

    svg.addEventListener("click", event => {
        if (event.target === svg) clearSelection();
    });
}

function selectPart(part) {
    const container = document.getElementById("vehicleView");
    const info = document.getElementById("vehicleInfo");
    if (!container || !info || !part) return;

    container.querySelectorAll(".selectedPart").forEach(item => {
        item.classList.remove("selectedPart");
        item.style.opacity = "1";
    });

    selectedPartId = part.id;
    part.classList.add("selectedPart");
    part.style.opacity = "1";

    const realPartId = part.id.endsWith("Click")
        ? part.id.slice(0, -5)
        : part.id;

    const title = partNames[realPartId] || realPartId;
    const data = partInfo[realPartId];

    let html = `<h2>${title}</h2>`;

    if (data) {
        Object.entries(data).forEach(([key, value]) => {
            html += `<p><strong>${key}:</strong> ${value}</p>`;
        });
    } else {
        html += "<p>No diagnostic data is assigned to this component yet.</p>";
    }

    info.innerHTML = html;
}

function clearSelection() {
    const container = document.getElementById("vehicleView");
    if (!container) return;

    container.querySelectorAll(".selectedPart").forEach(item => {
        item.classList.remove("selectedPart");
        item.style.opacity = "1";
    });

    selectedPartId = null;
}

function updatePartData(partId, data) {
    partInfo[partId] = {
        ...(partInfo[partId] || {}),
        ...data
    };
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".vehicleViewButton").forEach(button => {
        button.addEventListener("click", () => loadVehicle(button.dataset.view));
    });

    const homeButton = document.getElementById("vehicleHome");
    if (homeButton) {
        homeButton.addEventListener("click", () => {
            window.location.href = "../index.html";
        });
    }

    loadVehicle("front");
});
