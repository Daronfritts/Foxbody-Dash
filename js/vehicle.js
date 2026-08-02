// ======================================================
// FOXBODY BCM - VEHICLE PAGE
// ======================================================

// ---------- SVG Files ----------

const vehicleViews = {
    front: "frontView.svg",
    rear: "rearView.svg",
    top: "topDownView.svg",
    driver: "driverSideView.svg",
    passenger: "passengerSideView.svg",
    engine: "../engine/engineBayView.svg"
};
// ---------- Global State ----------

let doorStates = {
    driverDoor: false,
    passengerDoor: false,
    hatch: false
};

let currentView = "top";
let selectedPartId = null;

// ---------- Friendly Names ----------

const partNames = {

    // Exterior
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

    // Engine
    battery: "Battery",

    engine: "Engine",

    intakeAirSystem: "Intake Air System",

    alternatorChargeSystem: "Alternator",

    acCompressor: "A/C Compressor",

    distributorFiringSystem: "Distributor",

    radiatorCoolingFanSystem: "Radiator & Cooling Fan",

    powerSteering: "Power Steering",

    brakeSystem: "Brake System",

    wiperMotor: "Wiper Motor"

};

// ---------- Demo Data ----------

const partInfo = {

    // ---------------- Exterior ----------------

    driverDoor: {
        Status: "Closed",
        Lock: "Locked",
        Window: "100%",
        Speaker: "OK"
    },

    passengerDoor: {
        Status: "Closed",
        Lock: "Locked",
        Window: "100%",
        Speaker: "OK"
    },

    hood: {
        Status: "Closed",
        Latch: "Locked"
    },

    hatch: {
        Status: "Closed",
        Latch: "Locked"
    },

    // ---------------- Engine ----------------

    engine: {
        RPM: "0",
        Coolant: "-- °F",
        OilPressure: "-- psi",
        AFR: "--.--"
    },

    battery: {
        Voltage: "14.2 V",
        Health: "Good",
        Charging: "Normal"
    },

    alternatorChargeSystem: {
        Output: "14.2 V",
        Current: "32 A",
        Status: "Charging"
    },

    intakeAirSystem: {
        MAF: "0.0 g/s",
        IAT: "78 °F",
        Filter: "OK"
    },

    distributorFiringSystem: {
        Timing: "10° BTDC",
        Spark: "Normal",
        PIP: "OK"
    },

    acCompressor: {
        Clutch: "Off",
        Pressure: "-- psi",
        Status: "Ready"
    },

    radiatorCoolingFanSystem: {
        Fan: "OFF",
        Coolant: "185 °F",
        Relay: "OK"
    },

    powerSteering: {
        Pressure: "Normal",
        Fluid: "OK"
    },

    brakeSystem: {
        Fluid: "Full",
        Booster: "OK",
        Warning: "Off"
    },

    wiperMotor: {
        Speed: "Off",
        Park: "OK"
    }

};

// ======================================================
// Load SVG
// ======================================================

async function loadVehicle(view = "top") {

    currentView = view;

    const container = document.getElementById("vehicleView");

    if (!container) return;

    try {

        const response = await fetch(
            `assets/vehicle/exterior/${vehicleViews[view]}`
        );

        if (!response.ok) {
            throw new Error("Unable to load SVG.");
        }

        container.innerHTML = await response.text();

        initializeVehicle();

        if (selectedPartId) {
            const part = document.getElementById(selectedPartId);
             
         // parts.forEach(p => console.log(p.id)); 
        

        if (part) {
                selectPart(part);
            }
        }

    } catch (err) {

        console.error(err);

        container.innerHTML = `
            <p style="color:red;">
                Failed to load vehicle view.
            </p>
        `;
    }
}

// ======================================================
// Initialize SVG
// ======================================================

