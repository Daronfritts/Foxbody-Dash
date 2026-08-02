const indicators = [

    { id:"left",      file:"left-arrow.svg",      color:"green" },
    { id:"highbeam",  file:"highbeam.svg",        color:"blue" },

    { id:"engine",    file:"check-engine.svg",    color:"red" },
    { id:"oil",       file:"oil-warning.svg",     color:"red" },
    { id:"battery",   file:"battery-warning.svg", color:"red" },
    { id:"coolant",   file:"coolant-warning.svg", color:"red" },
    { id:"fuel",      file:"fuel-warning.svg",    color:"amber" },

    { id:"door",      file:"door.svg",            color:"red" },
    { id:"seatbelt",  file:"seatbelt.svg",        color:"red" },

    { id:"abs",       file:"abs.svg",             color:"amber" },
    { id:"brake",     file:"brake.svg",           color:"red" },
    { id:"bulb",      file:"bulb-out.svg",        color:"red" },
    { id:"right",     file:"right-arrow.svg",     color:"green" }
    

];

const bar = document.getElementById("statusBar");

indicators.forEach(ind => {

    const img = document.createElement("img");

    img.id = ind.id;
    img.className = "indicator";
    img.src = `assets/icons/system/${ind.file}`;

    bar.appendChild(img);

});

function setIndicator(id,on){

    const icon = document.getElementById(id);

    if(!icon) return;

    icon.className = "indicator";

    if(on){

        const item = indicators.find(i=>i.id===id);

        if(item){

            icon.classList.add(item.color);

        }

    }

}
