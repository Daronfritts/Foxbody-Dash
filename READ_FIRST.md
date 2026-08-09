# READ FIRST

Purpose: This file is the starting point before beginning any new FoxbodyDash development session.

## Current Direction
FoxbodyDash is being rebuilt around a full dashboard designer/runtime rather than a hardcoded instrument cluster.

The main page must be treated as a canvas populated by independent configurable elements. Gauges, information boxes, warning/status bars, navigation, text, shapes, images and decorative materials should all use the same drag/resize/layer system.

## Core Rules
1. Do not return to fixed CSS positioning for main-dashboard components.
2. Main-dashboard elements are data-driven objects stored in the designer layout model.
3. Users must be able to add elements one at a time, drag them anywhere, resize/stretch them, rotate them, layer them and remove them.
4. SVG/PNG/JPG/WEBP assets placed under `assets/designer/` must be discoverable without hardcoding each filename.
5. Keep visual geometry separate from vehicle data sources.
6. Keep `assets/vehicle/` unchanged unless the user explicitly asks for vehicle-art changes.
7. Preserve the existing Vehicle page while the dashboard designer is rebuilt.

## Designer Asset Library
- `assets/designer/shapes/`
- `assets/designer/materials/`
- `assets/designer/images/`
- `assets/designer/gauge-parts/`

The Flask `/api/assets` endpoint scans these folders.

## Gauge Builder Direction
A gauge should eventually be composed from independent components instead of one fixed drawing:
- container shape / measurement path
- material or background
- bezel
- tick scale
- labels
- warning regions
- needle or pointer
- hub
- digital value
- title / unit

The gauge container owns the geometry. Gauge components must conform to the container so the same component system can support circular, elliptical, horizontal, vertical, arc and later custom-path gauges.

## Data Direction
Visual elements should bind to named data sources such as:
- `engine.rpm`
- `engine.speed`
- `engine.coolant`
- `engine.oil`
- `engine.fuel`
- `engine.battery`
- `engine.afr`
- `lights.left_turn`
- `doors.driver`

The renderer must not care whether the source ultimately comes from MicroSquirt, the BCM, GPS or another service.

## Development Workflow
Major architecture changes should be developed and tested on a feature branch before replacing the known-working `main` branch.

Current feature branch: `feature/dashboard-designer-engine`

## Immediate Priorities
1. Stabilize drag, resize, layering and property editing.
2. Add custom asset metadata and scaling modes (free stretch, aspect lock, cover/contain/tile, later 9-slice).
3. Build the gauge-container / gauge-component engine.
4. Add full element on/off and conditional-visibility settings.
5. Add saved layouts/pages/presets and import/export.
6. Connect real MicroSquirt data through the existing API boundary.
7. Connect BCM data after the dashboard data registry is stable.

## Related Repository
FoxbodyBCM contains BCM architecture, hardware, wiring and subsystem documentation. Review it before making BCM integration decisions.
