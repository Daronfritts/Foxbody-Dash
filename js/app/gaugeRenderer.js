window.FoxGaugeRenderer = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const SIZE = 1000;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  const svg = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  const valueAngle = (value, min, max, start, end) => {
    const pct = (Math.max(min, Math.min(max, value)) - min) / (max - min || 1);
    return start + (end - start) * pct;
  };

  function direction(angle) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: Math.cos(rad), y: Math.sin(rad) };
  }

  function geometryOf(item) {
    const type = item?.geometry?.type || item?.shape || "ellipse";
    return {
      type: type === "rectangle" || type === "rounded" || type === "rect" ? "rectangle" : "ellipse",
      padding: Number(item?.geometry?.padding ?? 42)
    };
  }

  function boundaryPoint(angle, geometry, inset = 0) {
    const d = direction(angle);
    const pad = Math.max(0, geometry.padding + inset);
    const halfW = Math.max(20, CX - pad);
    const halfH = Math.max(20, CY - pad);

    if (geometry.type === "rectangle") {
      const tx = Math.abs(d.x) > 0.00001 ? halfW / Math.abs(d.x) : Infinity;
      const ty = Math.abs(d.y) > 0.00001 ? halfH / Math.abs(d.y) : Infinity;
      const t = Math.min(tx, ty);
      return { x: CX + d.x * t, y: CY + d.y * t };
    }

    const denom = Math.sqrt((d.x * d.x) / (halfW * halfW) + (d.y * d.y) / (halfH * halfH)) || 1;
    const t = 1 / denom;
    return { x: CX + d.x * t, y: CY + d.y * t };
  }

  function needlePoints(angle, geometry, tipInset = 72, tailLength = 70) {
    const d = direction(angle);
    const tip = boundaryPoint(angle, geometry, tipInset);
    return {
      x1: CX - d.x * tailLength,
      y1: CY - d.y * tailLength,
      x2: tip.x,
      y2: tip.y
    };
  }

  function drawNeedle(root, angle, geometry, config = {}) {
    const p = needlePoints(angle, geometry, Number(config.tipInset ?? 72), Number(config.tailLength ?? 70));
    const line = svg("line", {
      x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2,
      class: "gaugeNeedle gaugeNeedleLine"
    });
    line.dataset.angle = String(angle);
    line.dataset.geometry = geometry.type;
    line.dataset.padding = String(geometry.padding);
    line.dataset.tipInset = String(Number(config.tipInset ?? 72));
    line.dataset.tailLength = String(Number(config.tailLength ?? 70));
    root.appendChild(line);
    return line;
  }

  function updateNeedleLine(line, angle) {
    const geometry = {
      type: line.dataset.geometry === "rectangle" ? "rectangle" : "ellipse",
      padding: Number(line.dataset.padding || 42)
    };
    const p = needlePoints(
      angle,
      geometry,
      Number(line.dataset.tipInset || 72),
      Number(line.dataset.tailLength || 70)
    );
    line.setAttribute("x1", p.x1);
    line.setAttribute("y1", p.y1);
    line.setAttribute("x2", p.x2);
    line.setAttribute("y2", p.y2);
    line.dataset.angle = String(angle);
  }

  function gaugeRoot() {
    return svg("svg", {
      viewBox: `0 0 ${SIZE} ${SIZE}`,
      preserveAspectRatio: "none",
      class: "gaugeSvg"
    });
  }

  function drawTicks(root, config, geometry) {
    const start = Number(config.startAngle ?? 225);
    const end = Number(config.endAngle ?? 495);
    const minor = Math.max(1, Number(config.minorTicks ?? 40));
    const major = Math.max(1, Number(config.majorTicks ?? 8));
    const majorEvery = Math.max(1, Math.round(minor / major));

    for (let i = 0; i <= minor; i++) {
      const angle = start + (end - start) * i / minor;
      const isMajor = i % majorEvery === 0;
      const outer = boundaryPoint(angle, geometry, Number(config.tickOuterInset ?? 28));
      const inner = boundaryPoint(angle, geometry, Number(config.tickOuterInset ?? 28) + (isMajor ? 76 : 42));
      root.appendChild(svg("line", {
        x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y,
        class: isMajor ? "gaugeTick" : "gaugeMinor",
        "stroke-width": isMajor ? 7 : 3.2
      }));
    }
  }

  function render(host, item, value) {
    const c = item.config || {};
    const min = Number(c.min ?? 0), max = Number(c.max ?? 100);
    const start = Number(c.startAngle ?? 225), end = Number(c.endAngle ?? 495);
    const major = Math.max(1, Number(c.majorTicks ?? 5));
    const numeric = Number.isFinite(Number(value)) ? Number(value) : min;
    const geometry = geometryOf(item);
    const root = gaugeRoot();

    if (geometry.type === "rectangle") {
      root.appendChild(svg("rect", {x:34,y:34,width:932,height:932,rx:55,fill:"none",stroke:"rgba(255,255,255,.28)","stroke-width":8}));
      root.appendChild(svg("rect", {x:52,y:52,width:896,height:896,rx:42,fill:"#080808",stroke:"rgba(255,255,255,.08)","stroke-width":4}));
    } else {
      root.appendChild(svg("ellipse", {cx:CX,cy:CY,rx:466,ry:466,fill:"none",stroke:"rgba(255,255,255,.28)","stroke-width":8}));
      root.appendChild(svg("ellipse", {cx:CX,cy:CY,rx:448,ry:448,fill:"#080808",stroke:"rgba(255,255,255,.08)","stroke-width":4}));
    }

    drawTicks(root, c, geometry);

    for (let i = 0; i <= major; i++) {
      const v = min + (max - min) * i / major;
      const angle = valueAngle(v, min, max, start, end);
      const p = boundaryPoint(angle, geometry, 145);
      const t = svg("text", {x:p.x,y:p.y,class:"gaugeNumber"});
      t.textContent = Array.isArray(c.labels) && c.labels[i] != null ? c.labels[i] : Math.round(v);
      root.appendChild(t);
    }

    const title = svg("text", {x:CX,y:365,class:"gaugeTitle"});
    title.textContent = c.title || item.name || "GAUGE";
    root.appendChild(title);
    const unit = svg("text", {x:CX,y:415,class:"gaugeNumber"});
    unit.textContent = c.unit || "";
    root.appendChild(unit);

    drawNeedle(root, valueAngle(numeric,min,max,start,end), geometry, c);
    root.appendChild(svg("circle", {cx:CX,cy:CY,r:38,class:"gaugeHub"}));
    const val = svg("text", {x:CX,y:650,class:"gaugeValue"});
    val.textContent = Number.isFinite(Number(value)) ? String(Math.round(Number(value))) : "--";
    root.appendChild(val);
    host.replaceChildren(root);
  }

  function renderPart(host, item, value) {
    const part = item.part;
    const root = gaugeRoot();
    const c = item.config || {};
    const geometry = geometryOf(item);

    if (part === "ticks") {
      drawTicks(root, c, geometry);
    } else if (part === "needle") {
      const min = Number(c.min ?? 0), max = Number(c.max ?? 8000);
      const start = Number(c.startAngle ?? 225), end = Number(c.endAngle ?? 495);
      const angle = valueAngle(Number(value) || min, min, max, start, end);
      drawNeedle(root, angle, geometry, c);
    } else if (part === "hub") {
      root.appendChild(svg("circle", {cx:CX,cy:CY,r:Number(c.radius ?? 75),class:"gaugeHub"}));
    } else if (part === "label") {
      const t = svg("text", {x:CX,y:CY,class:"gaugeTitle"});
      t.textContent = c.text || item.name || "LABEL";
      root.appendChild(t);
    }

    host.replaceChildren(root);
  }

  function sweepAssembly(item, canvas) {
    requestAnimationFrame(() => {
      const node = canvas.querySelector(`[data-id="${CSS.escape(item.id)}"]`);
      if (!node) return;
      node.querySelectorAll(".gaugeNeedleLine").forEach(line => {
        const start = Number(line.dataset.angle || 225);
        const high = Number(item.children?.find(c => c.part === "needle")?.config?.endAngle ?? 495);
        const low = Number(item.children?.find(c => c.part === "needle")?.config?.startAngle ?? 225);
        const frames = [start, high, low, start];
        const segmentMs = 280;
        let segment = 0;
        let segmentStart = performance.now();

        function step(now) {
          const from = frames[segment], to = frames[segment + 1];
          const p = Math.min(1, (now - segmentStart) / segmentMs);
          const eased = p < .5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2) / 2;
          updateNeedleLine(line, from + (to - from) * eased);
          if (p < 1) return requestAnimationFrame(step);
          segment++;
          if (segment < frames.length - 1) {
            segmentStart = now;
            requestAnimationFrame(step);
          }
        }
        requestAnimationFrame(step);
      });
    });
  }

  return {render, renderPart, sweepAssembly};
})();
