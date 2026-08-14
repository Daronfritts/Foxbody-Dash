(() => {
  "use strict";
  const TICK_KEY = "foxbodyDash.appearance.tickColors";
  const SHIFT_KEY = "foxbodyDash.appearance.shiftBaseColors";
  const YELLOW_RPM = 5000;
  const RED_RPM = 6000;
  const readMap = key => { try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch { return {}; } };
  const writeMap = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  let tickColors = readMap(TICK_KEY), shiftColors = readMap(SHIFT_KEY), currentRpm = 0, refreshQueued = false;
  const selectedNode = () => document.querySelector(".dashNode.selected");
  const selectedId = () => selectedNode()?.dataset?.id || null;
  function isGaugeNode(node) { return Boolean(node?.querySelector(".gaugeRenderLayer, .assemblyPart .gaugeSvg")); }
  function isShiftNode(node) { return Boolean(node?.querySelector(".shiftLight")); }
  function applyTickColor(node, color) {
    if (!node || !color) return;
    node.querySelectorAll(".gaugeSvg line").forEach(line => {
      if (line.closest(".gaugeNeedleGroup")) return;
      const group = line.closest(".gaugeRenderLayer, .assemblyPart");
      if (group) line.setAttribute("stroke", color);
    });
    // Keep every gauge text element (scale numbers, title/unit, live value,
    // and assembly label/digital parts) tied to the selected tick color.
    node.querySelectorAll(".gaugeSvg text").forEach(text => text.setAttribute("fill", color));
  }
  function applySavedTickColors() {
    document.querySelectorAll(".dashNode[data-id]").forEach(node => {
      const color = tickColors[node.dataset.id];
      if (color && isGaugeNode(node)) applyTickColor(node, color);
    });
  }
  function applyShiftState() {
    document.querySelectorAll(".dashNode[data-id]").forEach(node => {
      const shift = node.querySelector(".shiftLight"); if (!shift) return;
      const base = shiftColors[node.dataset.id] || "#ffffff";
      shift.style.setProperty("--shift-base-color", base);
      shift.classList.toggle("shiftYellow", currentRpm >= YELLOW_RPM && currentRpm < RED_RPM);
      shift.classList.toggle("shiftRed", currentRpm >= RED_RPM);
      shift.classList.remove("hot");
    });
  }
  function ensureShiftControls() {
    const inspector = document.getElementById("inspector");
    if (!inspector || document.getElementById("shiftAppearanceFields")) return;
    const section = document.createElement("div"); section.id="shiftAppearanceFields"; section.className="propertySection"; section.hidden=true;
    section.innerHTML=`<div class="propertySectionTitle">SHIFT LIGHT</div><label>Base color<input id="fieldShiftBaseColor" type="color" value="#ffffff" /></label><div class="twoCol"><label>Yellow RPM<input type="number" value="${YELLOW_RPM}" disabled /></label><label>Red RPM<input type="number" value="${RED_RPM}" disabled /></label></div>`;
    const buttons=inspector.querySelector(".inspectorButtons"); inspector.insertBefore(section,buttons||null);
    const input=section.querySelector("#fieldShiftBaseColor"); input.addEventListener("input",()=>{const id=selectedId(),node=selectedNode();if(!id||!isShiftNode(node))return;shiftColors[id]=input.value;writeMap(SHIFT_KEY,shiftColors);applyShiftState();});
  }
  function syncInspectorPatch(){ensureShiftControls();const node=selectedNode(),id=selectedId(),section=document.getElementById("shiftAppearanceFields"),input=document.getElementById("fieldShiftBaseColor");if(section)section.hidden=!isShiftNode(node);if(input&&id&&isShiftNode(node))input.value=shiftColors[id]||"#ffffff";}
  function bindTickPicker(){const picker=document.getElementById("fieldTickColor");if(!picker||picker.dataset.appearancePatchBound)return;picker.dataset.appearancePatchBound="1";picker.addEventListener("input",()=>{const node=selectedNode(),id=selectedId();if(!id||!isGaugeNode(node))return;tickColors[id]=picker.value;writeMap(TICK_KEY,tickColors);applyTickColor(node,picker.value);},true);}
  function refreshAppearance(){refreshQueued=false;bindTickPicker();syncInspectorPatch();applySavedTickColors();applyShiftState();}
  function queueRefresh(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(refreshAppearance);}
  async function pollRpm(){try{const response=await fetch("/api/vehicle",{cache:"no-store"});if(response.ok){const data=await response.json();currentRpm=Number(data?.engine?.rpm)||0;}}catch{}applyShiftState();}
  const observer=new MutationObserver(queueRefresh);
  function start(){bindTickPicker();ensureShiftControls();refreshAppearance();observer.observe(document.body,{childList:true,subtree:true});pollRpm();setInterval(pollRpm,500);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
