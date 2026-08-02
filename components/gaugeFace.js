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

function drawGaugeFace(svg, min, max, label, scale = 1) {

    svg.innerHTML = "";

    const cx = 200 * scale;
    const cy = 200 * scale;
    const radius = 165 * scale;

    // Background

    svg.appendChild(svgElement("circle",{
        cx,
        cy,
        r:radius,
        fill:"#111"
    }));

// Outer Bezel

svg.appendChild(svgElement("circle",{
    cx,
    cy,
    r:radius + (8 * scale),
    fill:"#111",
    stroke:"#555",
    "stroke-width":4 * scale
}));

// Cyan illuminated ring

svg.appendChild(svgElement("circle",{
    cx,
    cy,
    r:radius - (3 * scale),
    fill:"none",
    stroke:"#3E8FD6",
    "stroke-width":10 * scale,
    "stroke-linecap":"round"
}));

// Inner trim ring

svg.appendChild(svgElement("circle",{
    cx,
    cy,
    r:radius - (16 * scale),
    fill:"none",
    stroke:"#3a3a3a",
    "stroke-width":6 * scale,
}));

    // Major ticks and numbers

for (let i = 0; i <= 8; i++) {

    const angle = -135 + (270 / 8) * i;

    const outer = polarToCartesian(cx, cy, radius - 8, angle);
    const inner = polarToCartesian(cx, cy, radius - 26, angle);

    let tickColor = "#E6E6E6";

    if (label === "RPM") {
        if (i >= 7) {
            tickColor = "#D02020";      // 7000-8000
        } else if (i >= 6) {
            tickColor = "#FFB000";      // 6000-7000
        }
    }

    svg.appendChild(svgElement("line",{
        x1: outer.x,
        y1: outer.y,
        x2: inner.x,
        y2: inner.y,
        stroke: tickColor,
        "stroke-width":"4",
        "stroke-linecap":"round"
    }));

    const textPos = polarToCartesian(cx, cy, radius - 54, angle);

    const text = svgElement("text",{
        x: textPos.x,
        y: textPos.y,
        fill:"#E6E6E6",
        "font-size":"24",
        "font-family":"Arial",
        "font-weight":"bold",
        "text-anchor":"middle",
        "dominant-baseline":"middle"
    });

    if (label === "RPM") {

        text.textContent = i;

    } else if (label === "MPH") {

        text.textContent = i * 25;

    } else {

        text.textContent = i;

    }

    svg.appendChild(text);

}

    // Minor ticks

for (let i = 0; i <= 40; i++) {

    if (i % 5 === 0) continue;

    const angle = -135 + (270 / 40) * i;

    const outer = polarToCartesian(cx, cy, radius - 8, angle);
    const inner = polarToCartesian(cx, cy, radius - 22, angle);

    let tickColor = "#AFC8D8";

    if (label === "RPM") {

        if (i >= 33) {
            tickColor = "#D02020";      // 6500-8000
        } else if (i >= 28) {
            tickColor = "#FFB000";      // 5500-6500
        }

    }

    svg.appendChild(svgElement("line",{
        x1: outer.x,
        y1: outer.y,
        x2: inner.x,
        y2: inner.y,
        stroke: tickColor,
        "stroke-width":"2",
        "stroke-linecap":"round"
    }));

}

    // Label

    const labelText = svgElement("text",{
        x:200,
        y:240,
        fill:"#E6E6E6",
        "font-size":"20",
        "font-family":"Arial",
        "font-weight":"bold",
        "text-anchor":"middle"
    });

    labelText.textContent = label;

    svg.appendChild(labelText);

}
