window.FoxbodyWidgets = (() => {
  const DATA_SOURCES = [
    ["none", "None"],
    ["engine.rpm", "Engine RPM"],
    ["engine.speed", "Vehicle Speed"],
    ["engine.coolant", "Coolant Temperature"],
    ["engine.oil", "Oil Pressure"],
    ["engine.fuel", "Fuel Level"],
    ["engine.battery", "Battery Voltage"],
    ["engine.afr", "Air/Fuel Ratio"],
    ["engine.map", "MAP"],
    ["engine.fuelPressure", "Fuel Pressure"],
    ["lights.left_turn", "Left Turn"],
    ["lights.right_turn", "Right Turn"],
    ["lights.high_beams", "High Beam"],
    ["doors.driver", "Driver Door"],
    ["doors.passenger", "Passenger Door"],
    ["doors.hatch", "Hatch"],
    ["system.clock", "Clock"]
  ];

  const MATERIALS = [
    {id:"none", label:"None", css:"none"},
    {id:"black-glass", label:"Black Glass", css:"linear-gradient(145deg,#252525,#050505 60%,#171717)"},
    {id:"brushed-aluminum", label:"Brushed Aluminum", css:"repeating-linear-gradient(90deg,#cfcfcf 0,#888 1px,#d8d8d8 2px,#9e9e9e 4px)"},
    {id:"gunmetal", label:"Gunmetal", css:"linear-gradient(145deg,#565b60,#1d2023 58%,#3c4146)"},
    {id:"carbon", label:"Carbon Fiber", css:"repeating-linear-gradient(45deg,#151515 0 6px,#232323 6px 12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.035) 0 6px,transparent 6px 12px)"},
    {id:"blue-metal", label:"Blue Metallic", css:"linear-gradient(145deg,#0d67a8,#082944 58%,#1497e5)"}
  ];

  const WIDGETS = [
    {type:"gauge", label:"Analog Gauge", defaults:{name:"Gauge",x:8,y:12,w:28,h:46,dataSource:"engine.rpm",material:"black-glass",config:{min:0,max:8000,majorTicks:8,minorTicks:40,labels:["0","1","2","3","4","5","6","7","8"],title:"RPM",subtitle:"x1000",redlineStart:6000}}},
    {type:"digital", label:"Digital Value", defaults:{name:"Digital Value",x:35,y:15,w:20,h:12,dataSource:"engine.speed",material:"black-glass",config:{unit:"MPH",decimals:0}}},
    {type:"bar", label:"Bar Gauge", defaults:{name:"Bar Gauge",x:35,y:30,w:28,h:9,dataSource:"engine.coolant",material:"black-glass",config:{min:100,max:260,unit:"°F"}}},
    {type:"info", label:"Driver Info", defaults:{name:"Driver Info",x:38,y:10,w:24,h:45,dataSource:"none",material:"black-glass"}},
    {type:"status", label:"Status Bar", defaults:{name:"Status Bar",x:5,y:82,w:90,h:8,dataSource:"none",material:"black-glass"}},
    {type:"nav", label:"Navigation Bar", defaults:{name:"Navigation",x:5,y:91,w:90,h:8,dataSource:"none",material:"black-glass"}},
    {type:"shift", label:"Mustang Shift Light", defaults:{name:"Shift Light",x:42,y:3,w:16,h:12,dataSource:"engine.rpm",material:"none"}},
    {type:"text", label:"Text", defaults:{name:"Text",x:40,y:45,w:20,h:8,dataSource:"none",material:"none",config:{text:"FOXBODY"}}}
  ];

  const SHAPES = [
    {type:"shape", shape:"rectangle", label:"Rectangle", defaults:{name:"Rectangle",x:10,y:10,w:30,h:20,material:"gunmetal"}},
    {type:"shape", shape:"rounded", label:"Rounded Rectangle", defaults:{name:"Rounded Rectangle",x:10,y:10,w:30,h:20,material:"brushed-aluminum"}},
    {type:"shape", shape:"ellipse", label:"Ellipse", defaults:{name:"Ellipse",x:10,y:10,w:24,h:24,material:"carbon"}},
    {type:"shape", shape:"line", label:"Line", defaults:{name:"Line",x:10,y:10,w:35,h:2,material:"blue-metal"}}
  ];

  function makeId(prefix="item") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  }

  return {DATA_SOURCES, MATERIALS, WIDGETS, SHAPES, makeId};
})();
