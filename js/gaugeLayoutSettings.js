const STORAGE_KEY = "foxbodyDash.gaugeLayout";

const defaults = {
  focusGauge: "none",
  autoPromote: true,
  thresholds: {
    coolantHigh: 230,
    oilLow: 12,
    batteryLow: 11.5,
    batteryHigh: 16.0
  }
};

function loadSettings(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return {
      ...defaults,
      ...(saved || {}),
      thresholds: {...defaults.thresholds,...((saved && saved.thresholds) || {})}
    };
  }catch(error){
    console.warn("Gauge layout settings could not be read:", error);
    return structuredClone(defaults);
  }
}

let settings = loadSettings();

const saveStatus = document.getElementById("saveStatus");
const autoPromote = document.getElementById("autoPromote");
const coolantHigh = document.getElementById("coolantHigh");
const oilLow = document.getElementById("oilLow");
const batteryLow = document.getElementById("batteryLow");
const batteryHigh = document.getElementById("batteryHigh");

function flashSaved(){
  saveStatus.style.opacity = "1";
  clearTimeout(flashSaved.timer);
  flashSaved.timer = setTimeout(() => saveStatus.style.opacity = ".5", 700);
}

function saveSettings(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  flashSaved();
}

function render(){
  document.querySelectorAll(".gaugeChoice").forEach(button => {
    const active = button.dataset.gauge === settings.focusGauge;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", active ? "true" : "false");
  });
  autoPromote.checked = settings.autoPromote;
  coolantHigh.value = settings.thresholds.coolantHigh;
  oilLow.value = settings.thresholds.oilLow;
  batteryLow.value = settings.thresholds.batteryLow;
  batteryHigh.value = settings.thresholds.batteryHigh;
}

document.querySelectorAll(".gaugeChoice").forEach(button => {
  button.addEventListener("click", () => {
    settings.focusGauge = button.dataset.gauge;
    saveSettings();
    render();
  });
});

autoPromote.addEventListener("change", () => {
  settings.autoPromote = autoPromote.checked;
  saveSettings();
});

function bindNumber(input, key){
  input.addEventListener("change", () => {
    const value = Number(input.value);
    if(Number.isFinite(value)){
      settings.thresholds[key] = value;
      saveSettings();
    }
    render();
  });
}

bindNumber(coolantHigh,"coolantHigh");
bindNumber(oilLow,"oilLow");
bindNumber(batteryLow,"batteryLow");
bindNumber(batteryHigh,"batteryHigh");

document.getElementById("resetButton").addEventListener("click", () => {
  settings = JSON.parse(JSON.stringify(defaults));
  saveSettings();
  render();
});

document.getElementById("backButton").addEventListener("click", () => window.location.href = "../index.html");
document.getElementById("openDashButton").addEventListener("click", () => window.location.href = "../index.html");

render();
