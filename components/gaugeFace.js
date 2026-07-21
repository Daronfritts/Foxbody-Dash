const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(type, attrs = {}) {
    const el = document.createElementNS(SVG_NS, type);

    for (const key in attrs) {
        el.setAttribute(key, attrs[key]);
    }

    return el;
}

function polarToCartesian(cx, cy, radius, angle) {

    const rad = (angle - 90) * Math.PI / 180;

    return {
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad)
    };

}

function drawGaugeFace(svg, min, max, label) {

    svg.innerHTML = "";

    const cx = 200;
    const cy = 200;
    const radius = 165;

    // Background

    svg.appendChild(svgElement("circle",{
        cx,
        cy,
        r:radius,
        fill:"#111"
    }));

    // Outer Ring

    svg.appendChild(svgElement("circle",{
        cx,
        cy,
        r:radius,
        fill:"none",
        stroke:"#6cefff",
        "stroke-width":"5"
    }));

    // Major ticks and numbers

    for(let i=0;i<=8;i++){

        const angle = -135 + (270/8)*i;

        const outer = polarToCartesian(cx,cy,radius-8,angle);
        const inner = polarToCartesian(cx,cy,radius-28,angle);

        svg.appendChild(svgElement("line",{
            x1:outer.x,
            y1:outer.y,
            x2:inner.x,
            y2:inner.y,
            stroke:"white",
            "stroke-width":"4"
        }));

        const textPos = polarToCartesian(cx,cy,radius-55,angle);

        const text = svgElement("text",{
            x:textPos.x,
            y:textPos.y,
            fill:"white",
            "font-size":"24",
            "font-family":"Arial",
            "font-weight":"bold",
            "text-anchor":"middle",
            "dominant-baseline":"middle"
        });

        text.textContent = i;

        svg.appendChild(text);

    }

    // Minor ticks

    for(let i=0;i<=40;i++){

        if(i%5===0) continue;

        const angle = -135 + (270/40)*i;

        const outer = polarToCartesian(cx,cy,radius-8,angle);
        const inner = polarToCartesian(cx,cy,radius-18,angle);

        svg.appendChild(svgElement("line",{
            x1:outer.x,
            y1:outer.y,
            x2:inner.x,
            y2:inner.y,
            stroke:"#888",
            "stroke-width":"2"
        }));

    }

    // Label

    const labelText = svgElement("text",{
        x:200,
        y:240,
        fill:"#6cefff",
        "font-size":"20",
        "font-family":"Arial",
        "font-weight":"bold",
        "text-anchor":"middle"
    });

    labelText.textContent = label;

    svg.appendChild(labelText);

}
