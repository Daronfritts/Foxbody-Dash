# Dashboard Designer Architecture

## Goal

FoxbodyDash is moving from a single hardcoded dashboard to a dashboard-designer/runtime system. The finished system should allow a blank canvas to be assembled from independent, reusable and data-aware objects.

## Core Object Model

Every canvas element uses the same base transform properties:

- id
- type
- name
- x / y position
- width / height
- rotation
- opacity
- visible
- z layer
- aspect-ratio lock
- material
- optional data source
- optional element-specific configuration

This lets gauges, images, shapes, information panels, warning bars and navigation all use the same editor mechanics.

## Asset Library

`server.py` exposes `/api/assets`, which automatically scans:

- `assets/designer/shapes/`
- `assets/designer/materials/`
- `assets/designer/images/`
- `assets/designer/gauge-parts/`

Supported asset formats are SVG, PNG, JPG, JPEG and WEBP.

New files should become available without adding their filenames to JavaScript.

## Scaling Modes

The planned asset model supports these scaling modes:

- free stretch
- preserve aspect ratio
- contain
- cover
- tile for materials
- 9-slice/protected-edge scaling for frames and bezels

SVG is preferred for geometry because it can scale without raster degradation.

## Gauge Container Model

The current first-pass designer still renders the existing circular `Gauge` class. The next major engine replaces that assumption with gauge containers.

A gauge container defines the geometry and measurement path. Gauge components are attached to that container and map values from 0.0 to 1.0 along the container's measurement path.

Planned container types:

- radial circle
- radial ellipse
- arc
- horizontal linear
- vertical linear
- custom SVG path

## Gauge Components

Planned independent components:

- background / face
- bezel
- material / texture
- major ticks
- minor ticks
- number labels
- warning zones
- needle / pointer
- hub
- digital value
- title
- unit
- icon
- glow/highlight layer

The same tick component should be reusable on different container geometries. For example, a tick scale bound to a circular container follows an arc, while the same tick definition bound to a horizontal container distributes itself across the line.

## Custom Asset Metadata

Custom assets may later use an optional sidecar metadata file with the same base name.

Example:

`custom_bezel.svg`
`custom_bezel.json`

Metadata can define behavior such as:

- asset role
- stretch mode
- protected edges / 9-slice values
- pivot point
- gauge measurement path
- default material behavior
- tint support
- anchor points

Assets without metadata should remain usable with safe default behavior.

## Data Registry

Widgets bind to symbolic data paths rather than directly to ECU code.

Examples:

- `engine.rpm`
- `engine.speed`
- `engine.coolant`
- `engine.oil`
- `engine.fuel`
- `engine.battery`
- `engine.afr`
- `engine.map`
- `lights.left_turn`
- `lights.high_beams`
- `doors.driver`

This keeps the visual system independent from MicroSquirt, BCM, GPS or other future providers.

## Planned Conditional Behavior

Elements should eventually support rules such as:

- show/hide when a boolean data source changes
- show only while engine is running
- show only during warnings
- change material/color at thresholds
- flash or glow at thresholds
- move to front during a warning
- temporarily enlarge during a warning
- hide navigation while driving

## Pages and Presets

The same renderer should eventually support multiple saved pages and presets rather than separate hand-coded HTML dashboards.

Possible presets:

- OEM
- Race
- Cruise
- Diagnostics
- Custom

Layouts should be exportable/importable as JSON.

## Vehicle Area

`assets/vehicle/` is explicitly outside this rewrite and should remain unchanged unless a future task specifically targets vehicle artwork.
