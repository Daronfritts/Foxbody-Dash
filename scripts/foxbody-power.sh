#!/usr/bin/env bash
set -euo pipefail

DASH_USER="${FOXBODY_DASH_USER:-dietpi}"
DISPLAY_ID="${FOXBODY_DISPLAY:-:0}"
XAUTH="/home/${DASH_USER}/.Xauthority"

as_dash_user() {
  sudo -u "$DASH_USER" env DISPLAY="$DISPLAY_ID" XAUTHORITY="$XAUTH" "$@"
}

screen_off() {
  logger -t foxbody-power "KEY OFF / screen off"
  as_dash_user xset dpms force off || true
  if command -v vcgencmd >/dev/null 2>&1; then
    vcgencmd display_power 0 >/dev/null 2>&1 || true
  fi
}

screen_on() {
  logger -t foxbody-power "KEY ON / screen on"
  if command -v vcgencmd >/dev/null 2>&1; then
    vcgencmd display_power 1 >/dev/null 2>&1 || true
  fi
  as_dash_user xset dpms force on || true
}

battery_low() {
  logger -t foxbody-power "BATTERY LOW / graceful Pi shutdown requested"
  sync
  systemctl poweroff
}

case "${1:-}" in
  key-off|screen-off)
    screen_off
    ;;
  key-on|screen-on|wake)
    screen_on
    ;;
  battery-low|shutdown)
    battery_low
    ;;
  status)
    systemctl --no-pager --full status foxbody-dash.service foxbody-kiosk.service || true
    ;;
  *)
    echo "Usage: $0 {key-off|screen-off|key-on|screen-on|wake|battery-low|shutdown|status}" >&2
    exit 2
    ;;
esac
