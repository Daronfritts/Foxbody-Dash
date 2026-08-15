(() => {
  "use strict";
  const TICK_KEY = "foxbodyDash.appearance.tickColors";
  const TEXT_KEY = "foxbodyDash.appearance.gaugeTextColors";
  const SHIFT_KEY = "foxbodyDash.appearance.shiftBaseColors";
  const YELLOW_RPM = 5000;
  const RED_RPM = 6000;
  const readMap = key => { try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch { return {}; } };
  const writeMap = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  let tickColors = readMap(TICK_KEY), textColors = readMap(TEXT_KEY), shiftColors = readMap(SHIFT_KEY), currentRpm = 0, refreshQueued = false;
  const selectedNode = () => document.querySelector(".dashNode.selected");
  const selectedId = () => selectedNode()?.dataset?.id || null;
  function isGaugeNode(node) { return Boolean(node?.querySelector(".gaugeRenderLayer, .assemblyPart .gaugeSvg")); }
  function isShiftNode(node) { return Boolean(node?.querySelector(".shiftLight")); }
  function fallbackTickColor(id) { return tickColors[id] || document.getElementById("fieldTickColor")?.value || "#eeeeee"; }
  function colorsFor(id) { const fallback=fallbackTickColor(id); return {scale:fallback,title:fallback,unit:fallback,value:fallback,...(textColors[id]||{})}; }
  function applyTickColor(node,color){if(!node||!color)return;node.style.setProperty("--fox-gauge-tick-color",color);node.querySelectorAll(".gaugeTick, .gaugeMinor").forEach(line=>line.setAttribute("stroke",color));}
  function applyTextColors(node,colors){if(!node||!colors)return;node.querySelectorAll(".gaugeScaleNumber").forEach(el=>el.setAttribute("fill",colors.scale));node.querySelectorAll(".gaugeTitleText").forEach(el=>el.setAttribute("fill",colors.title));node.querySelectorAll(".gaugeUnitText").forEach(el=>el.setAttribute("fill",colors.unit));node.querySelectorAll(".gaugeLiveValue").forEach(el=>el.setAttribute("fill",colors.value));}
  function applyGaugePositionTweaks(){
    document.querySelectorAll(".dashNode[data-id]").forEach(node=>{
      if(!isGaugeNode(node))return;
      const rect=node.getBoundingClientRect();
      const isLarge=rect.width>=220||rect.height>=220;
      if(isLarge){
        /* The large RPM/speed live value is SVG text. Move the text itself in
           SVG coordinates so assembly top/left rules cannot cancel the move. */
        node.querySelectorAll(".gaugePartDigital.gaugeLiveValue").forEach(el=>{
          el.setAttribute("transform","translate(0 100)");
        });
      }else{
        node.querySelectorAll(".gaugePartLabel").forEach(el=>{
          const part=el.closest(".assemblyPart");
          if(!part||part.dataset.foxLabelOffset==="1")return;
          const top=part.style.top||"0%";
          part.style.top=`calc(${top} + 10px)`;
          part.dataset.foxLabelOffset="1";
        });
        node.querySelectorAll(".gaugeRenderLayer .gaugeTitleText").forEach(el=>el.setAttribute("transform","translate(0 70)"));
      }
    });
  }
  function applySavedGaugeAppearance(){document.querySelectorAll(".dashNode[data-id]").forEach(node=>{if(!isGaugeNode(node))return;const id=node.dataset.id,tick=tickColors[id];if(tick)applyTickColor(node,tick);applyTextColors(node,colorsFor(id));});}
  function applyShiftState(){document.querySelectorAll(".dashNode[data-id]").forEach(node=>{const shift=node.querySelector(".shiftLight");if(!shift)return;const base=shiftColors[node.dataset.id]||"#ffffff";shift.style.setProperty("--shift-base-color",base);shift.classList.toggle("shiftYellow",currentRpm>=YELLOW_RPM&&currentRpm<RED_RPM);shift.classList.toggle("shiftRed",currentRpm>=RED_RPM);shift.classList.remove("hot");});}
  function ensureGaugeTextControls(){const inspector=document.getElementById("inspector");if(!inspector||document.getElementById("gaugeTextColorFields"))return;const section=document.createElement("div");section.id="gaugeTextColorFields";section.className="propertySection";section.hidden=true;section.innerHTML=`<div class="propertySectionTitle">GAUGE TEXT COLORS</div><div class="colorGrid"><label>Scale numbers<input id="fieldGaugeScaleColor" type="color" value="#eeeeee" /></label><label>Name / title<input id="fieldGaugeTitleColor" type="color" value="#eeeeee" /></label><label>Unit<input id="fieldGaugeUnitColor" type="color" value="#eeeeee" /></label><label>Live value<input id="fieldGaugeValueColor" type="color" value="#eeeeee" /></label></div>`;document.getElementById("gaugeStyleFields")?.appendChild(section);[["fieldGaugeScaleColor","scale"],["fieldGaugeTitleColor","title"],["fieldGaugeUnitColor","unit"],["fieldGaugeValueColor","value"]].forEach(([inputId,key])=>{document.getElementById(inputId)?.addEventListener("input",e=>{const id=selectedId(),node=selectedNode();if(!id||!isGaugeNode(node))return;const current=colorsFor(id);current[key]=e.target.value;textColors[id]=current;writeMap(TEXT_KEY,textColors);applyTextColors(node,current);});});}
  function ensureShiftControls(){const inspector=document.getElementById("inspector");if(!inspector||document.getElementById("shiftAppearanceFields"))return;const section=document.createElement("div");section.id="shiftAppearanceFields";section.className="propertySection";section.hidden=true;section.innerHTML=`<div class="propertySectionTitle">SHIFT LIGHT</div><label>Base color<input id="fieldShiftBaseColor" type="color" value="#ffffff" /></label><div class="twoCol"><label>Yellow RPM<input type="number" value="${YELLOW_RPM}" disabled /></label><label>Red RPM<input type="number" value="${RED_RPM}" disabled /></label></div>`;const buttons=inspector.querySelector(".inspectorButtons");inspector.insertBefore(section,buttons||null);const input=section.querySelector("#fieldShiftBaseColor");input.addEventListener("input",()=>{const id=selectedId(),node=selectedNode();if(!id||!isShiftNode(node))return;shiftColors[id]=input.value;writeMap(SHIFT_KEY,shiftColors);applyShiftState();});}
  function syncInspectorPatch(){ensureGaugeTextControls();ensureShiftControls();const node=selectedNode(),id=selectedId();const gaugeSection=document.getElementById("gaugeTextColorFields");if(gaugeSection)gaugeSection.hidden=!isGaugeNode(node);if(id&&isGaugeNode(node)){const c=colorsFor(id);[["fieldGaugeScaleColor",c.scale],["fieldGaugeTitleColor",c.title],["fieldGaugeUnitColor",c.unit],["fieldGaugeValueColor",c.value]].forEach(([elId,value])=>{const el=document.getElementById(elId);if(el)el.value=value;});}const shiftSection=document.getElementById("shiftAppearanceFields"),shiftInput=document.getElementById("fieldShiftBaseColor");if(shiftSection)shiftSection.hidden=!isShiftNode(node);if(shiftInput&&id&&isShiftNode(node))shiftInput.value=shiftColors[id]||"#ffffff";}
  function bindTickPicker(){const picker=document.getElementById("fieldTickColor");if(!picker||picker.dataset.appearancePatchBound)return;picker.dataset.appearancePatchBound="1";picker.addEventListener("input",()=>{const node=selectedNode(),id=selectedId();if(!id||!isGaugeNode(node))return;tickColors[id]=picker.value;writeMap(TICK_KEY,tickColors);applyTickColor(node,picker.value);},true);}
  function refreshAppearance(){refreshQueued=false;bindTickPicker();syncInspectorPatch();applySavedGaugeAppearance();applyGaugePositionTweaks();applyShiftState();}
  function queueRefresh(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(refreshAppearance);}
  async function pollRpm(){try{const response=await fetch("/api/vehicle",{cache:"no-store"});if(response.ok){const data=await response.json();currentRpm=Number(data?.engine?.rpm)||0;}}catch{}applyShiftState();}
  const observer=new MutationObserver(queueRefresh);
  function start(){bindTickPicker();ensureGaugeTextControls();ensureShiftControls();refreshAppearance();observer.observe(document.body,{childList:true,subtree:true});pollRpm();setInterval(pollRpm,500);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
