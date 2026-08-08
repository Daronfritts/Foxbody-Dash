const STORAGE_KEY = "foxbodyDash.gaugeLayout";

const DEFAULT_ITEMS = [
  {id:"rpm",type:"gauge",label:"RPM",x:7,y:8,w:24,h:42,size:"large"},
  {id:"speed",type:"gauge",label:"SPEED",x:69,y:8,w:24,h:42,size:"large"},
  {id:"fuel",type:"gauge",label:"FUEL",x:12,y:58,w:14,h:24,size:"small"},
  {id:"oil",type:"gauge",label:"OIL PSI",x:31,y:58,w:14,h:24,size:"small"},
  {id:"coolant",type:"gauge",label:"COOLANT",x:55,y:58,w:14,h:24,size:"small"},
  {id:"battery",type:"gauge",label:"VOLTS",x:74,y:58,w:14,h:24,size:"small"},
  {id:"info",type:"info",label:"DRIVER INFO",x:40,y:13,w:20,h:40,size:"medium"},
  {id:"shift",type:"shift",label:"SHIFT LIGHT",x:43,y:2,w:14,h:12,size:"medium"}
];

const defaults = {
  focusGauge:"none",
  customLayoutEnabled:false,
  autoPromote:true,
  layout:{mode:"freeform",items:DEFAULT_ITEMS},
  thresholds:{coolantHigh:230,oilLow:12,batteryLow:11.5,batteryHigh:16.0}
};

const clone = value => JSON.parse(JSON.stringify(value));

function migrateItems(savedItems){
  if(!Array.isArray(savedItems)) return clone(DEFAULT_ITEMS);
  if(savedItems.some(item => typeof item.x === "number")){
    const merged = clone(DEFAULT_ITEMS);
    savedItems.forEach(saved => {
      const id = saved.id || saved.gauge;
      const target = merged.find(item => item.id === id);
      if(target) Object.assign(target,saved,{id,type:saved.type || target.type});
    });
    return merged;
  }
  return clone(DEFAULT_ITEMS);
}

function loadSettings(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    return {
      ...clone(defaults),
      ...saved,
      thresholds:{...defaults.thresholds,...(saved.thresholds || {})},
      layout:{mode:"freeform",items:migrateItems(saved.layout?.items)}
    };
  }catch(error){
    console.warn("Gauge layout settings could not be read:", error);
    return clone(defaults);
  }
}

let settings = loadSettings();
let selectedId = settings.layout.items[0]?.id || "rpm";
let dragState = null;

const editor = document.getElementById("layoutEditor");
const saveStatus = document.getElementById("saveStatus");
const selectedLabel = document.getElementById("selectedGaugeLabel");
const customLayoutEnabled = document.getElementById("customLayoutEnabled");
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

function itemFor(id){ return settings.layout.items.find(item => item.id === id); }
function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }

const ITEM_GAP = 0.35;
function itemsOverlap(a,b,gap=ITEM_GAP){
  return a.x < b.x + b.w + gap &&
         a.x + a.w + gap > b.x &&
         a.y < b.y + b.h + gap &&
         a.y + a.h + gap > b.y;
}

function positionAllowed(candidate,ignoreId){
  if(!Number.isFinite(candidate.x)||!Number.isFinite(candidate.y)||!Number.isFinite(candidate.w)||!Number.isFinite(candidate.h)) return false;
  if(candidate.w<=0||candidate.h<=0||candidate.x<0||candidate.y<0||candidate.x+candidate.w>100||candidate.y+candidate.h>100) return false;
  return !settings.layout.items.some(other=>other.id!==ignoreId&&itemsOverlap(candidate,other));
}

function sizeFor(item,size){
  const presets = item.type === "gauge"
    ? {small:{w:14,h:24},medium:{w:19,h:32},large:{w:25,h:43}}
    : item.type === "info"
      ? {small:{w:16,h:28},medium:{w:20,h:40},large:{w:27,h:50}}
      : {small:{w:10,h:8},medium:{w:14,h:12},large:{w:20,h:16}};
  return presets[size] || presets.medium;
}

function renderPreview(tile,item){
  if(item.type === "info"){
    tile.innerHTML = `<span class="dragGrip">⋮⋮</span><div class="infoPreview"><b>12:00 PM</b><strong>GEAR 3</strong><span>184,232 MI</span><span>TRIP 123.4</span></div>`;
    return;
  }
  if(item.type === "shift"){
    tile.innerHTML = `<span class="dragGrip">⋮⋮</span><div class="shiftPreview"><span>FOXBODY GT</span><img src="../assets/images/mustangWhite.svg" alt="" /></div>`;
    return;
  }
  tile.innerHTML = `<span class="dragGrip">⋮⋮</span><div class="roundGaugePreview"><strong>${item.label}</strong><span>${item.size.toUpperCase()}</span></div>`;
}

