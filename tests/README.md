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
that the runtime uses one approximately 20 Hz data request loop, retains gauge
faces/ticks/needle elements/navigation across live updates, updates the supported
widget types and warning/indicator/shift states, serializes slow requests, and
preserves editor property changes and saved appearance. It does not connect to
an ECU, prove Raspberry Pi frame rate, or alter a real dashboard's saved layout.

The renderer check also uses a controlled clock to exercise falling RPM through
150 ms sample gaps, duplicate readings, direction reversals, and steady RPM.
Motion stays bounded by the latest measured target; it does not predict future
engine speed.

Run the serial-reader timing checks without hardware:

```sh
python -m unittest discover -s tests -p 'test_reader_cadence.py'
```
