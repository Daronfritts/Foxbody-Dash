(() => {
  const STORAGE_KEY = "foxbodyDash.gaugeLayout";
  const ITEM_GAP = 0.35;
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

  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

  function overlaps(a,b){
    return a.x < b.x + b.w + ITEM_GAP &&
           a.x + a.w + ITEM_GAP > b.x &&
           a.y < b.y + b.h + ITEM_GAP &&
           a.y + a.h + ITEM_GAP > b.y;
  }

  function normalizeItems(savedItems){
    const result = clone(DEFAULT_ITEMS);
    if(!Array.isArray(savedItems)) return result;

    const freeform = savedItems.some(item => Number.isFinite(item?.x) && Number.isFinite(item?.y));
    if(!freeform) return result;

    savedItems.forEach(saved => {
      const id = saved.id || saved.gauge;
      const target = result.find(item => item.id === id);
      if(!target) return;
      Object.assign(target, saved, {id, type:saved.type || target.type});
      target.w = Number.isFinite(Number(target.w)) && Number(target.w) > 0 ? Number(target.w) : target.w;
      target.h = Number.isFinite(Number(target.h)) && Number(target.h) > 0 ? Number(target.h) : target.h;
      target.x = clamp(Number.isFinite(Number(target.x)) ? Number(target.x) : 0,0,100-target.w);
      target.y = clamp(Number.isFinite(Number(target.y)) ? Number(target.y) : 0,0,100-target.h);
    });
    return result;
  }

  function hasOverlap(items){
    for(let i=0;i<items.length;i++){
      for(let j=i+1;j<items.length;j++){
        if(overlaps(items[i],items[j])) return true;
      }
    }
    return false;
  }

  function repairOverlaps(items){
    const placed=[];
    return items.map(item => {
      const original={...item};
      if(!placed.some(other=>overlaps(original,other))){
        placed.push(original);
        return original;
      }

      let best=null;
      let bestDistance=Infinity;
      const maxX=Math.max(0,Math.floor(100-item.w));
      const maxY=Math.max(0,Math.floor(100-item.h));
      for(let y=0;y<=maxY;y++){
        for(let x=0;x<=maxX;x++){
          const candidate={...item,x,y};
          if(placed.some(other=>overlaps(candidate,other))) continue;
          const distance=Math.hypot(x-item.x,y-item.y);
          if(distance<bestDistance){best=candidate;bestDistance=distance;}
        }
      }
      const safe=best || clone(DEFAULT_ITEMS.find(def=>def.id===item.id) || item);
      placed.push(safe);
      return safe;
    });
  }

  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if(!saved) return;

    let normalizedItems = normalizeItems(saved.layout?.items);
    const invalidShape = saved.layout?.mode !== "freeform" ||
      !Array.isArray(saved.layout?.items) ||
      saved.layout.items.some(item => !Number.isFinite(Number(item?.x)) || !Number.isFinite(Number(item?.y)) || !Number.isFinite(Number(item?.w)) || !Number.isFinite(Number(item?.h)));
    const unsafeOverlap = hasOverlap(normalizedItems);

    if(unsafeOverlap) normalizedItems = repairOverlaps(normalizedItems);

    if(invalidShape || unsafeOverlap){
      saved.layout = {mode:"freeform",items:normalizedItems};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      console.info(unsafeOverlap ? "Overlapping gauge layout repaired for live rendering." : "Gauge layout migrated to freeform format for live rendering.");
    }
  }catch(error){
    console.warn("Gauge layout migration skipped:", error);
  }
})();
