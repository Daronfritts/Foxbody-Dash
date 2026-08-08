const STORAGE_KEY = "foxbodyDash.gaugeLayout";

const DEFAULT_ITEMS = [
  {gauge:"rpm",label:"RPM",row:1,col:1,w:2,h:2},
  {gauge:"speed",label:"SPEED",row:1,col:3,w:2,h:2},
  {gauge:"fuel",label:"FUEL",row:1,col:5,w:1,h:1},
  {gauge:"oil",label:"OIL PSI",row:1,col:6,w:1,h:1},
  {gauge:"coolant",label:"COOLANT",row:2,col:5,w:1,h:1},
  {gauge:"battery",label:"VOLTS",row:2,col:6,w:1,h:1}
];

const defaults = {
  focusGauge:"none",
  customLayoutEnabled:false,
  autoPromote:true,
  layout:{columns:6,rows:3,items:DEFAULT_ITEMS},
  thresholds:{coolantHigh:230,oilLow:12,batteryLow:11.5,batteryHigh:16.0}
};

const clone = value => JSON.parse(JSON.stringify(value));

function loadSettings(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    return {
      ...clone(defaults),
      ...saved,
      thresholds:{...defaults.thresholds,...(saved.thresholds || {})},
      layout:{...clone(defaults.layout),...(saved.layout || {}),items:Array.isArray(saved.layout?.items) ? saved.layout.items : clone(DEFAULT_ITEMS)}
    };
  }catch(error){
    console.warn("Gauge layout settings could not be read:", error);
    return clone(defaults);
  }
}

let settings = loadSettings();
let selectedGauge = settings.layout.items[0]?.gauge || "rpm";
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

function itemFor(gauge){ return settings.layout.items.find(item => item.gauge === gauge); }

function rectsOverlap(a,b){
  return a.col < b.col + b.w && a.col + a.w > b.col && a.row < b.row + b.h && a.row + a.h > b.row;
}

function positionValid(candidate, ignoreGauge){
  if(candidate.col < 1 || candidate.row < 1 || candidate.col + candidate.w - 1 > settings.layout.columns || candidate.row + candidate.h - 1 > settings.layout.rows) return false;
  return !settings.layout.items.some(item => item.gauge !== ignoreGauge && rectsOverlap(candidate,item));
}

function findNearestOpen(item, targetCol, targetRow){
  const candidates=[];
  for(let row=1;row<=settings.layout.rows;row++){
    for(let col=1;col<=settings.layout.columns;col++){
      const candidate={...item,row,col};
      if(positionValid(candidate,item.gauge)) candidates.push(candidate);
    }
  }
  candidates.sort((a,b)=>Math.hypot(a.col-targetCol,a.row-targetRow)-Math.hypot(b.col-targetCol,b.row-targetRow));
  return candidates[0] || null;
}

function gaugeSizeName(item){
  if(item.w===2 && item.h===2) return "large";
  if(item.w===2 && item.h===1) return "wide";
  return "small";
}

function renderEditor(){
  editor.style.setProperty("--cols", settings.layout.columns);
  editor.style.setProperty("--rows", settings.layout.rows);
  editor.innerHTML="";

  settings.layout.items.forEach(item=>{
    const tile=document.createElement("button");
    tile.type="button";
    tile.className="gaugeTile";
    tile.dataset.gauge=item.gauge;
    tile.style.gridColumn=`${item.col} / span ${item.w}`;
    tile.style.gridRow=`${item.row} / span ${item.h}`;
    tile.innerHTML=`<span class="dragGrip">⋮⋮</span><strong>${item.label}</strong><small>${gaugeSizeName(item).toUpperCase()}</small>`;
    tile.classList.toggle("selected",item.gauge===selectedGauge);
    tile.addEventListener("click",()=>{selectedGauge=item.gauge;renderEditor();});
    tile.addEventListener("pointerdown",beginDrag);
    editor.appendChild(tile);
  });

  const selected=itemFor(selectedGauge);
  selectedLabel.textContent=selected?.label || selectedGauge.toUpperCase();
  document.querySelectorAll("[data-size]").forEach(button=>button.classList.toggle("active",button.dataset.size===gaugeSizeName(selected || {w:1,h:1})));
  customLayoutEnabled.checked=settings.customLayoutEnabled;
  autoPromote.checked=settings.autoPromote;
  coolantHigh.value=settings.thresholds.coolantHigh;
  oilLow.value=settings.thresholds.oilLow;
  batteryLow.value=settings.thresholds.batteryLow;
  batteryHigh.value=settings.thresholds.batteryHigh;
}

