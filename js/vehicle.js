// ======================================================
// FOXBODY DASH - VEHICLE PAGE
// Object-based SVG switching + reliable part interaction
// ======================================================

const vehicleViews = {
    front: { label: "FRONT VIEW", path: "../assets/vehicle/exterior/frontView.svg" },
    driver: { label: "DRIVER SIDE VIEW", path: "../assets/vehicle/exterior/driverSideView.svg" },
    passenger: { label: "PASSENGER SIDE VIEW", path: "../assets/vehicle/exterior/passengerSideView.svg" },
    top: { label: "TOP VIEW", path: "../assets/vehicle/exterior/topDownView.svg" },
    engine: { label: "ENGINE BAY VIEW", path: "../assets/vehicle/engine/engineBayView.svg" }
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
    driverWindow: { Position: "100%", Status: "Closed" },
    passengerWindow: { Position: "100%", Status: "Closed" },
    hood: { Status: "Closed", Latch: "Locked" },
    hatch: { Status: "Closed", Latch: "Locked" },
    leftHeadlight: { Status: "Off", Circuit: "OK" },
    rightHeadlight: { Status: "Off", Circuit: "OK" },
    leftSignal: { Status: "Off", Circuit: "OK" },
    rightSignal: { Status: "Off", Circuit: "OK" },
    engine: { RPM: "0", Coolant: "-- °F", OilPressure: "-- PSI", AFR: "--.--" },
    battery: { Voltage: "14.2 V", Health: "Good", Charging: "Normal" },
    alternatorChargeSystem: { Output: "14.2 V", Current: "-- A", Status: "Charging" },
    intakeAirSystem: { MAP: "-- kPa", IAT: "-- °F", Status: "OK" },
    distributorFiringSystem: { Timing: "10° BTDC", Spark: "Normal", PIP: "OK" },
    acCompressor: { Clutch: "Off", Status: "Ready" },
    radiatorCoolingFanSystem: { Fan: "OFF", Coolant: "-- °F", Status: "Ready" },
    powerSteering: { Status: "Normal", Fluid: "OK" },
    brakeSystem: { Fluid: "OK", Warning: "Off" },
    wiperMotor: { Speed: "Off", Park: "OK" }
};

const knownPartIds = new Set([
    ...Object.keys(partNames),
    ...Object.keys(partInfo)
]);

let currentView = "front";
let selectedPartId = null;
let hoveredElement = null;
let selectedVisual = null;

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
    selectedVisual = null;
    hoveredElement = null;
    setActiveButton(view);
    setViewLabel(view);

    if (info) {
        info.innerHTML = `<h2>${config.label}</h2><p>Loading vehicle view…</p>`;
    }

    // Force a new object load even when returning to a previously viewed SVG.
    object.data = `${config.path}?v=${Date.now()}`;
}

function realPartIdFromId(id = "") {
    return id
        .replace(/Click$/i, "")
        .replace(/Highlight$/i, "");
}

function findMeaningfulPart(target, svgRoot) {
    let node = target;
    let fallback = null;

    while (node && node !== svgRoot) {
        if (node.id) {
            const realId = realPartIdFromId(node.id);

            if (knownPartIds.has(realId) || /Click$/i.test(node.id)) {
                return { element: node, realId };
            }

            // Keep a named SVG group/path as a fallback, but ignore Inkscape noise.
            if (
                !fallback &&
                !/^(path|g|rect|circle|ellipse|image|text|tspan|use|layer)\d*$/i.test(node.id) &&
                !/^(svg|defs|clipPath)/i.test(node.id)
            ) {
                fallback = { element: node, realId };
            }
        }
        node = node.parentElement;
    }

    return fallback;
}

function findVisualForPart(svgDocument, realId, clickedElement) {
    const highlight = svgDocument.getElementById(`${realId}Highlight`);
    if (highlight) return highlight;

    const visible = svgDocument.getElementById(realId);
    if (visible) return visible;

    // If an invisible click region was hit and there is no explicit highlight,
    // outline its closest named parent rather than the transparent click shape.
    if (/Click$/i.test(clickedElement.id || "")) {
        let parent = clickedElement.parentElement;
        while (parent && parent !== svgDocument.documentElement) {
            if (parent.id && !/Click/i.test(parent.id)) return parent;
            parent = parent.parentElement;
        }
    }

    return clickedElement;
}

