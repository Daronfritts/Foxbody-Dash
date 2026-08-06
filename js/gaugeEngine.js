class Gauge {
    constructor(elementId, min, max, value, label, options = {}) {
        this.elementId = elementId;
        this.min = min;
        this.max = max;
        this.value = value;
        this.label = label;
        this.options = {
            majorTicks: options.majorTicks ?? 8,
            minorTicks: options.minorTicks ?? 40,
            labels: options.labels ?? null,
            unit: options.unit ?? "",
            redlineStart: options.redlineStart ?? null,
            // Use a conventional left-to-right analog sweep.
            // This is later overridden per-gauge where needed.
            startAngle: options.startAngle ?? 225,
            endAngle: options.endAngle ?? -45,
            radius: options.radius ?? 180,
            size: options.size ?? 430,
            needleLength: options.needleLength ?? null,
            title: options.title ?? label,
            needleColor: options.needleColor ?? "#ff4a4a",
            accentColor: options.accentColor ?? "#4cc3ff"
        };

        this.element = document.getElementById(elementId);
        if (!this.element) {
            throw new Error(`Gauge element not found: ${elementId}`);
        }

        this.element.innerHTML = "";
        this._build();
        this.setValue(value, true);
    }

    _svg(tag, attrs = {}) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
        return el;
    }

    _polarToCartesian(cx, cy, r, angleDeg) {
        const angleRad = (angleDeg - 90) * Math.PI / 180.0;
        return {
            x: cx + (r * Math.cos(angleRad)),
            y: cy + (r * Math.sin(angleRad))
        };
    }

    _describeArc(cx, cy, r, startAngle, endAngle) {
        const start = this._polarToCartesian(cx, cy, r, endAngle);
        const end = this._polarToCartesian(cx, cy, r, startAngle);
        const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
        const sweepFlag = endAngle > startAngle ? "1" : "0";
        return [
            "M", start.x, start.y,
            "A", r, r, 0, largeArcFlag, sweepFlag, end.x, end.y
        ].join(" ");
    }

    _valueToAngle(value) {
        const range = this.max - this.min;
        const clamped = Math.max(this.min, Math.min(this.max, value));
        const pct = (clamped - this.min) / range;
        return this.options.startAngle + ((this.options.endAngle - this.options.startAngle) * pct);
    }

    _build() {
        const size = this.options.size;
        const cx = size / 2;
        const cy = size / 2;
        const r = this.options.radius;
        const needleLength = this.options.needleLength ?? (r - 34);

        const svg = this._svg("svg", {
            viewBox: `0 0 ${size} ${size}`,
            width: size,
            height: size,
            class: "gaugeSvg"
        });

        const defs = this._svg("defs");
        const glow = this._svg("filter", { id: `${this.elementId}-glow`, x: "-50%", y: "-50%", width: "200%", height: "200%" });
        glow.appendChild(this._svg("feGaussianBlur", { stdDeviation: "3", result: "coloredBlur" }));
        const glowMerge = this._svg("feMerge");
        glowMerge.appendChild(this._svg("feMergeNode", { in: "coloredBlur" }));
        glowMerge.appendChild(this._svg("feMergeNode", { in: "SourceGraphic" }));
        glow.appendChild(glowMerge);
        defs.appendChild(glow);
        svg.appendChild(defs);

        svg.appendChild(this._svg("circle", {
            cx, cy, r: r + 18,
            class: "gaugeOuterRing"
        }));

        svg.appendChild(this._svg("circle", {
            cx, cy, r: r,
            class: "gaugeFace"
        }));

        this.arcTrack = this._svg("path", {
            d: this._describeArc(cx, cy, r - 7, this.options.startAngle, this.options.endAngle),
            class: "gaugeTrack"
        });
        svg.appendChild(this.arcTrack);

        if (this.options.redlineStart !== null) {
            const redStartAngle = this._valueToAngle(this.options.redlineStart);
            const redArc = this._svg("path", {
                d: this._describeArc(cx, cy, r - 7, redStartAngle, this.options.endAngle),
                class: "gaugeRedline"
            });
            svg.appendChild(redArc);
        }

        const tickGroup = this._svg("g", { class: "gaugeTicks" });
        const majorCount = this.options.majorTicks;
        const minorCount = this.options.minorTicks;
        const minorStep = (this.max - this.min) / minorCount;
        const ticksPerMajor = minorCount / majorCount;

        for (let i = 0; i <= minorCount; i++) {
            const value = this.min + (i * minorStep);
            const angle = this._valueToAngle(value);
            const outer = this._polarToCartesian(cx, cy, r - 4, angle);
            const majorTick = i % ticksPerMajor === 0;
            const innerLength = majorTick ? 18 : 10;
            const inner = this._polarToCartesian(cx, cy, r - innerLength, angle);
            tickGroup.appendChild(this._svg("line", {
                x1: inner.x, y1: inner.y,
                x2: outer.x, y2: outer.y,
                class: majorTick ? "gaugeMajorTick" : "gaugeMinorTick"
            }));
        }
        svg.appendChild(tickGroup);

        const labelGroup = this._svg("g", { class: "gaugeLabels" });
        const majorStep = (this.max - this.min) / majorCount;
        for (let i = 0; i <= majorCount; i++) {
            const value = this.min + (i * majorStep);
            const angle = this._valueToAngle(value);
            const p = this._polarToCartesian(cx, cy, r - 52, angle);
            const label = this.options.labels && this.options.labels[i] !== undefined && this.options.labels[i] !== ""
                ? this.options.labels[i]
                : Math.round(value).toString();
            const text = this._svg("text", {
                x: p.x,
                y: p.y,
                class: "gaugeLabel"
            });
            text.textContent = label;
            labelGroup.appendChild(text);
        }
        svg.appendChild(labelGroup);

        this.needle = this._svg("g", { class: "gaugeNeedleGroup" });
        this.needleLine = this._svg("line", {
            x1: cx,
            y1: cy,
            x2: cx,
            y2: cy - needleLength,
            class: "gaugeNeedle"
        });
        this.needle.appendChild(this.needleLine);
        this.needleHub = this._svg("circle", {
            cx,
            cy,
            r: 16,
            class: "gaugeHub"
        });
        this.needle.appendChild(this.needleHub);
        this.needleGlow = this._svg("circle", {
            cx,
            cy,
            r: 8,
            class: "gaugeHubInner"
        });
        this.needle.appendChild(this.needleGlow);
        svg.appendChild(this.needle);

        this.titleText = this._svg("text", {
            x: cx,
            y: cy + 18,
            class: "gaugeCenterTitle"
        });
        this.titleText.textContent = this.options.title;
        svg.appendChild(this.titleText);

        this.valueText = this._svg("text", {
            x: cx,
            y: cy + 48,
            class: "gaugeCenterValue"
        });
        this.valueText.textContent = `${Math.round(this.value)}${this.options.unit}`;
        svg.appendChild(this.valueText);

        this.element.appendChild(svg);
        this.svg = svg;
    }

    setValue(value, immediate = false) {
        this.value = value;
        const angle = this._valueToAngle(value);
        this.needle.setAttribute("transform", `rotate(${angle} 215 215)`);
        this.valueText.textContent = `${Math.round(value)}${this.options.unit}`;
        if (!immediate) {
            this.svg.classList.add("gaugePulse");
            window.setTimeout(() => this.svg.classList.remove("gaugePulse"), 180);
        }
    }

    sweep() {
        const span = this.max - this.min;
        this.setValue(this.min, true);
        window.requestAnimationFrame(() => this.setValue(this.min + span * 0.45));
        window.setTimeout(() => this.setValue(this.min + span * 0.78), 120);
        window.setTimeout(() => this.setValue(this.min), 260);
    }
}

class MiniGauge {
    constructor(elementId, label, value, unit, options = {}) {
        this.gauge = new Gauge(elementId, options.min ?? 0, options.max ?? 100, value, label, {
            majorTicks: options.majorTicks ?? 4,
            minorTicks: options.minorTicks ?? 20,
            labels: options.labels ?? null,
            unit,
            redlineStart: options.redlineStart ?? null,
            startAngle: options.startAngle ?? 220,
            endAngle: options.endAngle ?? -40,
            radius: options.radius ?? 46,
            size: options.size ?? 120,
            needleLength: options.needleLength ?? 44,
            title: label,
            needleColor: options.needleColor ?? "#ff4a4a",
            accentColor: options.accentColor ?? "#4cc3ff"
        });
    }

    setValue(value) {
        this.gauge.setValue(value);
    }

    sweep() {
        this.gauge.sweep();
    }
}