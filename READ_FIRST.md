# READ FIRST

Purpose: This file is the starting point before beginning any new development session.

## Current Priority
1. Audit dashboard.js, style.css, and gauges.css.
2. Build a new development/index.html around the measured Foxbody safe area.
3. Preserve compatibility with existing JavaScript.
4. Prepare for live MicroSquirt ECU data.

## Design References
- Read design/README.md
- Use the measured Foxbody safe area rather than the full LCD dimensions.

## Repository Workflow
- Development work goes into the development/ folder first.
- Stable files are not replaced until tested.

## Related Repository
FoxbodyBCM contains the BCM architecture, hardware, wiring, and subsystem documentation. Review its docs before making integration decisions.

## Goal
Build a polished OEM-style digital dashboard first, then integrate ECU data, then BCM features.