function rememberVisualStyle(element) {
    if (!element || element.dataset.foxSavedStyle === "1") return;
    element.dataset.foxSavedStyle = "1";
    element.dataset.foxStroke = element.style.stroke || "";
    element.dataset.foxStrokeWidth = element.style.strokeWidth || "";
    element.dataset.foxFilter = element.style.filter || "";
    element.dataset.foxOpacity = element.style.opacity || "";
    element.dataset.foxDisplay = element.style.display || "";
}

function restoreVisual(element) {
    if (!element || element.dataset.foxSavedStyle !== "1") return;
    element.style.stroke = element.dataset.foxStroke;
    element.style.strokeWidth = element.dataset.foxStrokeWidth;
    element.style.filter = element.dataset.foxFilter;
    element.style.opacity = element.dataset.foxOpacity;
    element.style.display = element.dataset.foxDisplay;
    element.classList.remove("selectedPart");
}

function applyHover(element) {
    if (!element || element === selectedVisual) return;
    rememberVisualStyle(element);
    element.style.filter = "drop-shadow(0 0 7px #3e8fd6) brightness(1.12)";
    element.style.opacity = "0.9";
}

function applySelection(element) {
    if (!element) return;
    rememberVisualStyle(element);
    element.style.display = "inline";
    element.style.opacity = "1";
    element.style.stroke = "#39a9ff";
    element.style.strokeWidth = "3px";
    element.style.filter = "drop-shadow(0 0 10px #168fff) drop-shadow(0 0 18px #168fff) brightness(1.18)";
    element.classList.add("selectedPart");
}

function renderPartInfo(realId) {
    const info = document.getElementById("vehicleInfo");
    if (!info) return;

    const title = partNames[realId] || realId.replace(/([a-z])([A-Z])/g, "$1 $2");
    const data = partInfo[realId];

    let html = `<h2>${title}</h2>`;
    if (data) {
        Object.entries(data).forEach(([key, value]) => {
            html += `<p><strong>${key}:</strong> ${value}</p>`;
        });
    } else {
        html += "<p>No live data is assigned to this component yet.</p>";
    }

    info.innerHTML = html;
}

function selectResolvedPart(resolved, svgDocument) {
    if (!resolved) return;

    if (hoveredElement && hoveredElement !== selectedVisual) {
        restoreVisual(hoveredElement);
    }
    hoveredElement = null;

    if (selectedVisual) restoreVisual(selectedVisual);

    selectedPartId = resolved.realId;
    selectedVisual = findVisualForPart(svgDocument, resolved.realId, resolved.element);
    applySelection(selectedVisual);
    renderPartInfo(resolved.realId);
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
            info.innerHTML = `<h2>${vehicleViews[currentView].label}</h2><p>Unable to access this SVG view.</p>`;
        }
        return;
    }

    const svgRoot = svgDocument.documentElement;
    svgRoot.style.cursor = "default";

    // Engine and other SVGs may contain dedicated highlight layers hidden by default.
    svgDocument.querySelectorAll('[id$="Highlight"]').forEach(highlight => {
        highlight.style.display = "none";
    });

    if (info) {
        info.innerHTML = `<h2>${vehicleViews[currentView].label}</h2><p>Click a vehicle component to show its outline and current information.</p>`;
    }

    // Event delegation works even when Inkscape nests the real part under many paths/groups.
    svgRoot.addEventListener("mousemove", event => {
        const resolved = findMeaningfulPart(event.target, svgRoot);
        const visual = resolved
            ? findVisualForPart(svgDocument, resolved.realId, resolved.element)
            : null;

        if (hoveredElement && hoveredElement !== visual && hoveredElement !== selectedVisual) {
            restoreVisual(hoveredElement);
        }

        hoveredElement = visual;
        if (visual && visual !== selectedVisual) applyHover(visual);
        svgRoot.style.cursor = resolved ? "pointer" : "default";
    });

    svgRoot.addEventListener("mouseleave", () => {
        if (hoveredElement && hoveredElement !== selectedVisual) restoreVisual(hoveredElement);
        hoveredElement = null;
    });

    svgRoot.addEventListener("click", event => {
        const resolved = findMeaningfulPart(event.target, svgRoot);
        if (!resolved) return;
        event.preventDefault();
        event.stopPropagation();
        selectResolvedPart(resolved, svgDocument);
    });
}

function updatePartData(partId, data) {
    partInfo[partId] = { ...(partInfo[partId] || {}), ...data };
    if (selectedPartId === partId) renderPartInfo(partId);
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

    if (object) object.addEventListener("load", initializeLoadedSvg);

    setActiveButton("front");
    setViewLabel("front");
});
