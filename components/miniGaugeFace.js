const MINI_SVG_NS = "http://www.w3.org/2000/svg";

function miniSvg(type, attrs = {}) {

    const el = document.createElementNS(MINI_SVG_NS, type);

    for (const key in attrs) {
        el.setAttribute(key, attrs[key]);
    }

    return el;

}

function miniPolar(cx, cy, radius, angle) {

    const rad = (angle - 90) * Math.PI / 180;

    return {
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad)
    };

}

function drawMiniGaugeFace(svg, options = {}) {

    svg.innerHTML = "";

    const cx = 100;
    const cy = 100;
    const radius = 86;

    const startAngle = options.startAngle ?? -80;
    const sweepAngle = options.sweepAngle ?? 160;

    const majorTicks = options.majorTicks ?? 8;
    const minorTicks = options.minorTicks ?? 32;

    const majorLabels = options.labels ?? [];

    const warningStart = options.warningStart ?? null;
    const warningEnd = options.warningEnd ?? null;
    // Background
    svg.appendChild(miniSvg("circle",{
        cx,
        cy,
        r:radius,
        fill:"#111111"
    }));

    // Outer bezel
    svg.appendChild(miniSvg("circle",{
        cx,
        cy,
        r:94,
        fill:"#111111",
        stroke:"#555555",
        "stroke-width":"2"
    }));

    // Bottom glow
    svg.appendChild(miniSvg("path",{
        d:"M22 118 A78 78 0 0 0 178 118",
        fill:"none",
        stroke:"#3E8FD6",
        "stroke-width":"12",
        opacity:"0.20",
        "stroke-linecap":"round"
    }));

    // Blue illuminated ring
    svg.appendChild(miniSvg("circle",{
        cx,
        cy,
        r:83,
        fill:"none",
        stroke:"#3E8FD6",
        "stroke-width":"4",
        "stroke-linecap":"round"
    }));

    // Inner trim ring
    svg.appendChild(miniSvg("circle",{
        cx,
        cy,
        r:72,
        fill:"none",
        stroke:"#3A3A3A",
        "stroke-width":"2"
    }));
    // -----------------------------
    // Major ticks and labels
    // -----------------------------

    for(let i = 0; i <= majorTicks; i++){

        const angle = startAngle + (sweepAngle / majorTicks) * i;

        const outer = miniPolar(cx, cy, 82, angle);
        const inner = miniPolar(cx, cy, 66, angle);

        svg.appendChild(miniSvg("line",{
            x1:outer.x,
            y1:outer.y,
            x2:inner.x,
            y2:inner.y,
            stroke:"#FFFFFF",
            "stroke-width":"3",
            "stroke-linecap":"round"
        }));

        if(majorLabels[i] !== undefined){

            const pos = miniPolar(cx, cy, 56, angle);

            const text = miniSvg("text",{
                x:pos.x,
                y:pos.y,
                fill:"#E8E8E8",
                "font-size":"11",
                "font-family":"Arial",
                "font-weight":"700",
                "text-anchor":"middle",
                "dominant-baseline":"middle"
            });

            text.textContent = majorLabels[i];

            svg.appendChild(text);

        }

    }

    // -----------------------------
    // Minor ticks
    // -----------------------------

    for(let i = 0; i <= minorTicks; i++){

        const angle = startAngle + (sweepAngle / minorTicks) * i;

        const outer = miniPolar(cx, cy, 82, angle);
        const inner = miniPolar(cx, cy, 74, angle);

        svg.appendChild(miniSvg("line",{
            x1:outer.x,
            y1:outer.y,
            x2:inner.x,
            y2:inner.y,
            stroke:"#AFC8D8",
            "stroke-width":"2",
            "stroke-linecap":"round"
        }));

    }
    // -----------------------------
    // Warning arc
    // -----------------------------

    if(warningStart !== null && warningEnd !== null){

        const start = miniPolar(cx, cy, 83, warningStart);
        const end = miniPolar(cx, cy, 83, warningEnd);

        const largeArc = (warningEnd - warningStart) > 180 ? 1 : 0;

        const path = miniSvg("path",{
            d:
                `M ${start.x} ${start.y}
                 A 83 83 0 ${largeArc} 1 ${end.x} ${end.y}`,
            fill:"none",
            stroke:"#D02020",
            "stroke-width":"5",
            "stroke-linecap":"round"
        });

        svg.appendChild(path);

    }

}
