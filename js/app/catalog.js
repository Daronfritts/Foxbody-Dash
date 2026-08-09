window.FoxDashCatalog = (() => {
  const dataSources = [
    ["none","None"],["engine.rpm","Engine RPM"],["engine.speed","Vehicle Speed"],["engine.coolant","Coolant Temp"],["engine.oil","Oil Pressure"],["engine.fuel","Fuel Level"],["engine.battery","Battery Voltage"],["engine.afr","AFR"],["engine.map","MAP"],["engine.fuelPressure","Fuel Pressure"],["lights.left_turn","Left Turn"],["lights.right_turn","Right Turn"],["lights.high_beams","High Beam"],["doors.driver","Driver Door"],["doors.passenger","Passenger Door"],["doors.hatch","Hatch"]
  ];

  const materials = [
    {id:"none",label:"None",css:"none"},
    {id:"black-glass",label:"Black Glass",css:"linear-gradient(145deg,#252525,#050505 60%,#171717)"},
    {id:"brushed-aluminum",label:"Brushed Aluminum",css:"repeating-linear-gradient(90deg,#d7d7d7 0,#868686 1px,#e3e3e3 2px,#9b9b9b 4px)"},
    {id:"gunmetal",label:"Gunmetal",css:"linear-gradient(145deg,#555b60,#1c2023 58%,#3e4348)"},
    {id:"carbon",label:"Carbon Fiber",css:"repeating-linear-gradient(45deg,#111 0 6px,#242424 6px 12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.04) 0 6px,transparent 6px 12px)"},
    {id:"blue-metal",label:"Blue Metallic",css:"linear-gradient(145deg,#0d67a8,#082944 58%,#1497e5)"}
  ];

  const templates = {
    widgets:[
      {type:"gauge",label:"Analog Gauge",defaults:{name:"Analog Gauge",x:8,y:10,w:28,h:48,dataSource:"engine.rpm",material:"black-glass",transparentSurface:false,scaleMode:"stretch",config:{min:0,max:8000,majorTicks:8,minorTicks:40,startAngle:225,endAngle:495,title:"RPM",unit:"x1000",warningHigh:6000}}},
      {type:"digital",label:"Digital Value",defaults:{name:"Digital Value",x:38,y:12,w:20,h:12,dataSource:"engine.speed",material:"black-glass",transparentSurface:false,scaleMode:"stretch",config:{unit:"MPH",decimals:0}}},
      {type:"bar",label:"Bar Gauge",defaults:{name:"Bar Gauge",x:36,y:30,w:30,h:9,dataSource:"engine.coolant",material:"black-glass",transparentSurface:false,scaleMode:"stretch",config:{min:100,max:260,unit:"°F"}}},
      {type:"info",label:"Info Box",defaults:{name:"Driver Info",x:38,y:14,w:24,h:42,dataSource:"none",material:"black-glass",transparentSurface:false,scaleMode:"stretch"}},
      {type:"status",label:"Status Bar",defaults:{name:"Status Bar",x:5,y:80,w:90,h:8,dataSource:"none",material:"black-glass",transparentSurface:false,scaleMode:"stretch"}},
      {type:"nav",label:"Navigation Bar",defaults:{name:"Navigation",x:5,y:90,w:90,h:8,dataSource:"none",material:"black-glass",transparentSurface:false,scaleMode:"stretch"}},
      {type:"shift",label:"Mustang Shift Light",defaults:{name:"Shift Light",x:42,y:2,w:16,h:12,dataSource:"engine.rpm",material:"none",transparentSurface:true,scaleMode:"contain",assetUrl:"assets/images/mustangWhite.svg",config:{on:5500,hot:6000}}},
      {type:"text",label:"Text",defaults:{name:"Text",x:40,y:45,w:20,h:8,dataSource:"none",material:"none",transparentSurface:true,scaleMode:"stretch",config:{text:"FOXBODY"}}}
    ],
    shapes:[
      {type:"shape",shape:"rectangle",label:"Rectangle",defaults:{name:"Rectangle",x:10,y:10,w:30,h:20,material:"gunmetal",transparentSurface:false,scaleMode:"stretch"}},
      {type:"shape",shape:"rounded",label:"Rounded Rectangle",defaults:{name:"Rounded Rectangle",x:10,y:10,w:30,h:20,material:"brushed-aluminum",transparentSurface:false,scaleMode:"stretch"}},
      {type:"shape",shape:"ellipse",label:"Ellipse",defaults:{name:"Ellipse",x:10,y:10,w:24,h:24,material:"carbon",transparentSurface:false,scaleMode:"stretch"}},
      {type:"shape",shape:"line",label:"Line",defaults:{name:"Line",x:10,y:10,w:35,h:2,material:"blue-metal",transparentSurface:false,scaleMode:"stretch"}}
    ],
    gaugeParts:[
      {type:"gaugePart",part:"ticks",label:"Tick Scale",defaults:{name:"Ticks",x:20,y:20,w:25,h:25,dataSource:"none",material:"none",transparentSurface:true,scaleMode:"stretch"}},
      {type:"gaugePart",part:"needle",label:"Needle",defaults:{name:"Needle",x:20,y:20,w:25,h:25,dataSource:"engine.rpm",material:"none",transparentSurface:true,scaleMode:"stretch"}},
      {type:"gaugePart",part:"hub",label:"Needle Hub",defaults:{name:"Hub",x:20,y:20,w:10,h:10,dataSource:"none",material:"none",transparentSurface:true,scaleMode:"stretch"}},
      {type:"gaugePart",part:"label",label:"Gauge Label",defaults:{name:"Gauge Label",x:20,y:20,w:16,h:6,dataSource:"none",material:"none",transparentSurface:true,scaleMode:"stretch",config:{text:"RPM"}}}
    ]
  };

  function id(prefix="item"){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function fromTemplate(t,extra={}){
    const item={...clone(t.defaults||{}),...clone(extra)};
    item.id=item.id||id(t.type||"item"); item.type=t.type; if(t.shape)item.shape=t.shape; if(t.part)item.part=t.part;
    item.x??=10;item.y??=10;item.w??=20;item.h??=20;item.rotation??=0;item.opacity??=1;item.visible??=true;item.lockAspect??=false;item.z??=Date.now();item.scaleMode??="stretch";item.transparentSurface??=false;
    return item;
  }

  return {dataSources,materials,templates,id,clone,fromTemplate};
})();
