(() => {
  "use strict";
  const C=window.FoxDashCatalog,G=window.FoxGaugeRenderer;
  const q=id=>document.getElementById(id);
  const ui={app:q("foxApp"),canvas:q("dashCanvas"),library:q("libraryItems"),inspector:q("inspector"),nothing:q("nothingSelected"),mode:q("modeBadge"),status:q("appStatus"),selection:q("selectionStatus"),edit:q("editModeButton"),save:q("saveLayoutButton"),vehicle:q("vehiclePageButton"),name:q("fieldName"),data:q("fieldData"),x:q("fieldX"),y:q("fieldY"),w:q("fieldW"),h:q("fieldH"),rotate:q("fieldRotate"),opacity:q("fieldOpacity"),material:q("fieldMaterial"),scale:q("fieldScaleMode"),visible:q("fieldVisible"),aspect:q("fieldAspect"),duplicate:q("duplicateElement"),front:q("bringForward"),back:q("sendBackward"),remove:q("deleteElement"),fatal:q("fatalError")};
  const STORAGE="foxbodyDash.studio.v1";
  let edit=false,selectedId=null,gesture=null,live={},assets={shapes:[],materials:[],images:[],gaugeParts:[],icons:[]},activeLibrary="widgets";
  const clone=C.clone,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),read=(obj,path)=>path&&path!=="none"?path.split(".").reduce((a,k)=>a?.[k],obj):undefined;
  const defaultLayout={version:1,canvas:{background:"#000000"},items:[C.fromTemplate(C.templates.widgets[0],{name:"RPM",x:5,y:12,w:29,h:50}),C.fromTemplate(C.templates.widgets[0],{name:"SPEED",x:66,y:12,w:29,h:50,dataSource:"engine.speed",config:{min:0,max:200,majorTicks:10,minorTicks:50,startAngle:225,endAngle:495,title:"MPH",unit:"",warningHigh:null,labels:["0","20","40","60","80","100","120","140","160","180","200"]}}),C.fromTemplate(C.templates.widgets[3],{x:38,y:16,w:24,h:40}),C.fromTemplate(C.templates.widgets[6],{x:42,y:2,w:16,h:12}),C.fromTemplate(C.templates.widgets[4],{x:5,y:80,w:90,h:8}),C.fromTemplate(C.templates.widgets[5],{x:5,y:90,w:90,h:8})]};
  let layout=load();

  function fail(err){console.error(err);ui.fatal.hidden=false;ui.fatal.textContent="DASH ERROR: "+(err?.stack||err?.message||String(err));}
  window.addEventListener("error",e=>fail(e.error||e.message));window.addEventListener("unhandledrejection",e=>fail(e.reason));
  function load(){try{const v=JSON.parse(localStorage.getItem(STORAGE)||"null");return v?.items?v:clone(defaultLayout);}catch{return clone(defaultLayout);}}
  function save(){localStorage.setItem(STORAGE,JSON.stringify(layout));ui.status.textContent="SAVED";clearTimeout(save.t);save.t=setTimeout(()=>ui.status.textContent="READY",700);}
  function selected(){return layout.items.find(i=>i.id===selectedId)||null;}
  function material(id){const b=C.materials.find(m=>m.id===id);if(b)return b.css;const a=assets.materials.find(m=>m.id===id);return a?`url('${a.url}') center/cover`:"none";}
  function surface(item){const s=document.createElement("div");s.className=`nodeSurface ${item.shape||""}`;s.style.background=material(item.material||"none");return s;}

  function renderContent(node,item){
    const s=surface(item),value=read(live,item.dataSource);node.appendChild(s);
    if(item.type==="gauge"){G.render(s,item,value);return;}
    if(item.type==="gaugePart"){G.renderPart(s,item,value);return;}
    if(item.type==="digital"){s.classList.add("digitalValue");const n=Number(value),d=item.config?.decimals??0;s.innerHTML=`<strong>${Number.isFinite(n)?n.toFixed(d):"--"}</strong><span>${item.config?.unit||item.name||""}</span>`;return;}
    if(item.type==="bar"){s.classList.add("barGauge");const min=item.config?.min??0,max=item.config?.max??100,n=Number(value),pct=Number.isFinite(n)?clamp((n-min)/(max-min)*100,0,100):0;s.innerHTML=`<div class="barGaugeFill" style="width:${pct}%"></div><div class="barGaugeText">${Number.isFinite(n)?Math.round(n):"--"} ${item.config?.unit||""}</div>`;return;}
    if(item.type==="info"){s.classList.add("infoBox");s.innerHTML=`<div class="infoTop"><span>${new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</span><span>FOXBODY</span></div><div class="infoGear"><small>GEAR</small><strong>${live.vehicle?.gear??"N"}</strong></div><div class="infoBottom"><span>TRIP ${live.vehicle?.trip??"--"}</span><span>${live.vehicle?.outsideTemp??"--"}°F</span></div>`;return;}
    if(item.type==="status"){s.classList.add("statusStrip");for(let i=0;i<6;i++){const lamp=document.createElement("span");lamp.className="statusLamp";s.appendChild(lamp);}return;}
    if(item.type==="nav"){s.classList.add("navStrip");["HOME","VEHICLE","DIAG","SETTINGS"].forEach(label=>{const b=document.createElement("button");b.type="button";b.textContent=label;if(label==="VEHICLE")b.addEventListener("click",e=>{if(!edit){e.stopPropagation();location.href="pages/vehicle.html";}});s.appendChild(b);});return;}
    if(item.type==="shift"){s.classList.add("shiftLight");if(Number(value)>=Number(item.config?.hot??6000))s.classList.add("hot");const label=document.createElement("span");label.textContent=item.name||"SHIFT";const img=document.createElement("img");img.src=item.assetUrl||"assets/images/mustangWhite.svg";img.alt="";s.append(label,img);return;}
    if(item.type==="text"){s.classList.add("textNode");s.textContent=item.config?.text||item.name||"TEXT";return;}
    if(item.type==="image"||item.type==="icon"){const img=document.createElement("img");img.src=item.assetUrl;img.alt="";img.className=`nodeImage ${item.scaleMode||"stretch"}`;if(item.scaleMode==="tile"){s.style.backgroundImage=`url('${item.assetUrl}')`;s.style.backgroundRepeat="repeat";s.style.backgroundSize="auto";}else s.appendChild(img);return;}
  }

  function render(){
    ui.canvas.replaceChildren();ui.canvas.style.background=layout.canvas?.background||"#000";
    layout.items.slice().sort((a,b)=>(a.z||0)-(b.z||0)).forEach(item=>{
      if(item.visible===false&&!edit)return;
      const n=document.createElement("div");n.className="dashNode";if(item.visible===false)n.classList.add("hidden");if(item.id===selectedId)n.classList.add("selected");n.dataset.id=item.id;
      Object.assign(n.style,{left:`${item.x}%`,top:`${item.y}%`,width:`${item.w}%`,height:`${item.h}%`,transform:`rotate(${item.rotation||0}deg)`,opacity:String(item.opacity??1),zIndex:String(item.z||1)});
      ui.canvas.appendChild(n);renderContent(n,item);
      const grip=document.createElement("div");grip.className="resizeGrip";grip.dataset.resize="1";n.appendChild(grip);n.addEventListener("pointerdown",pointerDown);
    });
    inspect();
  }

  function setEdit(v){edit=!!v;ui.app.classList.toggle("editing",edit);ui.mode.textContent=edit?"EDIT":"RUN";ui.edit.textContent=edit?"DONE":"EDIT";ui.edit.classList.toggle("active",edit);if(!edit)selectedId=null;render();renderLibrary(activeLibrary);}
  function pointerDown(e){if(!edit)return;e.preventDefault();const id=e.currentTarget.dataset.id,oldSelected=selectedId;selectedId=id;const item=selected();if(!item)return;const rect=ui.canvas.getBoundingClientRect();gesture={id,pointerId:e.pointerId,mode:e.target.dataset.resize?"resize":"move",startX:e.clientX,startY:e.clientY,rect,item,origin:clone(item)};if(oldSelected!==id)render();window.addEventListener("pointermove",pointerMove);window.addEventListener("pointerup",pointerUp,{once:true});}
  function pointerMove(e){if(!gesture||e.pointerId!==gesture.pointerId)return;const g=gesture,dx=(e.clientX-g.startX)/g.rect.width*100,dy=(e.clientY-g.startY)/g.rect.height*100;if(g.mode==="move"){g.item.x=clamp(g.origin.x+dx,0,100-g.item.w);g.item.y=clamp(g.origin.y+dy,0,100-g.item.h);}else{let w=clamp(g.origin.w+dx,2,100-g.origin.x),h=clamp(g.origin.h+dy,2,100-g.origin.y);if(g.item.lockAspect){const ratio=g.origin.w/g.origin.h;if(Math.abs(dx)>Math.abs(dy))h=w/ratio;else w=h*ratio;}g.item.w=w;g.item.h=h;}render();}
  function pointerUp(){window.removeEventListener("pointermove",pointerMove);if(gesture){gesture=null;save();render();}}
  function add(item){layout.items.push(item);selectedId=item.id;save();render();}

  function card(label,detail,fn){const b=document.createElement("button");b.type="button";b.className="libraryCard";b.innerHTML=`<span>${label}</span><small>${detail}</small>`;b.addEventListener("click",fn);return b;}
  function renderLibrary(group){activeLibrary=group;ui.library.replaceChildren();document.querySelectorAll("[data-library]").forEach(b=>b.classList.toggle("active",b.dataset.library===group));
    if(group==="widgets"||group==="shapes"||group==="gaugeParts")C.templates[group].forEach(t=>ui.library.appendChild(card(t.label,t.type.toUpperCase(),()=>add(C.fromTemplate(t)))));
    if(group==="materials"){C.materials.filter(m=>m.id!=="none").forEach(m=>ui.library.appendChild(card(m.label,"APPLY",()=>applyMaterial(m.id))));assets.materials.forEach(a=>ui.library.appendChild(card(a.name,"CUSTOM",()=>applyMaterial(a.id))));return;}
    const source=assets[group]||[];source.forEach(a=>ui.library.appendChild(card(a.name,a.format?.toUpperCase()||"ASSET",()=>add({id:C.id(group),type:group==="icons"?"icon":"image",name:a.name,assetUrl:a.url,x:10,y:10,w:22,h:18,z:Date.now(),visible:true,opacity:1,rotation:0,lockAspect:group==="icons",material:"none",scaleMode:group==="icons"?"contain":"stretch"}))));
  }
  function applyMaterial(id){const item=selected();if(!item)return;item.material=id;save();render();}

  function inspect(){const item=selected();ui.nothing.hidden=!!item;ui.inspector.hidden=!item;ui.selection.textContent=item?item.name||item.type:"NO SELECTION";if(!item)return;ui.name.value=item.name||"";ui.data.value=item.dataSource||"none";ui.x.value=Number(item.x).toFixed(1);ui.y.value=Number(item.y).toFixed(1);ui.w.value=Number(item.w).toFixed(1);ui.h.value=Number(item.h).toFixed(1);ui.rotate.value=item.rotation||0;ui.opacity.value=item.opacity??1;ui.material.value=item.material||"none";ui.scale.value=item.scaleMode||"stretch";ui.visible.checked=item.visible!==false;ui.aspect.checked=!!item.lockAspect;}
  function bind(control,key,parse=v=>v){control.addEventListener("change",()=>{const item=selected();if(!item)return;item[key]=parse(control.type==="checkbox"?control.checked:control.value);save();render();});}
  function options(){ui.data.innerHTML=C.dataSources.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");ui.material.innerHTML=C.materials.map(m=>`<option value="${m.id}">${m.label}</option>`).join("")+assets.materials.map(a=>`<option value="${a.id}">${a.name}</option>`).join("");}

  async function loadAssets(){try{const r=await fetch("/api/assets");if(r.ok)assets=await r.json();}catch(e){console.warn("Asset API unavailable",e);}options();renderLibrary(activeLibrary);}
  async function poll(){try{const r=await fetch("/api/vehicle");if(r.ok){live=await r.json();if(!gesture)render();}}catch{}}

  try{
    options();document.querySelectorAll("[data-library]").forEach(b=>b.addEventListener("click",()=>renderLibrary(b.dataset.library)));ui.edit.addEventListener("click",()=>setEdit(!edit));ui.save.addEventListener("click",save);ui.vehicle.addEventListener("click",()=>location.href="pages/vehicle.html");
    bind(ui.name,"name");bind(ui.data,"dataSource");bind(ui.x,"x",Number);bind(ui.y,"y",Number);bind(ui.w,"w",Number);bind(ui.h,"h",Number);bind(ui.rotate,"rotation",Number);bind(ui.opacity,"opacity",Number);bind(ui.material,"material");bind(ui.scale,"scaleMode");bind(ui.visible,"visible",Boolean);bind(ui.aspect,"lockAspect",Boolean);
    ui.duplicate.addEventListener("click",()=>{const item=selected();if(!item)return;const c=clone(item);c.id=C.id(item.type);c.name=(item.name||item.type)+" Copy";c.x=clamp(item.x+2,0,100-item.w);c.y=clamp(item.y+2,0,100-item.h);c.z=Date.now();add(c);});
    ui.remove.addEventListener("click",()=>{if(!selectedId)return;layout.items=layout.items.filter(i=>i.id!==selectedId);selectedId=null;save();render();});ui.front.addEventListener("click",()=>{const i=selected();if(i){i.z=Math.max(0,...layout.items.map(x=>x.z||0))+1;save();render();}});ui.back.addEventListener("click",()=>{const i=selected();if(i){i.z=Math.min(0,...layout.items.map(x=>x.z||0))-1;save();render();}});ui.canvas.addEventListener("pointerdown",e=>{if(edit&&e.target===ui.canvas){selectedId=null;render();}});
    renderLibrary("widgets");render();loadAssets();poll();setInterval(poll,500);
  }catch(e){fail(e);}
})();
