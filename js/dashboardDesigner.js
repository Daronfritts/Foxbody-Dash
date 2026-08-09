(() => {
  const STORAGE_KEY = "foxbodyDash.designer.v1";
  const {DATA_SOURCES, MATERIALS, WIDGETS, SHAPES, makeId} = window.FoxbodyWidgets;
  const app = document.getElementById("appShell");
  const canvas = document.getElementById("dashboardCanvas");
  const assetLibrary = document.getElementById("assetLibrary");
  const propertyForm = document.getElementById("propertyForm");
  const emptyProperties = document.getElementById("emptyProperties");
  const modeLabel = document.getElementById("modeLabel");
  const editToggle = document.getElementById("editToggle");
  const saveState = document.getElementById("saveState");
  const selectionState = document.getElementById("selectionState");

  const controls = {
    name:document.getElementById("propName"), dataSource:document.getElementById("propDataSource"),
    x:document.getElementById("propX"), y:document.getElementById("propY"), w:document.getElementById("propW"), h:document.getElementById("propH"),
    rotation:document.getElementById("propRotation"), opacity:document.getElementById("propOpacity"), material:document.getElementById("propMaterial"),
    visible:document.getElementById("propVisible"), lockAspect:document.getElementById("propLockAspect")
  };

  let editing = false;
  let selectedId = null;
  let interaction = null;
  let liveData = {};
  let serverAssets = {shapes:[],materials:[],images:[],gaugeParts:[]};

  const defaultLayout = {
    version:1,
    canvas:{width:1024,height:600,background:"#000000"},
    options:{showSafeArea:false,grid:false},
    items:[
      createFromTemplate(WIDGETS[0], {name:"RPM",x:5,y:12,w:29,h:50,dataSource:"engine.rpm"}),
      createFromTemplate(WIDGETS[0], {name:"SPEED",x:66,y:12,w:29,h:50,dataSource:"engine.speed",config:{min:0,max:200,majorTicks:10,minorTicks:50,labels:["0","20","40","60","80","100","120","140","160","180","200"],title:"MPH",subtitle:"",redlineStart:null}}),
      createFromTemplate(WIDGETS[3], {x:38,y:15,w:24,h:44}),
      createFromTemplate(WIDGETS[6], {x:43,y:2,w:14,h:11}),
      createFromTemplate(WIDGETS[4], {x:5,y:80,w:90,h:8}),
      createFromTemplate(WIDGETS[5], {x:5,y:90,w:90,h:8})
    ]
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }
  function createFromTemplate(template, overrides={}){
    const base = clone(template.defaults || {});
    const item = {...base,...clone(overrides)};
    item.id = item.id || makeId(template.type || "item");
    item.type = template.type;
    if(template.shape) item.shape = template.shape;
    item.x ??= 10; item.y ??= 10; item.w ??= 20; item.h ??= 20;
    item.rotation ??= 0; item.opacity ??= 1; item.visible ??= true; item.lockAspect ??= false;
    item.z ??= Date.now();
    return item;
  }

  function loadLayout(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
      return saved?.items ? saved : clone(defaultLayout);
    }catch(error){ console.warn(error); return clone(defaultLayout); }
  }
  let layout = loadLayout();

  function saveLayout(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    saveState.textContent = "SAVED";
    clearTimeout(saveLayout.timer);
    saveLayout.timer = setTimeout(()=>saveState.textContent="READY",700);
  }

  function getPath(obj,path){ return path.split(".").reduce((acc,key)=>acc?.[key],obj); }
  function selected(){ return layout.items.find(item=>item.id===selectedId) || null; }
  function materialCss(id){
    const builtIn = MATERIALS.find(m=>m.id===id);
    if(builtIn) return builtIn.css;
    const custom = serverAssets.materials.find(m=>m.id===id);
    return custom ? `url('${custom.url}') center/cover` : "none";
  }

  function gaugeConfigFor(item){
    if(item.config) return item.config;
    return {min:0,max:100,majorTicks:5,minorTicks:25,title:item.name||"GAUGE",subtitle:""};
  }

  function renderItemContent(el,item){
    const surface = document.createElement("div");
    surface.className = `widgetSurface ${item.shape||""}`;
    surface.style.background = materialCss(item.material || "none");
    const value = item.dataSource && item.dataSource!=="none" ? getPath(liveData,item.dataSource) : undefined;

    if(item.type === "gauge"){
      const host=document.createElement("div"); host.id=`gauge-${item.id}`; host.style.width="100%"; host.style.height="100%"; surface.appendChild(host); el.appendChild(surface);
      const cfg=gaugeConfigFor(item); const numeric=Number.isFinite(Number(value))?Number(value):0;
      try{ new Gauge(host.id,cfg.min??0,cfg.max??100,numeric,item.name||"Gauge",{majorTicks:cfg.majorTicks??5,minorTicks:cfg.minorTicks??25,labels:cfg.labels||null,title:cfg.title||item.name||"Gauge",subtitle:cfg.subtitle||"",redlineStart:cfg.redlineStart??null,variant:"main",showValue:true,size:430,radius:176,needleLength:132}); }catch(error){host.textContent="GAUGE";}
      return;
    }
    if(item.type === "digital"){
      surface.classList.add("digitalWidget"); const n=Number(value); const decimals=item.config?.decimals??0; surface.innerHTML=`<strong>${Number.isFinite(n)?n.toFixed(decimals):"--"}</strong><span>${item.config?.unit||item.name||""}</span>`;
    }else if(item.type === "bar"){
      surface.classList.add("barWidget"); const min=item.config?.min??0,max=item.config?.max??100,n=Number(value); const pct=Number.isFinite(n)?clamp(((n-min)/(max-min))*100,0,100):0; surface.innerHTML=`<div class="barFill" style="width:${pct}%"></div><div class="barText">${Number.isFinite(n)?Math.round(n):"--"} ${item.config?.unit||""}</div>`;
    }else if(item.type === "info"){
      surface.classList.add("infoWidget"); surface.innerHTML=`<div class="infoHeader"><span>${new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</span><span>FOXBODY</span></div><div class="infoCenter"><small>GEAR</small><strong>${liveData.vehicle?.gear ?? "N"}</strong></div><div class="infoFooter"><span>TRIP ${liveData.vehicle?.trip ?? "--"}</span><span>${liveData.vehicle?.outsideTemp ?? "--"}°F</span></div>`;
    }else if(item.type === "status"){
      surface.classList.add("statusWidget"); surface.innerHTML="<span class='statusDot'></span><span class='statusDot'></span><span class='statusDot'></span><span class='statusDot'></span><span class='statusDot'></span><span class='statusDot'></span>";
    }else if(item.type === "nav"){
      surface.classList.add("navWidget"); surface.innerHTML="<button>HOME</button><button>VEHICLE</button><button>DIAG</button><button>SETTINGS</button>";
    }else if(item.type === "shift"){
      surface.classList.add("shiftWidget"); const rpm=Number(getPath(liveData,item.dataSource||"engine.rpm")); if(rpm>=6000)surface.classList.add("active"); surface.innerHTML=`<span>FOXBODY GT</span><img src="assets/images/mustangWhite.svg" alt="Mustang" />`;
    }else if(item.type === "text"){
      surface.classList.add("textWidget"); surface.textContent=item.config?.text||item.name||"TEXT";
    }else if(item.type === "shape"){
      surface.classList.add("shapeWidget",item.shape||"rectangle");
    }else if(item.type === "image"){
      const img=document.createElement("img"); img.className="imageWidget"; img.src=item.url; img.alt=item.name||""; surface.appendChild(img);
    }
    el.appendChild(surface);
  }

  function renderCanvas(){
    canvas.innerHTML=""; canvas.style.backgroundColor=layout.canvas?.background||"#000";
    layout.items.slice().sort((a,b)=>(a.z||0)-(b.z||0)).forEach(item=>{
      if(item.visible===false&&!editing)return;
      const el=document.createElement("div"); el.className="dashItem"; el.dataset.id=item.id;
      if(item.visible===false)el.classList.add("hiddenItem");
      if(item.id===selectedId)el.classList.add("selected");
      Object.assign(el.style,{left:`${item.x}%`,top:`${item.y}%`,width:`${item.w}%`,height:`${item.h}%`,transform:`rotate(${item.rotation||0}deg)`,opacity:String(item.opacity??1),zIndex:String(item.z||1)});
      renderItemContent(el,item);
      const handle=document.createElement("div"); handle.className="resizeHandle"; handle.dataset.resize="1"; el.appendChild(handle);
      el.addEventListener("pointerdown",beginPointer);
      canvas.appendChild(el);
    });
    updatePropertyPanel();
  }

  function setEditing(value){ editing=Boolean(value); app.classList.toggle("editing",editing); editToggle.classList.toggle("active",editing); editToggle.textContent=editing?"DONE":"EDIT DASH"; modeLabel.textContent=editing?"EDIT MODE":"RUN MODE"; if(!editing){selectedId=null;} renderCanvas(); renderAssets(currentTab); }

  function beginPointer(event){
    if(!editing)return; event.preventDefault(); const el=event.currentTarget; selectedId=el.dataset.id; const item=selected(); if(!item)return; renderCanvas();
    const rect=canvas.getBoundingClientRect(); interaction={mode:event.target.dataset.resize?"resize":"move",pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,rect,item,origin:clone(item)};
    el.setPointerCapture?.(event.pointerId); window.addEventListener("pointermove",pointerMove); window.addEventListener("pointerup",pointerEnd,{once:true});
  }
  function pointerMove(event){
    if(!interaction||event.pointerId!==interaction.pointerId)return; const i=interaction; const dx=((event.clientX-i.startX)/i.rect.width)*100,dy=((event.clientY-i.startY)/i.rect.height)*100;
    if(i.mode==="move"){i.item.x=clamp(i.origin.x+dx,0,100-i.item.w);i.item.y=clamp(i.origin.y+dy,0,100-i.item.h);}else{
      let newW=clamp(i.origin.w+dx,2,100-i.origin.x),newH=clamp(i.origin.h+dy,2,100-i.origin.y);
      if(i.item.lockAspect){const ratio=i.origin.w/i.origin.h;if(Math.abs(dx)>=Math.abs(dy))newH=newW/ratio;else newW=newH*ratio;}
      i.item.w=newW;i.item.h=newH;
    }
    renderCanvas();
  }
  function pointerEnd(){ if(!interaction)return; interaction=null; window.removeEventListener("pointermove",pointerMove); saveLayout(); renderCanvas(); }

  function addItem(item){ layout.items.push(item); selectedId=item.id; saveLayout(); renderCanvas(); }

  let currentTab="widgets";
  async function loadServerAssets(){
    try{const r=await fetch("/api/assets");if(r.ok)serverAssets=await r.json();}catch(error){console.info("Custom asset scan unavailable; built-ins remain usable.");}
    renderAssets(currentTab);
  }

  function assetButton(label,detail,onClick){const b=document.createElement("button");b.type="button";b.className="assetCard";b.innerHTML=`<span>${label}</span><small>${detail||"ADD"}</small>`;b.addEventListener("click",onClick);return b;}
  function renderAssets(tab){
    currentTab=tab; assetLibrary.innerHTML="";
    document.querySelectorAll(".assetTab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
    if(tab==="widgets")WIDGETS.forEach(t=>assetLibrary.appendChild(assetButton(t.label,t.type.toUpperCase(),()=>addItem(createFromTemplate(t)))));
    if(tab==="shapes"){
      SHAPES.forEach(t=>assetLibrary.appendChild(assetButton(t.label,"SHAPE",()=>addItem(createFromTemplate(t))));
      serverAssets.shapes.forEach(a=>assetLibrary.appendChild(assetButton(a.name,"SVG/PNG",()=>addItem({id:makeId("shape"),type:"image",name:a.name,url:a.url,x:10,y:10,w:30,h:20,z:Date.now(),visible:true,opacity:1,rotation:0,lockAspect:false,material:"none"}))));
    }
    if(tab==="materials"){
      MATERIALS.filter(m=>m.id!=="none").forEach(m=>assetLibrary.appendChild(assetButton(m.label,"APPLY",()=>{const item=selected();if(item){item.material=m.id;saveLayout();renderCanvas();}})));
      serverAssets.materials.forEach(a=>assetLibrary.appendChild(assetButton(a.name,"CUSTOM",()=>{const item=selected();if(item){item.material=a.id;saveLayout();renderCanvas();}})));
    }
    if(tab==="images")serverAssets.images.forEach(a=>assetLibrary.appendChild(assetButton(a.name,"IMAGE",()=>addItem({id:makeId("image"),type:"image",name:a.name,url:a.url,x:10,y:10,w:25,h:20,z:Date.now(),visible:true,opacity:1,rotation:0,lockAspect:true,material:"none"}))));
  }

  function updatePropertyPanel(){
    const item=selected(); emptyProperties.hidden=Boolean(item); propertyForm.hidden=!item; selectionState.textContent=item?item.name||item.type:"NO SELECTION"; if(!item)return;
    controls.name.value=item.name||""; controls.dataSource.value=item.dataSource||"none"; controls.x.value=item.x.toFixed(1);controls.y.value=item.y.toFixed(1);controls.w.value=item.w.toFixed(1);controls.h.value=item.h.toFixed(1);controls.rotation.value=item.rotation||0;controls.opacity.value=item.opacity??1;controls.material.value=item.material||"none";controls.visible.checked=item.visible!==false;controls.lockAspect.checked=Boolean(item.lockAspect);
  }

  function buildPropertyOptions(){
    controls.dataSource.innerHTML=DATA_SOURCES.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
    controls.material.innerHTML=MATERIALS.map(m=>`<option value="${m.id}">${m.label}</option>`).join("");
  }
  function bindControl(control,key,parser=v=>v){control.addEventListener("change",()=>{const item=selected();if(!item)return;item[key]=parser(control.type==="checkbox"?control.checked:control.value);saveLayout();renderCanvas();});}
  bindControl(controls.name,"name");bindControl(controls.dataSource,"dataSource");bindControl(controls.x,"x",Number);bindControl(controls.y,"y",Number);bindControl(controls.w,"w",Number);bindControl(controls.h,"h",Number);bindControl(controls.rotation,"rotation",Number);bindControl(controls.opacity,"opacity",Number);bindControl(controls.material,"material");bindControl(controls.visible,"visible",Boolean);bindControl(controls.lockAspect,"lockAspect",Boolean);

  document.querySelectorAll(".assetTab").forEach(b=>b.addEventListener("click",()=>renderAssets(b.dataset.tab)));
  editToggle.addEventListener("click",()=>setEditing(!editing));
  document.getElementById("saveButton").addEventListener("click",saveLayout);
  document.getElementById("vehicleButton").addEventListener("click",()=>location.href="pages/vehicle.html");
  document.getElementById("duplicateButton").addEventListener("click",()=>{const item=selected();if(!item)return;const copy=clone(item);copy.id=makeId(item.type);copy.name=`${item.name||item.type} Copy`;copy.x=clamp(item.x+2,0,100-item.w);copy.y=clamp(item.y+2,0,100-item.h);copy.z=Date.now();addItem(copy);});
  document.getElementById("deleteButton").addEventListener("click",()=>{if(!selectedId)return;layout.items=layout.items.filter(i=>i.id!==selectedId);selectedId=null;saveLayout();renderCanvas();});
  document.getElementById("frontButton").addEventListener("click",()=>{const item=selected();if(item){item.z=Math.max(0,...layout.items.map(i=>i.z||0))+1;saveLayout();renderCanvas();}});
  document.getElementById("backButton").addEventListener("click",()=>{const item=selected();if(item){item.z=Math.min(0,...layout.items.map(i=>i.z||0))-1;saveLayout();renderCanvas();}});
  canvas.addEventListener("pointerdown",event=>{if(editing&&event.target===canvas){selectedId=null;renderCanvas();}});

  async function pollData(){try{const r=await fetch("/api/vehicle");if(r.ok){liveData=await r.json();renderCanvas();}}catch(error){} }

  buildPropertyOptions(); renderAssets("widgets"); renderCanvas(); loadServerAssets(); pollData(); setInterval(pollData,500);
})();