function initializeVehicle() {

    const svgRoot = document.getElementById("vehicleView");

    if (!svgRoot) return;

    let parts;

    // Engine view only uses invisible click regions
    if (currentView === "engine") {

        const clickLayer = svgRoot.querySelector("#enginePartsClicks");

        if (!clickLayer) {
            console.error("enginePartsClicks layer not found.");
            return;
        }

        parts = clickLayer.querySelectorAll("[id]");

    } else {

        // Exterior views use every object with an ID
        parts = svgRoot.querySelectorAll("[id]");

    }

        // Hide all engine highlights
if (currentView === "engine") {

    const highlightLayer = svgRoot.querySelector("#engineHighlights");

    if (highlightLayer) {

        highlightLayer.querySelectorAll("[id]").forEach(highlight => {

            highlight.style.display = "none";

        });

    }

}

    console.log(parts);
    console.log(parts.length);

    parts.forEach(part => {

        if (
            part.id.startsWith("svg") ||
            part.id.startsWith("defs") ||
            part.id.startsWith("clipPath") ||
            part.id.startsWith("image")
        ) {
            return;
        }

        part.style.cursor = "pointer";

        part.addEventListener("mouseenter", () => {

            if (!part.classList.contains("selectedPart")) {
                part.style.opacity = "0.8";
            }

        });

        part.addEventListener("mouseleave", () => {

            if (!part.classList.contains("selectedPart")) {
                part.style.opacity = "1";
            }

        });

        part.addEventListener("click", () => {

            selectedPartId = part.id;
            selectPart(part);

        });

    });

}

// ======================================================
// Select Component
// ======================================================

function selectPart(part) {

    const svgRoot = document.getElementById("vehicleView");
    const info = document.getElementById("vehicleInfo");

    if (!svgRoot || !info) return;

    const realPartId = part.id.endsWith("Click")
        ? part.id.replace("Click", "")
        : part.id;

    // Reset all visible engine parts
    svgRoot.querySelectorAll("[id]").forEach(item => {

    item.classList.remove("selectedPart");
    item.style.opacity = "1";

});

// Hide all engine highlights
if (currentView === "engine") {

    const highlightLayer = svgRoot.querySelector("#engineHighlights");

    if (highlightLayer) {

        highlightLayer.querySelectorAll("[id]").forEach(highlight => {

            highlight.style.display = "none";

        });

        // Show matching highlight
        const highlightId =
            part.id.replace("Click", "Highlight");

        const selectedHighlight =
            document.getElementById(highlightId);

        if (selectedHighlight) {

            selectedHighlight.style.display = "inline";

        }

    }

}

    // Highlight the REAL artwork if it exists
    const visiblePart = document.getElementById(realPartId);

    if (visiblePart) {

        visiblePart.classList.add("selectedPart");

        visiblePart.style.transformOrigin = "center center";
        visiblePart.style.transform = "scale(1.006)";
        visiblePart.style.filter =
            "drop-shadow(0 0 10px #3E8FD6) brightness(1.15)";
    }

    // Driver door demo
    if (realPartId === "driverDoor") {

        doorStates.driverDoor = !doorStates.driverDoor;

        if (doorStates.driverDoor) {

            visiblePart.style.transformOrigin = "-20% 50%";
            visiblePart.style.transform =
                "rotate(-68deg) scale(1.05)";

        } else {

            visiblePart.style.transform =
                "rotate(0deg) scale(1.05)";

        }

    }

    const title = partNames[realPartId] || realPartId;

    let html = `
        <h2>${title}</h2>
        <hr style="margin:12px 0;border-color:#3E8FD6;">
    `;

    if (partInfo[realPartId]) {

        Object.entries(partInfo[realPartId]).forEach(([key, value]) => {

            html += `
                <p style="margin:10px 0;">
                    <strong>${key}:</strong> ${value}
                </p>
            `;

        });

    } else {

        html += `
            <p>No diagnostic data available yet.</p>
        `;

    }

    info.innerHTML = html;

}

// ======================================================
// Update Demo Data
// ======================================================

function updatePartData(partId, data) {

    partInfo[partId] = {
        ...(partInfo[partId] || {}),
        ...data
    };

    if (selectedPartId === partId) {

        const part = document.getElementById(partId);

        if (part) {
            selectPart(part);
        }

    }

}

// ======================================================
// Clear Selection
// ======================================================

function clearSelection() {

    const svgRoot = document.getElementById("vehicleView");

    if (!svgRoot) return;

    svgRoot.querySelectorAll("[id]").forEach(part => {

        part.classList.remove("selectedPart");
        part.style.opacity = "1";

    });

    selectedPartId = null;

    document.getElementById("vehicleInfo").innerHTML =
        "Select a component";

}

// ======================================================
// Startup
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    loadVehicle("front");

});
