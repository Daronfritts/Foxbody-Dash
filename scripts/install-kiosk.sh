#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run with sudo: sudo bash scripts/install-kiosk.sh" >&2
  exit 1
fi

DASH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASH_USER="${SUDO_USER:-dietpi}"
STATE_DIR="/etc/foxbody-dash"
mkdir -p "$STATE_DIR"

if [[ ! -f "$DASH_DIR/server.py" || ! -f "$DASH_DIR/startup.html" ]]; then
  echo "Expected Foxbody-Dash files not found in $DASH_DIR" >&2
  exit 1
fi

if ! command -v xinit >/dev/null 2>&1; then
  echo "xinit is required. Install it first with: sudo apt install xinit" >&2
  exit 1
fi

if ! command -v chromium >/dev/null 2>&1 && ! command -v chromium-browser >/dev/null 2>&1; then
  echo "Chromium is required." >&2
  exit 1
fi

chmod +x "$DASH_DIR/scripts/kiosk-session.sh" "$DASH_DIR/scripts/foxbody-power.sh"
install -m 0755 "$DASH_DIR/scripts/foxbody-power.sh" /usr/local/bin/foxbody-power

echo "DASH_DIR='$DASH_DIR'" > "$STATE_DIR/install-state.env"
echo "DASH_USER='$DASH_USER'" >> "$STATE_DIR/install-state.env"
echo "PREVIOUS_DEFAULT_TARGET='$(systemctl get-default)'" >> "$STATE_DIR/install-state.env"

cat > /etc/systemd/system/foxbody-dash.service <<EOF
[Unit]
Description=Foxbody Dash Flask Server
After=network.target

[Service]
Type=simple
User=$DASH_USER
WorkingDirectory=$DASH_DIR
ExecStart=/usr/bin/python3 $DASH_DIR/server.py
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/foxbody-kiosk.service <<EOF
[Unit]
Description=Foxbody Dash Kiosk
After=foxbody-dash.service network.target
Requires=foxbody-dash.service
Conflicts=getty@tty1.service

[Service]
Type=simple
User=$DASH_USER
PAMName=login
TTYPath=/dev/tty1
StandardInput=tty-force
StandardOutput=journal
StandardError=journal
Environment=HOME=/home/$DASH_USER
Environment=FOXBODY_DASH_URL=http://127.0.0.1:8000/startup.html
ExecStart=/usr/bin/xinit $DASH_DIR/scripts/kiosk-session.sh -- :0 vt1 -keeptty -nolisten tcp
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl disable --now display-manager.service >/dev/null 2>&1 || true
systemctl disable --now getty@tty1.service >/dev/null 2>&1 || true
systemctl set-default multi-user.target
systemctl enable foxbody-dash.service foxbody-kiosk.service

cat <<EOF

Foxbody kiosk services installed.

IMPORTANT: nothing has rebooted yet.
Before rebooting, test the Flask service:
  sudo systemctl start foxbody-dash.service
  systemctl status foxbody-dash.service --no-pager

Then reboot when ready:
  sudo reboot

After reboot the normal local display path is:
  Pi boot -> X/Chromium kiosk -> startup.html -> custom dashboard

Power commands for BCM/Pico integration:
  sudo foxbody-power key-off       # screen off, Pi stays on
  sudo foxbody-power key-on        # screen on
  sudo foxbody-power battery-low   # clean Pi shutdown

SSH remains available as normal.
EOF
