# Dashboard runtime regression check

From the repository root, with Node.js and Playwright installed:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/runtime-performance.cjs
```

For an existing compatible Chromium installation, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path.

The test starts a local static server with simulated vehicle data. It verifies
that the runtime uses one approximately 10 Hz data request loop, retains gauge
faces/ticks/needle elements/navigation across live updates, updates the supported
widget types and warning/indicator/shift states, serializes slow requests, and
preserves editor property changes and saved appearance. It does not connect to
an ECU, prove Raspberry Pi frame rate, or alter a real dashboard's saved layout.
