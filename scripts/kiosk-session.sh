#!/usr/bin/env bash
set -euo pipefail

DASH_URL="${FOXBODY_DASH_URL:-http://127.0.0.1:8000/startup.html}"

# Keep X from blanking the display on its own. The BCM/Pico will explicitly
# command screen on/off through foxbody-power.
xset s off || true
xset s noblank || true
xset +dpms || true

# Give Flask a moment to become available before opening Chromium.
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8000/ >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

CHROMIUM=""
for candidate in chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROMIUM="$(command -v "$candidate")"
    break
  fi
done

if [[ -z "$CHROMIUM" ]]; then
  echo "Chromium not found" >&2
  exit 1
fi

exec "$CHROMIUM" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  "$DASH_URL"
