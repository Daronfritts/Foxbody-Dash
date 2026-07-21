class Gauge {

    constructor(id, min, max, value, title) {

        this.svg = document.getElementById(id);

        this.min = min;
        this.max = max;
        this.value = value;
        this.title = title;

        this.cx = 200;
        this.cy = 200;
        this.radius = 150;

        drawGaugeFace(this.svg, this.min, this.max, this.title);

        this.createNeedle();

        this.setValue(value);

    }

    createNeedle(){

        this.needle=document.createElementNS("http://www.w3.org/2000/svg","line");

        this.needle.setAttribute("x1",this.cx);

        this.needle.setAttribute("y1",this.cy);

        this.needle.setAttribute("x2",this.cx);

        this.needle.setAttribute("y2",this.cy-this.radius+35);

        this.needle.setAttribute("stroke","#ff3b30");

        this.needle.setAttribute("stroke-width","5");

        this.needle.setAttribute("stroke-linecap","round");

        this.needle.style.transformOrigin="200px 200px";

        this.svg.appendChild(this.needle);

        this.hub=document.createElementNS("http://www.w3.org/2000/svg","circle");

        this.hub.setAttribute("cx",this.cx);

        this.hub.setAttribute("cy",this.cy);

        this.hub.setAttribute("r","8");

        this.hub.setAttribute("fill","white");

        this.svg.appendChild(this.hub);

    }

    setValue(value){

        this.value=value;

        let percent=(value-this.min)/(this.max-this.min);

        let angle=(-135)+(percent*270);

        this.needle.style.transform=`rotate(${angle}deg)`;

    }

    sweep(){

        let value=this.min;

        let direction=1;

        const timer=setInterval(()=>{

            value+=direction*150;

            if(value>=this.max){

                direction=-1;

            }

            if(value<=this.min){

                value=this.min;

                this.setValue(value);

                clearInterval(timer);

                return;

            }

            this.setValue(value);

        },20);

    }

}
