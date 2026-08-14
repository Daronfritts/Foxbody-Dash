#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run with sudo: sudo bash scripts/uninstall-kiosk.sh" >&2
  exit 1
fi

STATE_FILE="/etc/foxbody-dash/install-state.env"
PREVIOUS_DEFAULT_TARGET="graphical.target"
if [[ -f "$STATE_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$STATE_FILE"
fi

systemctl disable --now foxbody-kiosk.service foxbody-dash.service >/dev/null 2>&1 || true
rm -f /etc/systemd/system/foxbody-kiosk.service /etc/systemd/system/foxbody-dash.service
rm -f /usr/local/bin/foxbody-power
systemctl daemon-reload
systemctl set-default "${PREVIOUS_DEFAULT_TARGET:-graphical.target}"
systemctl enable getty@tty1.service >/dev/null 2>&1 || true
systemctl enable display-manager.service >/dev/null 2>&1 || true

echo "Foxbody kiosk services removed. Reboot to return to the previous desktop boot path."
