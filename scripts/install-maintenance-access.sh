#!/bin/sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DESKTOP_DIR="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
mkdir -p "$DESKTOP_DIR"

LAUNCHER="$DESKTOP_DIR/FoxbodyDash.desktop"

sed "s|__PROJECT_DIR__|$PROJECT_DIR|g" > "$LAUNCHER" <<'EOF'
[Desktop Entry]
Type=Application
Name=Return to FoxbodyDash
Comment=Restore the FoxbodyDash Chromium kiosk
Icon=utilities-system-monitor
Terminal=false
Exec=sh -c 'wmctrl -k off; wmctrl -a "FoxbodyDash Studio"'
Path=__PROJECT_DIR__
Categories=Utility;
EOF

chmod +x "$LAUNCHER"

if ! command -v wmctrl >/dev/null 2>&1; then
    echo "wmctrl is missing. Install it with: sudo apt install wmctrl"
fi

if ! command -v qterminal >/dev/null 2>&1 &&
   ! command -v lxterminal >/dev/null 2>&1 &&
   ! command -v x-terminal-emulator >/dev/null 2>&1; then
    echo "No terminal application was found. Install qterminal."
fi

echo "Installed: $LAUNCHER"
