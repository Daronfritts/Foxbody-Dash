const GAUGE_LAYOUT_STORAGE_KEY = "foxbodyDash.gaugeLayout";

const GAUGE_LAYOUT_DEFAULTS = {
  focusGauge: "none",
  autoPromote: true,
  thresholds: {
    coolantHigh: 230,
    oilLow: 12,
    batteryLow: 11.5,
    batteryHigh: 16.0
  }
};

function getGaugeLayoutSettings(){
  try{
    const saved = JSON.parse(localStorage.getItem(GAUGE_LAYOUT_STORAGE_KEY) || "null");
    return {
      ...GAUGE_LAYOUT_DEFAULTS,
      ...(saved || {}),
      thresholds: {
        ...GAUGE_LAYOUT_DEFAULTS.thresholds,
        ...((saved && saved.thresholds) || {})
      }
    };
  }catch(error){
    console.warn("Gauge layout settings unavailable:", error);
    return JSON.parse(JSON.stringify(GAUGE_LAYOUT_DEFAULTS));
  }
}

const focusGaugeDefinitions = {
  rpm: {
    label: "RPM",
    min: 0,
    max: 8000,
    unit: "",
    majorTicks: 8,
    minorTicks: 40,
    labels: ["0","1","2","3","4","5","6","7","8"],
    subtitle: "x1000",
    redlineStart: 6000,
    read: () => tach.value
  },
  speed: {
    label: "MPH",
    min: 0,
    max: 200,
    unit: "",
    majorTicks: 10,
    minorTicks: 50,
    labels: ["0","20","40","60","80","100","120","140","160","180","200"],
    read: () => speed.value
  },
  fuel: {
    label: "FUEL",
    min: 0,
    max: 100,
    unit: "%",
    majorTicks: 4,
    minorTicks: 20,
    labels: ["E","","1/2","","F"],
    warningLow: 15,
    read: () => fuel.gauge.value
  },
  oil: {
    label: "OIL PSI",
    min: 0,
    max: 80,
    unit: "PSI",
    majorTicks: 4,
    minorTicks: 20,
    labels: ["0","","40","","80"],
    warningLow: 12,
    read: () => oil.gauge.value
  },
  coolant: {
    label: "COOLANT",
    min: 100,
    max: 260,
    unit: "°F",
    majorTicks: 4,
    minorTicks: 20,
    labels: ["C","","180","","H"],
    warningHigh: 230,
    read: () => coolant.gauge.value
  },
  battery: {
    label: "VOLTS",
    min: 10,
    max: 18,
    unit: "V",
    majorTicks: 4,
    minorTicks: 20,
    labels: ["10","","14","","18"],
    warningLow: 11.5,
    warningHigh: 16,
    read: () => battery.gauge.value
  }
};

const overlay = document.createElement("section");
overlay.id = "focusGaugeOverlay";
overlay.setAttribute("aria-live", "polite");
overlay.innerHTML = `
  <div id="focusGaugeCard">
    <div id="focusGaugeLabel">FOCUS GAUGE</div>
    <button class="focusDismiss" type="button" aria-label="Dismiss focus gauge">×</button>
    <div id="focusGaugeCanvas"></div>
    <div id="focusGaugeReason"></div>
  </div>
`;

document.getElementById("dashboard").appendChild(overlay);

let focusGauge = null;
let activeGaugeKey = null;
let dismissedAutomaticGauge = null;

function determineAutomaticGauge(settings){
  if(!settings.autoPromote) return null;

  const oilValue = Number(focusGaugeDefinitions.oil.read());
  const coolantValue = Number(focusGaugeDefinitions.coolant.read());
  const batteryValue = Number(focusGaugeDefinitions.battery.read());
  const rpmValue = Number(focusGaugeDefinitions.rpm.read());

  if(rpmValue > 500 && Number.isFinite(oilValue) && oilValue <= settings.thresholds.oilLow){
    return {key:"oil", reason:`LOW OIL PRESSURE — ${Math.round(oilValue)} PSI`};
  }
  if(Number.isFinite(coolantValue) && coolantValue >= settings.thresholds.coolantHigh){
    return {key:"coolant", reason:`ENGINE TEMP HIGH — ${Math.round(coolantValue)}°F`};
  }
  if(Number.isFinite(batteryValue) && batteryValue <= settings.thresholds.batteryLow){
    return {key:"battery", reason:`SYSTEM VOLTAGE LOW — ${batteryValue.toFixed(1)} V`};
  }
  if(Number.isFinite(batteryValue) && batteryValue >= settings.thresholds.batteryHigh){
    return {key:"battery", reason:`SYSTEM VOLTAGE HIGH — ${batteryValue.toFixed(1)} V`};
  }
  return null;
}

function buildFocusGauge(key){
  const def = focusGaugeDefinitions[key];
  if(!def) return;

  focusGauge = new Gauge("focusGaugeCanvas", def.min, def.max, def.read(), def.label, {
    majorTicks: def.majorTicks,
    minorTicks: def.minorTicks,
    labels: def.labels,
    unit: def.unit,
    redlineStart: def.redlineStart ?? null,
    warningLow: def.warningLow ?? null,
    warningHigh: def.warningHigh ?? null,
    title: def.label,
    subtitle: def.subtitle ?? def.unit,
    variant: "main",
    showValue: true,
    size: 430,
    radius: 176,
    needleLength: 132
  });
  activeGaugeKey = key;
}

function renderFocusGauge(){
  const settings = getGaugeLayoutSettings();
  const automatic = determineAutomaticGauge(settings);
  const automaticVisible = automatic && automatic.key !== dismissedAutomaticGauge;
  const key = automaticVisible ? automatic.key : settings.focusGauge;
  const reason = automaticVisible ? automatic.reason : (key !== "none" ? "MANUAL FOCUS" : "");

  if(!key || key === "none"){
    overlay.classList.remove("active");
    activeGaugeKey = null;
    focusGauge = null;
    document.getElementById("focusGaugeCanvas").innerHTML = "";
    return;
  }

  if(activeGaugeKey !== key || !focusGauge){
    buildFocusGauge(key);
  }

  const def = focusGaugeDefinitions[key];
  focusGauge.setValue(def.read(), true);
  document.getElementById("focusGaugeLabel").textContent = `${def.label} — FOCUS`;
  document.getElementById("focusGaugeReason").textContent = reason;
  overlay.classList.add("active");

  if(!automatic || automatic.key !== dismissedAutomaticGauge){
    if(!automatic) dismissedAutomaticGauge = null;
  }
}

overlay.querySelector(".focusDismiss").addEventListener("click", () => {
  const settings = getGaugeLayoutSettings();
  const automatic = determineAutomaticGauge(settings);
  if(automatic){
    dismissedAutomaticGauge = automatic.key;
  }else{
    settings.focusGauge = "none";
    localStorage.setItem(GAUGE_LAYOUT_STORAGE_KEY, JSON.stringify(settings));
  }
  renderFocusGauge();
});

window.addEventListener("storage", renderFocusGauge);
setInterval(renderFocusGauge, 250);
renderFocusGauge();
