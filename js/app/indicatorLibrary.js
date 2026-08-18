(() => {
  "use strict";

  const STORAGE = "foxbodyDash.studio.v7";
  const SOURCE_OPTIONS = [
    ["none", "None / Always visible"],
    ["lights.left_turn", "Left Turn"],
    ["lights.right_turn", "Right Turn"],
    ["lights.headlights", "Headlights"],
    ["lights.high_beams", "High Beams"],
    ["lights.fog", "Fog Lights"],
    ["lights.parking", "Parking Lights"],
  ];
  const ALERT_OPTIONS = [
    ["warnings.abs", "ABS"],
    ["warnings.battery", "Battery"],
    ["warnings.brake", "Brake"],
    ["warnings.checkEngine", "Check Engine"],
    ["warnings.coolant", "Coolant"],
    ["warnings.doorAjar", "Door Ajar"],
    ["warnings.lowFuel", "Low Fuel"],
    ["warnings.oil", "Oil Pressure"],
    ["warnings.seatbelt", "Seatbelt"],
    ["warnings.security", "Security"],
    ["warnings.tpms", "TPMS"],
  ];

  let indicatorAssets = [];
  let live = {};

  const read = (obj, path) => path && path !== "none"
    ? path.split(".").reduce((value, key) => value?.[key], obj)
    : undefined;

  const slug = value => String(value || "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-");

  function inferSource(fileName) {
    const name = slug(fileName);
    if (/left.*turn|turn.*left|left-arrow/.test(name)) return "lights.left_turn";
    if (/right.*turn|turn.*right|right-arrow/.test(name)) return "lights.right_turn";
    if (/high.?beam/.test(name)) return "lights.high_beams";
    if (/head.?light/.test(name)) return "lights.headlights";
    if (/fog/.test(name)) return "lights.fog";
    if (/park.*light|marker/.test(name)) return "lights.parking";
    return "none";
  }

  function sourceLabel(source) {
    return SOURCE_OPTIONS.find(([value]) => value === source)?.[1] || "Custom Indicator";
  }

  function loadLayout() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || "null");
    } catch (error) {
      console.warn("Indicator layout read failed", error);
      return null;
    }
  }

  function saveLayout(layout) {
    localStorage.setItem(STORAGE, JSON.stringify(layout));
  }

  function addIndicator(asset) {
    const layout = loadLayout();
    if (!layout?.items) return;

    const dataSource = inferSource(asset.file || asset.name);
    layout.items.push({
      id: `indicator-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      type: "icon",
      name: asset.name || "Indicator",
      assetUrl: asset.url,
      dataSource,
      x: 10,
      y: 10,
      w: 8,
      h: 10,
      z: Date.now(),
      visible: true,
      opacity: 1,
      rotation: 0,
      lockAspect: true,
      transparentSurface: true,
      material: "none",
      scaleMode: "contain",
      config: { role: "indicator" },
    });
    saveLayout(layout);
    location.reload();
  }

  function makeCard(asset) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "libraryCard";
    const dataSource = inferSource(asset.file || asset.name);
    button.innerHTML = `<span>${asset.name}</span><small>${sourceLabel(dataSource).toUpperCase()}</small>`;
    button.addEventListener("click", () => addIndicator(asset));
    return button;
  }

  function renderIndicatorLibrary() {
    const library = document.getElementById("libraryItems");
    const tab = document.querySelector('[data-library="indicators"]');
    if (!library || !tab?.classList.contains("active")) return;

    library.replaceChildren();
    const note = document.createElement("div");
    note.className = "alertPickerNote";
    note.textContent = "Custom headlight, high-beam, turn-signal and other indicator artwork from assets/icons/dashboard/indicators.";
    library.appendChild(note);

    if (!indicatorAssets.length) {
      const empty = document.createElement("div");
      empty.className = "alertPickerNote";
      empty.textContent = "No indicator artwork yet. Drop SVG/PNG files into the indicators folder and refresh.";
      library.appendChild(empty);
      return;
    }

    indicatorAssets.forEach(asset => library.appendChild(makeCard(asset)));
  }

  async function loadAssets() {
    try {
      const response = await fetch("/api/assets");
      if (!response.ok) return;
      const assets = await response.json();
      indicatorAssets = assets.indicators || [];
      renderIndicatorLibrary();
    } catch (error) {
      console.warn("Indicator asset API unavailable", error);
    }
  }

  function dynamicIconItems() {
    const layout = loadLayout();
    return (layout?.items || []).filter(item =>
      item.type === "icon" &&
      (item.config?.role === "indicator" || item.config?.role === "alert")
    );
  }

  function syncDynamicIconVisibility() {
    const editing = document.getElementById("foxApp")?.classList.contains("editing");
    dynamicIconItems().forEach(item => {
      const node = document.querySelector(`.dashNode[data-id="${CSS.escape(item.id)}"]`);
      if (!node) return;
      const surface = node.querySelector(".nodeSurface");
      if (!surface) return;
      if (!item.dataSource || item.dataSource === "none") {
        surface.style.opacity = "1";
        return;
      }
      const active = Boolean(read(live, item.dataSource));
      surface.style.opacity = active ? "1" : (editing ? "0.25" : "0");
    });
  }

  function syncSelectedDynamicDataOptions() {
    const selectedNode = document.querySelector(".dashNode.selected");
    const select = document.getElementById("fieldData");
    if (!selectedNode || !select) return;

    const item = dynamicIconItems().find(candidate => candidate.id === selectedNode.dataset.id);
    if (!item) return;

    const isAlert = item.config?.role === "alert" || String(item.dataSource || "").startsWith("warnings.");
    const options = isAlert ? [["none", "None / Always visible"], ...ALERT_OPTIONS] : SOURCE_OPTIONS;
    const current = item.dataSource || "none";
    const signature = `${isAlert ? "alert" : "indicator"}:${current}`;
    if (select.dataset.dynamicIconSignature === signature) return;

    select.replaceChildren();
    const group = document.createElement("optgroup");
    group.label = isAlert ? "ALERTS" : "INDICATOR LIGHTS";
    options.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      group.appendChild(option);
    });
    select.appendChild(group);
    select.value = current;
    select.dataset.dynamicIconSignature = signature;
  }

  async function pollLive() {
    try {
      const response = await fetch("/api/vehicle");
      if (response.ok) live = await response.json();
    } catch (_) {}
    syncDynamicIconVisibility();
  }

  function init() {
    const tab = document.querySelector('[data-library="indicators"]');
    if (tab) tab.addEventListener("click", () => setTimeout(renderIndicatorLibrary, 0));

    const observer = new MutationObserver(() => {
      syncSelectedDynamicDataOptions();
      syncDynamicIconVisibility();
    });
    const app = document.getElementById("foxApp");
    if (app) observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

    loadAssets();
    pollLive();
    setInterval(pollLive, 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
