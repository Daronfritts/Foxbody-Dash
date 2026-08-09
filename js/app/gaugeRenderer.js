window.FoxGaugeRenderer = (() => {
  const NS="http://www.w3.org/2000/svg",CX=500,CY=500;
  const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const angleFor=(value,min,max,start,end)=>start+(end-start)*((clamp(Number(value),min,max)-min)/(max-min||1));
  const dir=a=>{const r=(a-90)*Math.PI/180;return{x:Math.cos(r),y:Math.sin(r)}};
  function boundary(shape,angle,inset=0){const d=dir(angle),halfW=450-inset,halfH=450-inset;if(shape==="rectangle"||shape==="rounded"){const tx=Math.abs(d.x)>1e-6?halfW/Math.abs(d.x):Infinity,ty=Math.abs(d.y)>1e-6?halfH/Math.abs(d.y):Infinity,t=Math.min(tx,ty);return{x:CX+d.x*t,y:CY+d.y*t};}const rx=halfW,ry=halfH,t=1/Math.sqrt((d.x*d.x)/(rx*rx)+(d.y*d.y)/(ry*ry));return{x:CX+d.x*t,y:CY+d.y*t};}
  const towardCenter=(p,f)=>({x:CX+(p.x-CX)*f,y:CY+(p.y-CY)*f});
  const shapeName=item=>item.gaugeShape||item.geometry||item.shape||"ellipse";
  const rootSvg=()=>el("svg",{viewBox:"0 0 1000 1000",preserveAspectRatio:"none",class:"gaugeSvg"});

  function drawFace(root,item){const c=item.config||{},shape=shapeName(item),fill=c.faceTransparent===false?(c.faceColor||"#080808"):"none";if(shape==="ellipse")root.appendChild(el("ellipse",{cx:500,cy:500,rx:470,ry:470,fill,stroke:"rgba(255,255,255,.26)","stroke-width":10}));else root.appendChild(el("rect",{x:30,y:30,width:940,height:940,rx:shape==="rounded"?90:0,fill,stroke:"rgba(255,255,255,.26)","stroke-width":10}));}
  function drawTicks(root,item){const c=item.config||{},shape=shapeName(item),start=Number(c.startAngle??225),end=Number(c.endAngle??495),minor=Math.max(1,Number(c.minorTicks??40)),major=Math.max(1,Number(c.majorTicks??8)),every=Math.max(1,Math.round(minor/major)),tickColor=c.tickColor||"#eeeeee";for(let i=0;i<=minor;i++){const a=start+(end-start)*i/minor,outer=boundary(shape,a,55),isMajor=i%every===0,inner=towardCenter(outer,isMajor ? .82 : .89);root.appendChild(el("line",{x1:outer.x,y1:outer.y,x2:inner.x,y2:inner.y,stroke:tickColor,"stroke-width":isMajor?10:5,"stroke-linecap":"round"}));}for(let i=0;i<=major;i++){const a=start+(end-start)*i/major,p=towardCenter(boundary(shape,a,55),.68),t=el("text",{x:p.x,y:p.y,fill:tickColor,"text-anchor":"middle","dominant-baseline":"middle","font-size":"45","font-weight":"600"});t.textContent=Array.isArray(c.labels)&&c.labels[i]!=null?c.labels[i]:Math.round(Number(c.min??0)+(Number(c.max??100)-Number(c.min??0))*i/major);root.appendChild(t);}}

  function polygonPoints(points){return points.map(p=>`${p.x},${p.y}`).join(" ");}
  function offsetPoint(p,nx,ny,amount){return{x:p.x+nx*amount,y:p.y+ny*amount};}
  function drawNeedle(root,item,value){
    const c=item.config||{},shape=shapeName(item),min=Number(c.min??0),max=Number(c.max??8000),start=Number(c.startAngle??225),end=Number(c.endAngle??495),v=c.previewValue??value??min,a=angleFor(v,min,max,start,end),tip=towardCenter(boundary(shape,a,75),.93),back=towardCenter(boundary(shape,a+180,75),.16),color=c.needleColor||"#e52b2b",style=c.needleStyle||"classic",g=el("g",{class:"gaugeNeedleGroup"});
    const dx=tip.x-CX,dy=tip.y-CY,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    if(style==="tapered"){
      g.appendChild(el("polygon",{points:polygonPoints([offsetPoint(back,nx,ny,11),offsetPoint({x:CX,y:CY},nx,ny,20),tip,offsetPoint({x:CX,y:CY},nx,ny,-20),offsetPoint(back,nx,ny,-11)]),fill:color,stroke:"rgba(255,255,255,.30)","stroke-width":3}));
    }else if(style==="wedge"){
      const mid=towardCenter(tip,.48);g.appendChild(el("polygon",{points:polygonPoints([offsetPoint(back,nx,ny,7),offsetPoint(mid,nx,ny,31),tip,offsetPoint(mid,nx,ny,-31),offsetPoint(back,nx,ny,-7)]),fill:color,stroke:"rgba(0,0,0,.55)","stroke-width":5}));
    }else if(style==="race"){
      g.appendChild(el("line",{x1:back.x,y1:back.y,x2:tip.x,y2:tip.y,stroke:"#111","stroke-width":27,"stroke-linecap":"round"}));
      g.appendChild(el("line",{x1:back.x,y1:back.y,x2:tip.x,y2:tip.y,stroke:color,"stroke-width":13,"stroke-linecap":"round"}));
      const hi=towardCenter(tip,.82);g.appendChild(el("line",{x1:CX,y1:CY,x2:hi.x,y2:hi.y,stroke:"rgba(255,255,255,.45)","stroke-width":3,"stroke-linecap":"round"}));
    }else if(style==="slim"){
      g.appendChild(el("line",{x1:back.x,y1:back.y,x2:tip.x,y2:tip.y,stroke:color,"stroke-width":7,"stroke-linecap":"round"}));
      g.appendChild(el("circle",{cx:tip.x,cy:tip.y,r:8,fill:color}));
    }else{
      g.appendChild(el("line",{x1:back.x,y1:back.y,x2:tip.x,y2:tip.y,stroke:"rgba(0,0,0,.6)","stroke-width":22,"stroke-linecap":"round"}));
      g.appendChild(el("line",{x1:back.x,y1:back.y,x2:tip.x,y2:tip.y,stroke:color,"stroke-width":13,"stroke-linecap":"round"}));
    }
    root.appendChild(g);
  }
  function drawHub(root,item){const c=item.config||{};root.appendChild(el("circle",{cx:500,cy:500,r:54,fill:c.hubColor||"#111111",stroke:c.hubStroke||"#777777","stroke-width":8}));}
  function render(host,item,value){const root=rootSvg(),c=item.config||{};drawFace(root,item);drawTicks(root,item);drawNeedle(root,item,value);drawHub(root,item);const title=el("text",{x:500,y:350,fill:c.textColor||"#ffffff","text-anchor":"middle","font-size":"55","font-weight":"700"});title.textContent=c.title||item.name||"GAUGE";root.appendChild(title);const unit=el("text",{x:500,y:410,fill:c.textColor||"#ffffff","text-anchor":"middle","font-size":"34"});unit.textContent=c.unit||"";root.appendChild(unit);const val=el("text",{x:500,y:650,fill:c.textColor||"#ffffff","text-anchor":"middle","font-size":"62","font-weight":"700"});val.textContent=Number.isFinite(Number(value))?Math.round(Number(value)):"0";root.appendChild(val);host.replaceChildren(root);}
  function renderPart(host,item,value){const root=rootSvg();if(item.part==="ticks")drawTicks(root,item);else if(item.part==="needle")drawNeedle(root,item,value);else if(item.part==="hub")drawHub(root,item);else if(item.part==="label"){const t=el("text",{x:500,y:500,fill:item.config?.textColor||"#ffffff","text-anchor":"middle","dominant-baseline":"middle","font-size":"150","font-weight":"700"});t.textContent=item.config?.text||item.name||"LABEL";root.appendChild(t);}else if(item.part==="digital"){const v=value==null||value===""?(item.config?.defaultValue??0):Number(value),dec=item.config?.decimals??0,t=el("text",{x:500,y:500,fill:item.config?.textColor||"#ffffff","text-anchor":"middle","dominant-baseline":"middle","font-size":"310","font-weight":"700"});t.textContent=Number.isFinite(Number(v))?Number(v).toFixed(dec):"0";root.appendChild(t);}host.replaceChildren(root);}

  function renderSystemIcon(host,item,active){
    const root=el("svg",{viewBox:"0 0 100 100",class:"systemIconSvg"}),c=item.config||{},color=active?(c.activeColor||"#ff4545"):(c.inactiveColor||"#70757a"),stroke={fill:"none",stroke:color,"stroke-width":7,"stroke-linecap":"round","stroke-linejoin":"round"};
    const path=d=>root.appendChild(el("path",{d,...stroke})),line=(x1,y1,x2,y2)=>root.appendChild(el("line",{x1,y1,x2,y2,...stroke}));
    const text=(value,size=27)=>{const t=el("text",{x:50,y:58,fill:color,"text-anchor":"middle","font-size":size,"font-weight":"700"});t.textContent=value;root.appendChild(t);};
    switch(item.icon){
      case"rpm":text("RPM",24);path("M22 72 Q50 20 78 72");break;
      case"speed":text("MPH",22);path("M18 72 Q50 18 82 72");line(50,55,72,38);break;
      case"afr":text("AFR",25);break;
      case"map":text("MAP",25);break;
      case"fuel-pressure":text("PSI",25);path("M24 78 H76");break;
      case"check-engine":path("M15 35 H25 L32 25 H68 L75 35 H87 V70 H78 L70 78 H30 L22 70 H15 Z");line(87,45,94,45);break;
      case"oil":path("M15 55 H58 L70 43 L85 57 L72 70 H28 Z");path("M78 31 C84 39 88 43 88 50");break;
      case"washer":path("M18 65 Q50 78 82 65 L73 42 H27 Z");line(36,30,42,20);line(50,28,50,16);line(64,30,58,20);break;
      case"battery":path("M18 32 H82 V72 H18 Z");line(30,25,42,25);line(58,25,70,25);line(30,52,44,52);line(37,45,37,59);line(58,52,72,52);break;
      case"brake":root.appendChild(el("circle",{cx:50,cy:50,r:30,...stroke}));line(50,32,50,55);root.appendChild(el("circle",{cx:50,cy:67,r:3,fill:color}));path("M14 32 Q5 50 14 68 M86 32 Q95 50 86 68");break;
      case"coolant":path("M48 20 V58 Q34 67 48 80 Q62 67 52 58 V20 Z");path("M18 82 Q28 74 38 82 T58 82 T78 82");break;
      case"fuel":path("M24 18 H58 V82 H24 Z M58 30 H68 L78 40 V72 Q78 80 70 80");break;
      case"seatbelt":root.appendChild(el("circle",{cx:32,cy:24,r:8,fill:color}));path("M30 36 L42 54 L58 72 M42 54 L28 78 M52 24 L78 78");break;
      case"abs":case"tpms":case"traction":case"airbag":text(item.icon==="traction"?"TC":item.icon.toUpperCase(),item.icon==="traction"?24:30);root.appendChild(el("circle",{cx:50,cy:50,r:38,...stroke}));break;
      case"door":path("M25 18 H70 L82 82 H18 Z M40 35 H58 V67 H40 Z");break;
      case"left-turn":path("M12 50 L48 20 V38 H88 V62 H48 V80 Z");break;
      case"right-turn":path("M88 50 L52 20 V38 H12 V62 H52 V80 Z");break;
      case"headlights":path("M22 25 Q50 50 22 75");line(48,28,82,18);line(48,43,86,38);line(48,58,86,58);line(48,73,82,82);break;
      case"high-beam":path("M22 25 Q50 50 22 75");line(48,25,88,25);line(48,42,88,42);line(48,59,88,59);line(48,76,88,76);break;
      case"fog":path("M22 25 Q50 50 22 75");line(48,30,80,30);line(48,48,88,48);line(48,66,80,66);path("M42 82 Q58 72 74 82");break;
      default:text(item.name||"ICON",22);
    }
    host.replaceChildren(root);
  }

  function sweepAssembly(item,render){const needles=(item.children||[]).filter(c=>c.type==="gaugePart"&&c.part==="needle");if(!needles.length)return;const originals=needles.map(n=>n.config?.previewValue);let start=null;function frame(ts){start??=ts;const p=Math.min(1,(ts-start)/1100),phase=p<.5?p*2:(1-p)*2;needles.forEach(n=>{n.config??={};const min=Number(n.config.min??0),max=Number(n.config.max??8000);n.config.previewValue=min+(max-min)*phase;});render();if(p<1)requestAnimationFrame(frame);else{needles.forEach((n,i)=>{if(originals[i]==null)delete n.config.previewValue;else n.config.previewValue=originals[i];});render();}}requestAnimationFrame(frame);}
  return {render,renderPart,renderSystemIcon,sweepAssembly};
})();
