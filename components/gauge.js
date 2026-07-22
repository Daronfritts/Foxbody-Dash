class Gauge {

    constructor(id, min, max, value, label) {

        this.svg = document.getElementById(id);

        this.min = min;
        this.max = max;
        this.value = value;
        this.label = label;

        this.cx = 200;
        this.cy = 200;
        this.radius = 165;

        drawGaugeFace(this.svg, min, max, label);

        this.createDigitalDisplay();
        this.createNeedle();

        this.setValue(value);

    }

    createDigitalDisplay(){

        this.valueText = svgElement("text",{
            x:200,
            y:165,
            fill:"#ffffff",
            "font-size":"50",
            "font-family":"Arial",
            "font-weight":"700",
            "text-anchor":"middle",
            "letter-spacing":"2"
        });

        this.svg.appendChild(this.valueText);

    }

    createNeedle(){

        // Needle shadow
        this.shadow = svgElement("line",{
            x1:this.cx+2,
            y1:this.cy+2,
            x2:this.cx,
            y2:this.cy-122,
            stroke:"#000",
            "stroke-width":"8",
            "stroke-linecap":"round",
            opacity:"0.35"
        });

        this.shadow.style.transformOrigin="200px 200px";
        this.svg.appendChild(this.shadow);

        // Needle
        this.needle = svgElement("line",{
            x1:this.cx,
            y1:this.cy,
            x2:this.cx,
            y2:this.cy-122,
            stroke:"#ff6b1a",
            "stroke-width":"5",
            "stroke-linecap":"round"
        });

        this.needle.style.transformOrigin="200px 200px";
        this.svg.appendChild(this.needle);

        // Center hub
        this.hubOuter = svgElement("circle",{
            cx:this.cx,
            cy:this.cy,
            r:12,
            fill:"#202020",
            stroke:"#6cefff",
            "stroke-width":"3"
        });

        this.svg.appendChild(this.hubOuter);

        this.hubInner = svgElement("circle",{
            cx:this.cx,
            cy:this.cy,
            r:5,
            fill:"#ffffff"
        });

        this.svg.appendChild(this.hubInner);

    }

    setValue(value){

        this.value=value;

        const percent=(value-this.min)/(this.max-this.min);

        const angle=-135+(percent*270);

        this.needle.style.transform=`rotate(${angle}deg)`;
        this.shadow.style.transform=`rotate(${angle}deg)`;

        this.valueText.textContent=Math.round(value);

    }

    sweep(){

        let value=this.min;
        let direction=1;

        const timer=setInterval(()=>{

            value+=direction*150;

            if(value>=this.max){

                value=this.max;
                direction=-1;

            }

            if(value<=this.min && direction===-1){

                value=this.min;
                this.setValue(value);

                clearInterval(timer);
                return;

            }

            this.setValue(value);

        },18);

    }

}
