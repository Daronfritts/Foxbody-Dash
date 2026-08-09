window.FoxDashCatalog = (() => {
  const gaugeProfiles = {
    "engine.rpm": {label:"Engine RPM",title:"RPM",unit:"x1000",min:0,max:8000,majorTicks:8,minorTicks:40,labels:["0","1","2","3","4","5","6","7","8"],warningHigh:6000,icon:"rpm"},
    "engine.speed": {label:"Vehicle Speed",title:"MPH",unit:"",min:0,max:200,majorTicks:10,minorTicks:50,labels:["0","20","40","60","80","100","120","140","160","180","200"],icon:"speed"},
    "engine.coolant": {label:"Coolant Temp",title:"COOLANT",unit:"°F",min:100,max:260,majorTicks:4,minorTicks:20,labels:["100","140","180","220","260"],warningHigh:230,icon:"coolant"},
    "engine.oil": {label:"Oil Pressure",title:"OIL",unit:"PSI",min:0,max:80,majorTicks:4,minorTicks:20,labels:["0","20","40","60","80"],warningLow:12,icon:"oil"},
    "engine.fuel": {label:"Fuel Level",title:"FUEL",unit:"%",min:0,max:100,majorTicks:4,minorTicks:20,labels:["E","25","1/2","75","F"],warningLow:15,icon:"fuel"},
    "engine.battery": {label:"Battery Voltage",title:"VOLTS",unit:"V",min:10,max:18,majorTicks:4,minorTicks:20,labels:["10","12","14","16","18"],warningLow:11.5,warningHigh:16,icon:"battery"},
    "engine.afr": {label:"Air/Fuel Ratio",title:"AFR",unit:"",min:10,max:20,majorTicks:5,minorTicks:25,labels:["10","12","14","16","18","20"],icon:"afr"},
    "engine.map": {label:"MAP",title:"MAP",unit:"kPa",min:0,max:110,majorTicks:5,minorTicks:25,labels:["0","22","44","66","88","110"],icon:"map"},
    "engine.fuelPressure": {label:"Fuel Pressure",title:"FUEL PSI",unit:"PSI",min:0,max:100,majorTicks:5,minorTicks:25,labels:["0","20","40","60","80","100"],icon:"fuel-pressure"}
  };

  const gaugeDataSources = [["none","None"], ...Object.entries(gaugeProfiles).map(([key,p])=>[key,p.label])];
  const alertDataSources = [
    ["warnings.checkEngine","Check Engine"],["warnings.oil","Oil Pressure"],["warnings.washer","Washer Fluid"],["warnings.battery","Battery"],["warnings.brake","Brake"],["warnings.coolant","Coolant"],["warnings.lowFuel","Low Fuel"],["warnings.seatbelt","Seatbelt"],["warnings.abs","ABS"],["warnings.tpms","TPMS"],["warnings.traction","Traction Control"],["warnings.airbag","Airbag"],["warnings.doorAjar","Door Ajar"]
  ];
  const indicatorDataSources = [["lights.left_turn","Left Turn"],["lights.right_turn","Right Turn"],["lights.headlights","Headlights"],["lights.high_beams","High Beams"],["lights.fog","Fog Lights"]];
  const bodyDataSources = [["doors.driver","Driver Door"],["doors.passenger","Passenger Door"],["doors.hatch","Hatch"]];
  const dataSources = [...gaugeDataSources,...alertDataSources,...indicatorDataSources,...bodyDataSources];

  const materials = [
    {id:"none",label:"None",css:"none"},
    {id:"black-glass",label:"Black Glass",css:"linear-gradient(145deg,#252525,#050505 60%,#171717)"},
    {id:"brushed-aluminum",label:"Brushed Aluminum",css:"repeating-linear-gradient(90deg,#d7d7d7 0,#868686 1px,#e3e3e3 2px,#9b9b9b 4px)"},
    {id:"gunmetal",label:"Gunmetal",css:"linear-gradient(145deg,#555b60,#1c2023 58%,#3e4348)"},
    {id:"carbon",label:"Carbon Fiber",css:"repeating-linear-gradient(45deg,#111 0 6px,#242424 6px 12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.04) 0 6px,transparent 6px 12px)"},
    {id:"blue-metal",label:"Blue Metallic",css:"linear-gradient(145deg,#0d67a8,#082944 58%,#1497e5)"}
  ];

  const iconTemplates = [
    ["check-engine","Check Engine","warnings.checkEngine","alert"],["oil","Oil Pressure","warnings.oil","alert"],["washer","Washer Fluid","warnings.washer","alert"],["battery","Battery","warnings.battery","alert"],["brake","Brake","warnings.brake","alert"],["coolant","Coolant Temp","warnings.coolant","alert"],["fuel","Low Fuel","warnings.lowFuel","alert"],["seatbelt","Seatbelt","warnings.seatbelt","alert"],["abs","ABS","warnings.abs","alert"],["tpms","TPMS","warnings.tpms","alert"],["traction","Traction Control","warnings.traction","alert"],["airbag","Airbag","warnings.airbag","alert"],["door","Door Ajar","warnings.doorAjar","alert"],
    ["left-turn","Left Turn","lights.left_turn","indicator"],["right-turn","Right Turn","lights.right_turn","indicator"],["headlights","Headlights","lights.headlights","indicator"],["high-beam","High Beams","lights.high_beams","indicator"],["fog","Fog Lights","lights.fog","indicator"]
  ].map(([icon,label,dataSource,role])=>({type:"systemIcon",icon,label,defaults:{name:label,x:10,y:10,w:6,h:8,dataSource,material:"none",transparentSurface:true,scaleMode:"contain",config:{role,inactiveColor:"#6f7378",activeColor:role==="indicator"?"#40d7ff":"#ff4545"}}}));

  const templates = {
    widgets:[
      {type:"gauge",label:"Analog Gauge",defaults:{name:"RPM",x:8,y:10,w:28,h:48,dataSource:"engine.rpm",material:"black-glass",transparentSurface:true,scaleMode:"stretch",gaugeShape:"ellipse",config:{...gaugeProfiles["engine.rpm"],startAngle:225,endAngle:495,faceTransparent:true,faceColor:"#080808",tickColor:"#eeeeee",needleColor:"#e52b2b",hubColor:"#111111",showIcon:true}}},
      {type:"digital",label:"Digital Value",defaults:{name:"Digital Value",x:38,y:12,w:20,h:12,dataSource:"engine.speed",material:"black-glass",transparentSurface:false,scaleMode:"stretch",config:{unit:"MPH",decimals:0}}},
      {type:"bar",label:"Bar Gauge",defaults:{name:"Bar Gauge",x:36,y:30,w:30,h:9,dataSource:"engine.coolant",material:"black-glass",transparentSurface:false,scaleMode:"stretch",config:{min:100,max:260,unit:"°F"}}},
      {type:"info",label:"Info Box",defaults:{name:"Driver Info",x:38,y:14,w:24,h:42,dataSource:"none",material:"black-glass",transparentSurface:false,scaleMode:"stretch"}},
      {type:"status",label:"Status Bar",defaults:{name:"Status Bar",x:5,y:80,w:90,h:8,dataSource:"none",material:"black-glass",transparentSurface:false,scaleMode:"stretch",alerts:alertDataSources.map(([dataSource,label],i)=>({dataSource,label,icon:iconTemplates[i].icon,enabled:true}))}},
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
      {type:"gaugePart",part:"ticks",label:"Tick Scale",defaults:{name:"Ticks",x:20,y:20,w:25,h:25,dataSource:"engine.rpm",material:"none",transparentSurface:true,scaleMode:"stretch",config:{...gaugeProfiles["engine.rpm"],startAngle:225,endAngle:495,tickColor:"#eeeeee"}}},
      {type:"gaugePart",part:"needle",label:"Needle",defaults:{name:"Needle",x:20,y:20,w:25,h:25,dataSource:"engine.rpm",material:"none",transparentSurface:true,scaleMode:"stretch",config:{...gaugeProfiles["engine.rpm"],startAngle:225,endAngle:495,needleColor:"#e52b2b"}}},
      {type:"gaugePart",part:"hub",label:"Needle Hub",defaults:{name:"Hub",x:20,y:20,w:10,h:10,dataSource:"none",material:"none",transparentSurface:true,scaleMode:"stretch",config:{hubColor:"#111111"}}},
      {type:"gaugePart",part:"digital",label:"Digital Readout",defaults:{name:"Digital Readout",x:20,y:20,w:16,h:8,dataSource:"none",material:"none",transparentSurface:true,scaleMode:"stretch",config:{defaultValue:0,decimals:0,unit:""}}},
      {type:"gaugePart",part:"label",label:"Gauge Label",defaults:{name:"Gauge Label",x:20,y:20,w:16,h:6,dataSource:"none",material:"none",transparentSurface:true,scaleMode:"stretch",config:{text:"RPM"}}}
    ],
    icons:iconTemplates
  };

  function profileFor(source){return gaugeProfiles[source]||null;}
  function id(prefix="item"){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function fromTemplate(t,extra={}){const item={...clone(t.defaults||{}),...clone(extra)};item.id=item.id||id(t.type||"item");item.type=t.type;if(t.shape)item.shape=t.shape;if(t.part)item.part=t.part;if(t.icon)item.icon=t.icon;item.x??=10;item.y??=10;item.w??=20;item.h??=20;item.rotation??=0;item.opacity??=1;item.visible??=true;item.lockAspect??=false;item.z??=Date.now();item.scaleMode??="stretch";item.transparentSurface??=false;return item;}

  return {gaugeProfiles,gaugeDataSources,alertDataSources,indicatorDataSources,bodyDataSources,dataSources,materials,templates,profileFor,id,clone,fromTemplate};
})();