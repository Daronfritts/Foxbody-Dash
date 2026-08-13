# Dashboard Designer Assets

This folder is the user-extensible asset library for the FoxbodyDash designer. Files placed in the supported subfolders are discovered automatically by `server.py` and exposed through `/api/assets`.

## Folders

- `shapes/` — SVG/PNG/JPG/WEBP shapes, panels, frames, bezels, masks and decorative geometry.
- `materials/` — texture images such as carbon fiber, brushed aluminum, vinyl, plastic or custom patterns.
- `images/` — logos, artwork and general-purpose dashboard graphics.
- `gauge-parts/` — reusable needles, hubs, tick designs, warning arcs, bezels and other future gauge-builder components.

SVG is preferred for items that need to scale aggressively. PNG/JPG/WEBP assets are supported and can be freely resized, though raster images may lose clarity when enlarged.

The designer architecture intentionally keeps these folders separate from `assets/vehicle/`. The vehicle artwork is not part of the designer asset library and should remain unchanged.
