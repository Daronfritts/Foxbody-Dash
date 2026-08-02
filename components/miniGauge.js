class MiniGauge {

   constructor(id, label, value, units, options = {}) {

        this.container = document.getElementById(id); 
        this.min = options.min ?? 0;
        this.max = options.max ?? 100;
        this.actualValue = value;
        this.container.innerHTML = "";

        this.container.style.position = "relative";

        this.svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        this.svg.setAttribute("viewBox", "0 0 200 200");
        this.svg.style.width = "100%";
        this.svg.style.height = "100%";

        	// Create the icon
        this.icon = document.createElement("img");
        this.icon.className = "miniIcon";

switch (label) {

    case "COOLANT":
        this.icon.src = "assets/icons/gauges/coolant.svg";
        break;

    case "FUEL":
        this.icon.src = "assets/icons/gauges/fuel.svg";
        break;

    case "OIL":
        this.icon.src = "assets/icons/gauges/oil.svg";
        break;

    case "BATTERY":
        this.icon.src = "assets/icons/gauges/battery.svg";
        break;
}

        // Position the icon
        this.icon.style.position = "absolute";
        this.icon.style.left = "50%";
        this.icon.style.top = "46px";
        this.icon.style.width = "30px";
        this.icon.style.height = "30px";
        this.icon.style.transform = "translateX(-50%)";
        this.icon.style.zIndex = "10";

        // Add the SVG first
        this.container.appendChild(this.svg);

        // Then put the icon on top
        this.container.appendChild(this.icon);

        // Draw the same gauge face style
   drawMiniGaugeFace(this.svg,{
       startAngle: options.startAngle ?? -80,
       sweepAngle: options.sweepAngle ?? 160,
       majorTicks: options.majorTicks ?? 4,
       minorTicks: options.minorTicks ?? 20,
       labels: options.labels ?? [],
       warningStart: options.warningStart,
       warningEnd: options.warningEnd
});

        this.createNeedle();
        this.createText(label, value, units);

        this.setValue(value);

    }

    createNeedle() {

       this.shadow = svgElement("line",{
    x1:101,
    y1:101,
    x2:101,
    y2:40,
    stroke:"#000000",
    "stroke-width":"4",
    "stroke-linecap":"round",
    opacity:"0.22"
});

        this.shadow.style.transformOrigin="100px 100px";
        this.shadow.style.transition="transform .15s ease-out";

        this.svg.appendChild(this.shadow);

        this.needle = svgElement("polygon",{
            points:"100,100 97,98 100,36 103,98 101,104 99,104",
            fill:"#FF0000"
        });

        this.needle.style.transformOrigin="100px 100px";
        this.needle.style.transition = "transform .15s ease-out";
      
        this.svg.appendChild(this.needle);

        // Hub

        this.svg.appendChild(svgElement("circle",{
            cx:100,
            cy:100,
            r:6,
            fill:"#202020",
            stroke:"#3E8FD6",
            "stroke-width":"2"
        }));

        this.svg.appendChild(svgElement("circle",{
            cx:100,
            cy:100,
            r:2,
            fill:"#FF0000"
        }));

    }

   createText(label, value, units){
    this.unitsText = units;
    this.label = document.createElement("div");
    this.label.className = "miniLabel";
    this.label.textContent = label;
    this.label.style.position = "absolute";
    this.label.style.left = "50%";
    this.label.style.top = "95px";
    this.label.style.transform = "translateX(-50%)";

    this.value = document.createElement("div");
    this.value.className = "miniValue";
    this.value.innerHTML = `${value} <span class="miniUnit">${units}</span>`;
    this.value.style.position = "absolute";
    this.value.style.left = "50%";
    this.value.style.top = "115px";
    this.value.style.transform = "translateX(-50%)";

    this.container.appendChild(this.label);
    this.container.appendChild(this.value);
}

  setValue(value, updateText = true){

  this.actualValue = value;

    if (updateText) {
       const displayValue =
    this.unitsText === "V"
        ? Number(value).toFixed(1)
        : Math.round(value);

this.value.innerHTML =
    `${displayValue} <span class="miniUnit">${this.unitsText}</span>`;
    }

   const percent = Math.max(
    0,
    Math.min(
        1,
        (value - this.min) /
        (this.max - this.min)
    )
);

    const angle = -80 + (percent * 160);

    this.shadow.style.transform = `rotate(${angle}deg)`;
    this.needle.style.transform = `rotate(${angle}deg)`;

}


sweep(){

    const originalValue = this.actualValue;

    let value = this.min;
    let direction = 1;

    const timer = setInterval(() => {

        const step = (this.max - this.min) / 120;

        value += direction * step;

        if(value >= this.max){

            value = this.max;
            direction = -1;

        }

        if(value <= this.min && direction === -1){

            value = this.min;
     
            this.setValue(originalValue);

            clearInterval(timer);

            return;

        }

        this.setValue(value, false);

    },15);

}

}
