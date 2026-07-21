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
            y:180,
            fill:"white",
            "font-size":"46",
            "font-family":"Arial",
            "font-weight":"bold",
            "text-anchor":"middle"
        });

        this.svg.appendChild(this.valueText);

    }

    createNeedle(){

        this.needle = svgElement("line",{
            x1:this.cx,
            y1:this.cy,
            x2:this.cx,
            y2:this.cy-120,
            stroke:"#ff5b1f",
            "stroke-width":"6",
            "stroke-linecap":"round"
        });

        this.needle.style.transformOrigin = "200px 200px";

        this.svg.appendChild(this.needle);

        this.hub = svgElement("circle",{
            cx:this.cx,
            cy:this.cy,
            r:9,
            fill:"white"
        });

        this.svg.appendChild(this.hub);

    }

    setValue(value){

        this.value = value;

        const percent = (value-this.min)/(this.max-this.min);

        const angle = -135 + percent*270;

        this.needle.style.transform = `rotate(${angle}deg)`;

        if(this.label==="RPM"){

            this.valueText.textContent = Math.round(value);

        }else{

            this.valueText.textContent = Math.round(value);

        }

    }

    sweep(){

        let value = this.min;

        let direction = 1;

        const timer = setInterval(()=>{

            value += direction*150;

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
