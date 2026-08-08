(() => {
  const STORAGE_KEY = "foxbodyDash.gaugeLayout";
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
      target.x = Number.isFinite(Number(target.x)) ? Number(target.x) : 0;
      target.y = Number.isFinite(Number(target.y)) ? Number(target.y) : 0;
      target.w = Number.isFinite(Number(target.w)) ? Number(target.w) : target.w;
      target.h = Number.isFinite(Number(target.h)) ? Number(target.h) : target.h;
    });
    return result;
  }

  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if(!saved) return;

    const normalizedItems = normalizeItems(saved.layout?.items);
    const needsMigration = saved.layout?.mode !== "freeform" ||
      !Array.isArray(saved.layout?.items) ||
      saved.layout.items.some(item => !Number.isFinite(Number(item?.x)) || !Number.isFinite(Number(item?.y)) || !Number.isFinite(Number(item?.w)) || !Number.isFinite(Number(item?.h)));

    if(needsMigration){
      saved.layout = {mode:"freeform",items:normalizedItems};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      console.info("Gauge layout migrated to freeform format for live rendering.");
    }
  }catch(error){
    console.warn("Gauge layout migration skipped:", error);
  }
})();
