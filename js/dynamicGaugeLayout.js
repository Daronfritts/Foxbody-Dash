const GAUGE_LAYOUT_STORAGE_KEY = "foxbodyDash.gaugeLayout";

const GAUGE_LAYOUT_DEFAULTS = {
  focusGauge:"none",
  customLayoutEnabled:false,
  autoPromote:true,
  layout:{mode:"freeform",items:[]},
  thresholds:{coolantHigh:230,oilLow:12,batteryLow:11.5,batteryHigh:16.0}
};

function getGaugeLayoutSettings(){
  try{
    const saved=JSON.parse(localStorage.getItem(GAUGE_LAYOUT_STORAGE_KEY)||"null")||{};
    return {...GAUGE_LAYOUT_DEFAULTS,...saved,thresholds:{...GAUGE_LAYOUT_DEFAULTS.thresholds,...(saved.thresholds||{})},layout:{...GAUGE_LAYOUT_DEFAULTS.layout,...(saved.layout||{})}};
  }catch(error){
    console.warn("Gauge layout settings unavailable:",error);
    return JSON.parse(JSON.stringify(GAUGE_LAYOUT_DEFAULTS));
  }
}

const focusGaugeDefinitions={
  rpm:{label:"RPM",min:0,max:8000,unit:"",majorTicks:8,minorTicks:40,labels:["0","1","2","3","4","5","6","7","8"],subtitle:"x1000",redlineStart:6000,read:()=>tach.value},
  speed:{label:"MPH",min:0,max:200,unit:"",majorTicks:10,minorTicks:50,labels:["0","20","40","60","80","100","120","140","160","180","200"],read:()=>speed.value},
  fuel:{label:"FUEL",min:0,max:100,unit:"%",majorTicks:4,minorTicks:20,labels:["E","","1/2","","F"],warningLow:15,read:()=>fuel.gauge.value},
  oil:{label:"OIL PSI",min:0,max:80,unit:"PSI",majorTicks:4,minorTicks:20,labels:["0","","40","","80"],warningLow:12,read:()=>oil.gauge.value},
  coolant:{label:"COOLANT",min:100,max:260,unit:"°F",majorTicks:4,minorTicks:20,labels:["C","","180","","H"],warningHigh:230,read:()=>coolant.gauge.value},
  battery:{label:"VOLTS",min:10,max:18,unit:"V",majorTicks:4,minorTicks:20,labels:["10","","14","","18"],warningLow:11.5,warningHigh:16,read:()=>battery.gauge.value}
};

const cluster=document.getElementById("cluster");
const customPanel=document.createElement("section");
customPanel.id="customGaugeLayout";
cluster.appendChild(customPanel);

const overlay=document.createElement("section");
overlay.id="focusGaugeOverlay";
overlay.setAttribute("aria-live","polite");
overlay.innerHTML=`<div id="focusGaugeCard"><div id="focusGaugeLabel">FOCUS GAUGE</div><button class="focusDismiss" type="button" aria-label="Dismiss focus gauge">×</button><div id="focusGaugeCanvas"></div><div id="focusGaugeReason"></div></div>`;
document.getElementById("dashboard").appendChild(overlay);

let focusGauge=null;
let activeGaugeKey=null;
let dismissedAutomaticGauge=null;
let customGaugeInstances={};
let lastLayoutSignature="";

function determineAutomaticGauge(settings){
  if(!settings.autoPromote)return null;
  const oilValue=Number(focusGaugeDefinitions.oil.read());
  const coolantValue=Number(focusGaugeDefinitions.coolant.read());
  const batteryValue=Number(focusGaugeDefinitions.battery.read());
  const rpmValue=Number(focusGaugeDefinitions.rpm.read());
  if(rpmValue>500&&Number.isFinite(oilValue)&&oilValue<=settings.thresholds.oilLow)return{key:"oil",reason:`LOW OIL PRESSURE — ${Math.round(oilValue)} PSI`};
  if(Number.isFinite(coolantValue)&&coolantValue>=settings.thresholds.coolantHigh)return{key:"coolant",reason:`ENGINE TEMP HIGH — ${Math.round(coolantValue)}°F`};
  if(Number.isFinite(batteryValue)&&batteryValue<=settings.thresholds.batteryLow)return{key:"battery",reason:`SYSTEM VOLTAGE LOW — ${batteryValue.toFixed(1)} V`};
  if(Number.isFinite(batteryValue)&&batteryValue>=settings.thresholds.batteryHigh)return{key:"battery",reason:`SYSTEM VOLTAGE HIGH — ${batteryValue.toFixed(1)} V`};
  return null;
}

function gaugeSize(item){
  if(item.size==="large") return {size:430,radius:176,needleLength:132,variant:"main"};
  if(item.size==="medium") return {size:220,radius:86,needleLength:64,variant:"mini"};
  return {size:155,radius:61,needleLength:46,variant:"mini"};
}

function createGaugeForContainer(containerId,key,item){
  const def=focusGaugeDefinitions[key];
  if(!def)return null;
  const dims=gaugeSize(item);
  return new Gauge(containerId,def.min,def.max,def.read(),def.label,{
    majorTicks:def.majorTicks,minorTicks:def.minorTicks,labels:def.labels,unit:def.unit,
    redlineStart:def.redlineStart??null,warningLow:def.warningLow??null,warningHigh:def.warningHigh??null,
    title:def.label,subtitle:def.subtitle??def.unit,variant:dims.variant,showValue:true,size:dims.size,radius:dims.radius,needleLength:dims.needleLength
  });
}

