window.FoxGaugeRenderer = (() => {
  const NS="http://www.w3.org/2000/svg";
  const svg=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;};
  const polar=(cx,cy,r,a)=>{const rad=(a-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}};
  const valueAngle=(value,min,max,start,end)=>{const pct=(Math.max(min,Math.min(max,value))-min)/(max-min||1);return start+(end-start)*pct;};
  const arc=(cx,cy,r,start,end)=>{const a=polar(cx,cy,r,start),b=polar(cx,cy,r,end);return `M ${a.x} ${a.y} A ${r} ${r} 0 ${Math.abs(end-start)>180?1:0} 1 ${b.x} ${b.y}`;};

  function render(host,item,value){
    const c=item.config||{};const min=Number(c.min??0),max=Number(c.max??100),start=Number(c.startAngle??225),end=Number(c.endAngle??495);const major=Math.max(1,Number(c.majorTicks??5)),minor=Math.max(major,Number(c.minorTicks??25));
    const numeric=Number.isFinite(Number(value))?Number(value):min;
    const root=svg("svg",{viewBox:"0 0 430 430",class:"gaugeSvg"});const cx=215,cy=215,r=176;
    root.appendChild(svg("circle",{cx,cy,r:202,fill:"none",stroke:"rgba(255,255,255,.28)","stroke-width":4}));
    root.appendChild(svg("circle",{cx,cy,r:191,fill:"#080808",stroke:"rgba(255,255,255,.08)","stroke-width":2}));
    if(c.warningHigh!=null&&Number(c.warningHigh)<max)root.appendChild(svg("path",{d:arc(cx,cy,r-9,valueAngle(Number(c.warningHigh),min,max,start,end),end),class:"warningArc"}));
    for(let i=0;i<=minor;i++){
      const v=min+(max-min)*(i/minor),a=valueAngle(v,min,max,start,end),isMajor=Math.abs((i/(minor/major))-Math.round(i/(minor/major)))<.001;
      const p1=polar(cx,cy,r-8,a),p2=polar(cx,cy,r-(isMajor?29:18),a);root.appendChild(svg("line",{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,class:isMajor?"gaugeTick":"gaugeMinor","stroke-width":isMajor?3:1.3}));
    }
    for(let i=0;i<=major;i++){
      const v=min+(max-min)*(i/major),a=valueAngle(v,min,max,start,end),p=polar(cx,cy,r-50,a);const t=svg("text",{x:p.x,y:p.y,class:"gaugeNumber"});
      if(Array.isArray(c.labels)&&c.labels[i]!=null)t.textContent=c.labels[i];else t.textContent=Math.round(v);root.appendChild(t);
    }
    const title=svg("text",{x:cx,y:150,class:"gaugeTitle"});title.textContent=c.title||item.name||"GAUGE";root.appendChild(title);
    const unit=svg("text",{x:cx,y:174,class:"gaugeNumber"});unit.textContent=c.unit||"";root.appendChild(unit);
    const ang=valueAngle(numeric,min,max,start,end),tip=polar(cx,cy,133,ang),tail=polar(cx,cy,25,ang+180);root.appendChild(svg("line",{x1:tail.x,y1:tail.y,x2:tip.x,y2:tip.y,class:"gaugeNeedle"}));
    root.appendChild(svg("circle",{cx,cy,r:17,class:"gaugeHub"}));
    const val=svg("text",{x:cx,y:280,class:"gaugeValue"});val.textContent=Number.isFinite(Number(value))?String(Math.round(Number(value))):"--";root.appendChild(val);
    host.replaceChildren(root);
  }

  function renderPart(host,item,value){
    const part=item.part;const root=svg("svg",{viewBox:"0 0 430 430",class:"gaugeSvg"});const cx=215,cy=215,r=176;
    if(part==="ticks"){for(let i=0;i<=40;i++){const a=225+(270*i/40),p1=polar(cx,cy,r,a),p2=polar(cx,cy,r-(i%5===0?30:16),a);root.appendChild(svg("line",{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,class:i%5===0?"gaugeTick":"gaugeMinor","stroke-width":i%5===0?3:1.3}));}}
    else if(part==="needle"){const a=valueAngle(Number(value)||0,0,8000,225,495),tip=polar(cx,cy,135,a);root.appendChild(svg("line",{x1:cx,y1:cy,x2:tip.x,y2:tip.y,class:"gaugeNeedle"}));}
    else if(part==="hub"){root.appendChild(svg("circle",{cx,cy,r:42,class:"gaugeHub"}));}
    else if(part==="label"){const t=svg("text",{x:cx,y:cy,class:"gaugeTitle"});t.textContent=item.config?.text||item.name||"LABEL";root.appendChild(t);}
    host.replaceChildren(root);
  }
  return {render,renderPart};
})();
