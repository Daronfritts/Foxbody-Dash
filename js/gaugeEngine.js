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
            warningLow: options.warningLow ?? null,
            warningHigh: options.warningHigh ?? null,
            startAngle: options.startAngle ?? 225,
            endAngle: options.endAngle ?? 495,
            radius: options.radius ?? 176,
            size: options.size ?? 430,
            needleLength: options.needleLength ?? null,
            title: options.title ?? label,
            subtitle: options.subtitle ?? "",
            variant: options.variant ?? "main",
            showValue: options.showValue ?? false
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
        const start = this._polarToCartesian(cx, cy, r, startAngle);
        const end = this._polarToCartesian(cx, cy, r, endAngle);
        const sweep = endAngle - startAngle;
        const largeArcFlag = Math.abs(sweep) > 180 ? "1" : "0";
        const sweepFlag = sweep >= 0 ? "1" : "0";
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

    _addGradient(defs, id, stops, attrs = {}) {
        const gradient = this._svg("linearGradient", {
            id,
            x1: attrs.x1 ?? "0%",
            y1: attrs.y1 ?? "0%",
            x2: attrs.x2 ?? "0%",
            y2: attrs.y2 ?? "100%"
        });
        stops.forEach(([offset, color, opacity = 1]) => {
            gradient.appendChild(this._svg("stop", {
                offset,
                "stop-color": color,
                "stop-opacity": opacity
            }));
        });
        defs.appendChild(gradient);
    }

    _build() {
        const size = this.options.size;
        this.cx = size / 2;
        this.cy = size / 2;
        const cx = this.cx;
        const cy = this.cy;
        const r = this.options.radius;
        const mini = this.options.variant === "mini";
        const needleLength = this.options.needleLength ?? (mini ? r - 10 : r - 48);

        const svg = this._svg("svg", {
            viewBox: `0 0 ${size} ${size}`,
            width: "100%",
            height: "100%",
            class: `gaugeSvg gaugeSvg--${this.options.variant}`,
            role: "img",
            "aria-label": this.options.title
        });

        const defs = this._svg("defs");

        this._addGradient(defs, `${this.elementId}-bezel`, [
            ["0%", "#f4f4f4"],
            ["18%", "#8d8d8d"],
            ["42%", "#eeeeee"],
            ["68%", "#626262"],
            ["100%", "#d9d9d9"]
        ], { x1: "0%", y1: "0%", x2: "100%", y2: "100%" });

        const faceGlow = this._svg("radialGradient", { id: `${this.elementId}-face` });
        [
            ["0%", "#171717", 1],
            ["58%", "#090909", 1],
            ["100%", "#020202", 1]
        ].forEach(([offset, color, opacity]) => {
            faceGlow.appendChild(this._svg("stop", {
                offset,
                "stop-color": color,
                "stop-opacity": opacity
            }));
        });
        defs.appendChild(faceGlow);

        const needleGradient = this._svg("linearGradient", {
            id: `${this.elementId}-needle`,
            x1: "0%", y1: "0%", x2: "100%", y2: "0%"
        });
        [
            ["0%", "#8d0000"],
            ["40%", "#ff2c2c"],
            ["72%", "#ff6666"],
            ["100%", "#f3f3f3"]
        ].forEach(([offset, color]) => {
            needleGradient.appendChild(this._svg("stop", {
                offset,
                "stop-color": color
            }));
        });
        defs.appendChild(needleGradient);

        const shadow = this._svg("filter", {
            id: `${this.elementId}-shadow`,
            x: "-50%", y: "-50%", width: "200%", height: "200%"
        });
        shadow.appendChild(this._svg("feDropShadow", {
            dx: "0", dy: mini ? "1.5" : "3",
            stdDeviation: mini ? "2" : "4",
            "flood-color": "#000000",
            "flood-opacity": ".8"
        }));
        defs.appendChild(shadow);

        svg.appendChild(defs);

        svg.appendChild(this._svg("circle", {
            cx, cy, r: r + (mini ? 10 : 23),
            class: "gaugeBezelOuter",
            fill: `url(#${this.elementId}-bezel)`
        }));
        svg.appendChild(this._svg("circle", {
            cx, cy, r: r + (mini ? 6 : 17),
            class: "gaugeBezelDark"
        }));
        svg.appendChild(this._svg("circle", {
            cx, cy, r: r + (mini ? 3 : 11),
            class: "gaugeBezelHighlight"
        }));
        svg.appendChild(this._svg("circle", {
            cx, cy, r,
            class: "gaugeFace",
            fill: `url(#${this.elementId}-face)`
        }));

        svg.appendChild(this._svg("circle", {
            cx, cy, r: r - (mini ? 4 : 7),
            class: "gaugeInnerRing"
        }));

        if (this.options.warningLow !== null && this.options.warningLow > this.min) {
            const lowEnd = this._valueToAngle(this.options.warningLow);
            svg.appendChild(this._svg("path", {
                d: this._describeArc(cx, cy, r - (mini ? 8 : 12), this.options.startAngle, lowEnd),
                class: "gaugeWarningLow"
            }));
        }

        const highStartValue = this.options.redlineStart ?? this.options.warningHigh;
        if (highStartValue !== null && highStartValue < this.max) {
            const highStart = this._valueToAngle(highStartValue);
            svg.appendChild(this._svg("path", {
                d: this._describeArc(cx, cy, r - (mini ? 8 : 12), highStart, this.options.endAngle),
                class: "gaugeWarningHigh"
            }));
        }

        const tickGroup = this._svg("g", { class: "gaugeTicks" });
        const majorCount = this.options.majorTicks;
        const minorCount = this.options.minorTicks;
        const minorStep = (this.max - this.min) / minorCount;
        const ticksPerMajor = minorCount / majorCount;

        for (let i = 0; i <= minorCount; i++) {
            const value = this.min + (i * minorStep);
            const angle = this._valueToAngle(value);
            const majorTick = Math.abs((i / ticksPerMajor) - Math.round(i / ticksPerMajor)) < 0.0001;

            const outerRadius = r - (mini ? 7 : 10);
            const innerLength = majorTick ? (mini ? 10 : 21) : (mini ? 5 : 11);
            const outer = this._polarToCartesian(cx, cy, outerRadius, angle);
            const inner = this._polarToCartesian(cx, cy, outerRadius - innerLength, angle);

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
            const p = this._polarToCartesian(
                cx,
                cy,
                r - (mini ? 21 : 48),
                angle
            );

            const label = this.options.labels && this.options.labels[i] !== undefined
                ? this.options.labels[i]
                : Math.round(value).toString();

            if (label === "") continue;

            const text = this._svg("text", {
                x: p.x,
                y: p.y,
                class: "gaugeLabel"
            });
            text.textContent = label;
            labelGroup.appendChild(text);
        }
        svg.appendChild(labelGroup);

        const titleY = mini ? cy + 27 : cy - 56;
        const unitY = mini ? cy + 41 : cy - 32;

        this.titleText = this._svg("text", {
            x: cx,
            y: titleY,
            class: "gaugeCenterTitle"
        });
        this.titleText.textContent = this.options.title;
        svg.appendChild(this.titleText);

        if (this.options.subtitle) {
            const subtitle = this._svg("text", {
                x: cx,
                y: unitY,
                class: "gaugeCenterSubtitle"
            });
            subtitle.textContent = this.options.subtitle;
            svg.appendChild(subtitle);
        }

        this.needle = this._svg("g", {
            class: "gaugeNeedleGroup",
            filter: `url(#${this.elementId}-shadow)`
        });

        const tailLength = mini ? 10 : 25;
        this.needleTail = this._svg("line", {
            x1: cx,
            y1: cy,
            x2: cx,
            y2: cy + tailLength,
            class: "gaugeNeedleTail"
        });
        this.needle.appendChild(this.needleTail);

        this.needleLine = this._svg("line", {
            x1: cx,
            y1: cy,
            x2: cx,
            y2: cy - needleLength,
            class: "gaugeNeedle",
            stroke: `url(#${this.elementId}-needle)`
        });
        this.needle.appendChild(this.needleLine);

        this.needle.appendChild(this._svg("circle", {
            cx, cy,
            r: mini ? 8 : 18,
            class: "gaugeHub"
        }));
        this.needle.appendChild(this._svg("circle", {
            cx, cy,
            r: mini ? 5 : 12,
            class: "gaugeHubInner"
        }));
        this.needle.appendChild(this._svg("circle", {
            cx: cx - (mini ? 1 : 2),
            cy: cy - (mini ? 1 : 2),
            r: mini ? 1.5 : 3.5,
            class: "gaugeHubHighlight"
        }));
        svg.appendChild(this.needle);

        if (this.options.showValue) {
            this.valueText = this._svg("text", {
                x: cx,
                y: mini ? cy + 55 : cy + 62,
                class: "gaugeCenterValue"
            });
            svg.appendChild(this.valueText);
        }

        this.element.appendChild(svg);
        this.svg = svg;
    }

    _formatValue(value) {
        if (this.options.unit === "V") return Number(value).toFixed(1);
        if (this.options.unit === "%") return `${Math.round(value)}`;
        return `${Math.round(value)}`;
    }

    setValue(value, immediate = false) {
        this.value = value;
        const angle = this._valueToAngle(value);
        this.needle.setAttribute("transform", `rotate(${angle} ${this.cx} ${this.cy})`);

        if (this.valueText) {
            const formatted = this._formatValue(value);
            this.valueText.textContent = this.options.unit
                ? `${formatted} ${this.options.unit}`
                : formatted;
        }

        if (!immediate) {
            this.svg.classList.add("gaugePulse");
            window.setTimeout(() => this.svg.classList.remove("gaugePulse"), 140);
        }
    }

    sweep() {
        const span = this.max - this.min;
        const returnValue = this.value;
        this.setValue(this.min, true);
        window.setTimeout(() => this.setValue(this.max), 80);
        window.setTimeout(() => this.setValue(this.min + span * 0.18), 420);
        window.setTimeout(() => this.setValue(returnValue, true), 700);
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
            warningLow: options.warningLow ?? null,
            warningHigh: options.warningHigh ?? null,
            startAngle: options.startAngle ?? 225,
            endAngle: options.endAngle ?? 495,
            radius: options.radius ?? 48,
            size: options.size ?? 120,
            needleLength: options.needleLength ?? 36,
            title: label,
            subtitle: options.subtitle ?? unit,
            variant: "mini",
            showValue: options.showValue ?? false
        });
    }

    setValue(value) {
        this.gauge.setValue(value);
    }

    sweep() {
        this.gauge.sweep();
    }
}