function editorCellFromPoint(x,y){
  const rect=editor.getBoundingClientRect();
  const col=Math.max(1,Math.min(settings.layout.columns,Math.floor(((x-rect.left)/rect.width)*settings.layout.columns)+1));
  const row=Math.max(1,Math.min(settings.layout.rows,Math.floor(((y-rect.top)/rect.height)*settings.layout.rows)+1));
  return {col,row};
}

function beginDrag(event){
  if(event.button !== undefined && event.button !== 0) return;
  const tile=event.currentTarget;
  selectedGauge=tile.dataset.gauge;
  dragState={pointerId:event.pointerId,tile,gauge:tile.dataset.gauge,moved:false,startX:event.clientX,startY:event.clientY};
  tile.setPointerCapture?.(event.pointerId);
  tile.classList.add("dragging");
  tile.addEventListener("pointermove",dragMove);
  tile.addEventListener("pointerup",endDrag,{once:true});
  tile.addEventListener("pointercancel",endDrag,{once:true});
}

function dragMove(event){
  if(!dragState || event.pointerId!==dragState.pointerId) return;
  if(Math.hypot(event.clientX-dragState.startX,event.clientY-dragState.startY)>8) dragState.moved=true;
  if(!dragState.moved) return;
  event.preventDefault();
  const cell=editorCellFromPoint(event.clientX,event.clientY);
  const item=itemFor(dragState.gauge);
  const open=findNearestOpen(item,cell.col,cell.row);
  document.querySelectorAll(".dropTarget").forEach(el=>el.classList.remove("dropTarget"));
  if(open){
    dragState.preview=open;
    dragState.tile.style.gridColumn=`${open.col} / span ${open.w}`;
    dragState.tile.style.gridRow=`${open.row} / span ${open.h}`;
    dragState.tile.classList.add("dropTarget");
  }
}

function endDrag(event){
  if(!dragState) return;
  const {tile,gauge,preview,moved}=dragState;
  tile.classList.remove("dragging","dropTarget");
  tile.removeEventListener("pointermove",dragMove);
  if(moved && preview){
    const item=itemFor(gauge);
    item.col=preview.col; item.row=preview.row;
    saveSettings();
  }
  dragState=null;
  renderEditor();
}

function setSelectedSize(size){
  const item=itemFor(selectedGauge); if(!item) return;
  const sizes={small:{w:1,h:1},wide:{w:2,h:1},large:{w:2,h:2}};
  const next={...item,...sizes[size]};
  let placed=positionValid(next,item.gauge) ? next : findNearestOpen(next,item.col,item.row);
  if(!placed) return;
  Object.assign(item,{w:placed.w,h:placed.h,col:placed.col,row:placed.row});
  saveSettings(); renderEditor();
}

document.querySelectorAll("[data-size]").forEach(button=>button.addEventListener("click",()=>setSelectedSize(button.dataset.size)));
customLayoutEnabled.addEventListener("change",()=>{settings.customLayoutEnabled=customLayoutEnabled.checked;saveSettings();});
autoPromote.addEventListener("change",()=>{settings.autoPromote=autoPromote.checked;saveSettings();});

function bindNumber(input,key){
  input.addEventListener("change",()=>{const value=Number(input.value);if(Number.isFinite(value)){settings.thresholds[key]=value;saveSettings();}renderEditor();});
}
bindNumber(coolantHigh,"coolantHigh"); bindNumber(oilLow,"oilLow"); bindNumber(batteryLow,"batteryLow"); bindNumber(batteryHigh,"batteryHigh");

document.getElementById("resetButton").addEventListener("click",()=>{settings=clone(defaults);selectedGauge="rpm";saveSettings();renderEditor();});
document.getElementById("backButton").addEventListener("click",()=>window.location.href="../index.html");
document.getElementById("openDashButton").addEventListener("click",()=>window.location.href="../index.html");

renderEditor();