function renderEditor(){
  editor.innerHTML = "";
  settings.layout.items.forEach(item => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `freeItem freeItem--${item.type}`;
    tile.dataset.id = item.id;
    tile.style.left = `${item.x}%`;
    tile.style.top = `${item.y}%`;
    tile.style.width = `${item.w}%`;
    tile.style.height = `${item.h}%`;
    renderPreview(tile,item);
    tile.classList.toggle("selected",item.id === selectedId);
    tile.addEventListener("click",()=>{selectedId=item.id;renderEditor();});
    tile.addEventListener("pointerdown",beginDrag);
    editor.appendChild(tile);
  });

  const selected = itemFor(selectedId);
  selectedLabel.textContent = selected?.label || selectedId.toUpperCase();
  document.querySelectorAll("[data-size]").forEach(button=>button.classList.toggle("active",button.dataset.size === (selected?.size || "medium")));
  customLayoutEnabled.checked = settings.customLayoutEnabled;
  autoPromote.checked = settings.autoPromote;
  coolantHigh.value = settings.thresholds.coolantHigh;
  oilLow.value = settings.thresholds.oilLow;
  batteryLow.value = settings.thresholds.batteryLow;
  batteryHigh.value = settings.thresholds.batteryHigh;
}

function beginDrag(event){
  if(event.button !== undefined && event.button !== 0) return;
  const tile = event.currentTarget;
  selectedId = tile.dataset.id;
  const item = itemFor(selectedId);
  const editorRect = editor.getBoundingClientRect();
  dragState = {
    pointerId:event.pointerId,tile,item,
    startX:event.clientX,startY:event.clientY,
    originX:item.x,originY:item.y,
    lastValidX:item.x,lastValidY:item.y,
    editorRect,moved:false
  };
  tile.setPointerCapture?.(event.pointerId);
  tile.classList.add("dragging");
  tile.addEventListener("pointermove",dragMove);
  tile.addEventListener("pointerup",endDrag,{once:true});
  tile.addEventListener("pointercancel",endDrag,{once:true});
}

function dragMove(event){
  if(!dragState || event.pointerId !== dragState.pointerId) return;
  const dx = ((event.clientX-dragState.startX)/dragState.editorRect.width)*100;
  const dy = ((event.clientY-dragState.startY)/dragState.editorRect.height)*100;
  if(Math.hypot(dx,dy) > .5) dragState.moved = true;
  if(!dragState.moved) return;
  event.preventDefault();
  const item = dragState.item;
  const candidate = {
    ...item,
    x:clamp(dragState.originX + dx,0,100-item.w),
    y:clamp(dragState.originY + dy,0,100-item.h)
  };

  if(positionAllowed(candidate,item.id)){
    item.x = candidate.x;
    item.y = candidate.y;
    dragState.lastValidX = item.x;
    dragState.lastValidY = item.y;
    dragState.tile.classList.remove("blocked");
  }else{
    item.x = dragState.lastValidX;
    item.y = dragState.lastValidY;
    dragState.tile.classList.add("blocked");
  }
  dragState.tile.style.left = `${item.x}%`;
  dragState.tile.style.top = `${item.y}%`;
}

function endDrag(){
  if(!dragState) return;
  dragState.tile.classList.remove("dragging","blocked");
  dragState.tile.removeEventListener("pointermove",dragMove);
  if(dragState.moved) saveSettings();
  dragState = null;
  renderEditor();
}

function setSelectedSize(size){
  const item = itemFor(selectedId); if(!item) return;
  const dims = sizeFor(item,size);
  const candidate = {
    ...item,
    size,
    w:dims.w,
    h:dims.h,
    x:clamp(item.x,0,100-dims.w),
    y:clamp(item.y,0,100-dims.h)
  };
  if(!positionAllowed(candidate,item.id)) return;
  Object.assign(item,candidate);
  saveSettings(); renderEditor();
}

document.querySelectorAll("[data-size]").forEach(button=>button.addEventListener("click",()=>setSelectedSize(button.dataset.size)));
customLayoutEnabled.addEventListener("change",()=>{settings.customLayoutEnabled=customLayoutEnabled.checked;saveSettings();});
autoPromote.addEventListener("change",()=>{settings.autoPromote=autoPromote.checked;saveSettings();});

function bindNumber(input,key){
  input.addEventListener("change",()=>{const value=Number(input.value);if(Number.isFinite(value)){settings.thresholds[key]=value;saveSettings();}renderEditor();});
}
bindNumber(coolantHigh,"coolantHigh"); bindNumber(oilLow,"oilLow"); bindNumber(batteryLow,"batteryLow"); bindNumber(batteryHigh,"batteryHigh");

document.getElementById("resetButton").addEventListener("click",()=>{settings=clone(defaults);selectedId="rpm";saveSettings();renderEditor();});
document.getElementById("backButton").addEventListener("click",()=>window.location.href="../index.html");
document.getElementById("openDashButton").addEventListener("click",()=>window.location.href="../index.html");

renderEditor();
