# READ FIRST

FoxbodyDash dashboard development is now a clean-sheet project.

## Authoritative Main-Dashboard Files
The main page must be built only from the new studio/runtime stack:

- `index.html`
- `css/app.css`
- `js/app/catalog.js`
- `js/app/gaugeRenderer.js`
- `js/app/main.js`
- `server.py`

Legacy fixed-dashboard/layout files are not authoritative and must not be reintroduced into `index.html`.

## Core Direction
The main screen is a 1024×600 canvas populated by independent configurable objects. Nothing visible on the main dashboard should require a permanently hardcoded position.

Every main-screen object must be capable of becoming part of the same designer system: gauges, gauge parts, info boxes, warning/status strips, nav bars, text, shapes, imported images, icons, decorative panels and materials.

## Required Object Capabilities
- add one item at a time
- drag anywhere on the canvas
- resize freely
- optional aspect-ratio lock
- rotate
- opacity
- layer front/back
- duplicate/delete
- visible on/off
- material/texture assignment
- stretch / contain / cover / tile scaling for imported assets
- data-source binding where applicable

## Asset Library
Automatic asset discovery is provided by `/api/assets`.

Designer upload/drop-in folders:
- `assets/designer/shapes/`
- `assets/designer/materials/`
- `assets/designer/images/`
- `assets/designer/gauge-parts/`

Existing dashboard icons under `assets/icons/dashboard/` are also exposed to the designer as configurable icon assets.

The Mustang shift-light art remains reusable through `assets/images/mustangWhite.svg` and is not tied to a fixed screen location.

## Gauge Architecture
Do not treat a gauge as one permanent drawing.

A gauge is built from configurable parts:
- shape/container
- bezel/background/material
- tick scale
- numbers/labels
- warning region
- needle/pointer
- hub
- title/unit
- digital value

The container owns geometry. Components should eventually conform to circular, elliptical, rectangular, horizontal, vertical, arc and custom SVG measurement paths.

## Data Architecture
Visuals bind to named data sources such as:
- `engine.rpm`
- `engine.speed`
- `engine.coolant`
- `engine.oil`
- `engine.fuel`
- `engine.battery`
- `engine.afr`
- `engine.map`
- `engine.fuelPressure`
- `lights.left_turn`
- `lights.right_turn`
- `lights.high_beams`
- `doors.driver`
- `doors.passenger`
- `doors.hatch`

The visual engine must not care whether a value ultimately comes from MicroSquirt, BCM, GPS or another service.

## VEHICLE PAGE — PRESERVE
Do not modify these as part of the dashboard rewrite unless the user explicitly asks:
- `pages/vehicle.html`
- `css/vehicle.css`
- `js/vehicle.js`
- `assets/vehicle/`

The Vehicle page remains a separate preserved subsystem.

## Current Branch
`feature/dashboard-designer-engine`

Keep this work isolated from `main` until it is tested on the Raspberry Pi touchscreen.

## Next Priorities
1. Validate clean-sheet editor boot/edit/drag/resize on the Pi.
2. Add richer per-widget property editors.
3. Add true gauge-container geometry and component parenting/groups.
4. Add layers panel and grouping.
5. Add conditional visibility and warning behaviors.
6. Add layout pages/presets plus JSON import/export.
7. Add 9-slice/stretch metadata for custom SVG/PNG assets.
8. Connect real MicroSquirt and BCM data after the visual/data registry stabilizes.
