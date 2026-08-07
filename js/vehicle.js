// ======================================================
// FOXBODY DASH - VEHICLE PAGE
// Working object-based SVG view switching
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

function loadVehicle(view) {
    const config = vehicleViews[view];
    const object = document.getElementById("vehicleObject");
    const info = document.getElementById("vehicleInfo");

    if (!config || !object) return;

    currentView = view;
    selectedPartId = null;
    setActiveButton(view);
    setViewLabel(view);

    if (info) {
        info.innerHTML = `
            <h2>${config.label}</h2>
            <p>Loading vehicle view…</p>
        `;
    }

    object.data = config.path;
}

function initializeLoadedSvg() {
    const object = document.getElementById("vehicleObject");
    const info = document.getElementById("vehicleInfo");
    if (!object) return;

    let svgDocument;

    try {
        svgDocument = object.contentDocument;
    } catch (error) {
        console.error("Unable to access SVG document:", error);
        return;
    }

    if (!svgDocument || !svgDocument.documentElement) {
        if (info) {
            info.innerHTML = `
                <h2>${vehicleViews[currentView].label}</h2>
                <p>Unable to access this SVG view.</p>
            `;
        }
        return;
    }

    if (info) {
        info.innerHTML = `
            <h2>${vehicleViews[currentView].label}</h2>
            <p>Select a vehicle component for information.</p>
        `;
    }

    svgDocument.querySelectorAll("[id]").forEach(part => {
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
            selectPart(part, svgDocument);
        });
    });
}

function selectPart(part, svgDocument) {
    const info = document.getElementById("vehicleInfo");
    if (!part || !svgDocument || !info) return;

    svgDocument.querySelectorAll(".selectedPart").forEach(item => {
        item.classList.remove("selectedPart");
        item.style.opacity = "1";
        item.style.filter = "";
    });

    selectedPartId = part.id;
    part.classList.add("selectedPart");
    part.style.opacity = "1";
    part.style.filter = "drop-shadow(0 0 10px #3e8fd6) brightness(1.15)";

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

function updatePartData(partId, data) {
    partInfo[partId] = {
        ...(partInfo[partId] || {}),
        ...data
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const object = document.getElementById("vehicleObject");

    document.querySelectorAll(".vehicleViewButton").forEach(button => {
        button.addEventListener("click", () => loadVehicle(button.dataset.view));
    });

    const homeButton = document.getElementById("vehicleHome");
    if (homeButton) {
        homeButton.addEventListener("click", () => {
            window.location.href = "../index.html";
        });
    }

    if (object) {
        object.addEventListener("load", initializeLoadedSvg);
    }

    setActiveButton("front");
    setViewLabel("front");
});