function styleFreeItem(el,item){
  el.style.left=`${item.x}%`;
  el.style.top=`${item.y}%`;
  el.style.width=`${item.w}%`;
  el.style.height=`${item.h}%`;
}

function buildInfoCell(cell){
  cell.classList.add("customInfoCell");
  cell.innerHTML=`
    <div class="customInfoHeader"><span data-info="clock"></span><span data-info="temp"></span></div>
    <div class="customInfoGear"><small>GEAR</small><strong data-info="gear"></strong><span data-info="gearType"></span></div>
    <div class="customInfoRow"><small>ODOMETER</small><strong data-info="odometer"></strong></div>
    <div class="customInfoRow"><small>TRIP A</small><strong data-info="trip"></strong></div>
    <div class="customInfoCruise" data-info="cruise"></div>`;
}

function buildShiftCell(cell){
  cell.classList.add("customShiftCell");
  cell.innerHTML=`<div class="customShiftTitle">FOXBODY GT</div><img src="assets/images/mustangWhite.svg" alt="Mustang shift light" />`;
}

function syncNonGaugeElements(){
  const textMap={clock:"clockDisplay",temp:"outsideTemp",gear:"gearDisplay",gearType:"gearType",odometer:"odometer",trip:"tripA",cruise:"cruiseStatus"};
  Object.entries(textMap).forEach(([target,source])=>{
    const dest=customPanel.querySelector(`[data-info="${target}"]`);
    const src=document.getElementById(source);
    if(dest&&src)dest.textContent=src.textContent;
  });
  const sourceLogo=document.getElementById("mustangLogo");
  const customLogo=customPanel.querySelector(".customShiftCell img");
  if(sourceLogo&&customLogo){
    customLogo.classList.toggle("shiftYellow",sourceLogo.classList.contains("shiftYellow"));
    customLogo.classList.toggle("shiftRed",sourceLogo.classList.contains("shiftRed"));
  }
}

function renderCustomLayout(settings){
  const items=Array.isArray(settings.layout?.items)?settings.layout.items:[];
  const signature=JSON.stringify({enabled:settings.customLayoutEnabled,items});
  cluster.classList.toggle("customLayoutActive",Boolean(settings.customLayoutEnabled&&items.length));
  if(!settings.customLayoutEnabled||!items.length){customPanel.classList.remove("active");return;}
  customPanel.classList.add("active");

  if(signature!==lastLayoutSignature){
    customPanel.innerHTML="";
    customGaugeInstances={};
    items.forEach((item,index)=>{
      const cell=document.createElement("div");
      cell.className=`customFreeItem customFreeItem--${item.type||"gauge"}`;
      styleFreeItem(cell,item);
      if(item.type==="info"){
        buildInfoCell(cell);
      }else if(item.type==="shift"){
        buildShiftCell(cell);
      }else{
        const key=item.id||item.gauge;
        const id=`customGauge-${key}-${index}`;
        cell.innerHTML=`<div id="${id}" class="customGaugeCanvas"></div>`;
        customGaugeInstances[key]=createGaugeForContainer(id,key,item);
      }
      customPanel.appendChild(cell);
    });
    lastLayoutSignature=signature;
  }

  Object.entries(customGaugeInstances).forEach(([key,gauge])=>{
    const def=focusGaugeDefinitions[key];
    if(gauge&&def)gauge.setValue(def.read(),true);
  });
  syncNonGaugeElements();
}

function buildFocusGauge(key){
  const def=focusGaugeDefinitions[key];if(!def)return;
  focusGauge=new Gauge("focusGaugeCanvas",def.min,def.max,def.read(),def.label,{majorTicks:def.majorTicks,minorTicks:def.minorTicks,labels:def.labels,unit:def.unit,redlineStart:def.redlineStart??null,warningLow:def.warningLow??null,warningHigh:def.warningHigh??null,title:def.label,subtitle:def.subtitle??def.unit,variant:"main",showValue:true,size:430,radius:176,needleLength:132});
  activeGaugeKey=key;
}

function renderFocusGauge(){
  const settings=getGaugeLayoutSettings();
  renderCustomLayout(settings);
  const automatic=determineAutomaticGauge(settings);
  const automaticVisible=automatic&&automatic.key!==dismissedAutomaticGauge;
  const key=automaticVisible?automatic.key:settings.focusGauge;
  const reason=automaticVisible?automatic.reason:(key!=="none"?"MANUAL FOCUS":"");
  if(!key||key==="none"){
    overlay.classList.remove("active");activeGaugeKey=null;focusGauge=null;document.getElementById("focusGaugeCanvas").innerHTML="";return;
  }
  if(activeGaugeKey!==key||!focusGauge)buildFocusGauge(key);
  const def=focusGaugeDefinitions[key];focusGauge.setValue(def.read(),true);
  document.getElementById("focusGaugeLabel").textContent=`${def.label} — FOCUS`;
  document.getElementById("focusGaugeReason").textContent=reason;
  overlay.classList.add("active");
  if(!automatic||automatic.key!==dismissedAutomaticGauge){if(!automatic)dismissedAutomaticGauge=null;}
}

overlay.querySelector(".focusDismiss").addEventListener("click",()=>{
  const settings=getGaugeLayoutSettings();const automatic=determineAutomaticGauge(settings);
  if(automatic)dismissedAutomaticGauge=automatic.key;else{settings.focusGauge="none";localStorage.setItem(GAUGE_LAYOUT_STORAGE_KEY,JSON.stringify(settings));}
  renderFocusGauge();
});

window.addEventListener("storage",()=>{lastLayoutSignature="";renderFocusGauge();});
setInterval(renderFocusGauge,250);
renderFocusGauge();
