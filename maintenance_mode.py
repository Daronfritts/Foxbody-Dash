"""Allowlisted LXQt/Openbox maintenance actions for the local dash UI."""

from __future__ import annotations

import os
import shutil
import subprocess
import threading
import time
from pathlib import Path
from typing import Optional


class MaintenanceModeManager:
    def __init__(self):
        self._terminal: Optional[subprocess.Popen] = None
        self._return_helper: Optional[subprocess.Popen] = None
        self._last_error: Optional[str] = None
        self._lock = threading.RLock()

    @staticmethod
    def _desktop_env() -> dict[str, str]:
        env = os.environ.copy()
        env.setdefault("DISPLAY", os.getenv("FOX_MAINTENANCE_DISPLAY", ":0"))
        xauthority = os.getenv(
            "FOX_MAINTENANCE_XAUTHORITY", "/home/dietpi/.Xauthority"
        )
        if Path(xauthority).exists():
            env.setdefault("XAUTHORITY", xauthority)
        return env

    @staticmethod
    def _tool(name: str) -> Optional[str]:
        return shutil.which(name)

    def status(self) -> dict:
        with self._lock:
            return {
                "wmctrl_available": self._tool("wmctrl") is not None,
                "terminal_available": any(
                    self._tool(name)
                    for name in ("qterminal", "lxterminal", "x-terminal-emulator")
                ),
                "terminal_running": bool(
                    self._terminal and self._terminal.poll() is None
                ),
                "return_helper_available": self._tool("xmessage") is not None,
                "return_helper_running": bool(
                    self._return_helper and self._return_helper.poll() is None
                ),
                "last_error": self._last_error,
            }

    def _wmctrl(self, *args: str) -> bool:
        wmctrl = self._tool("wmctrl")
        if not wmctrl:
            self._last_error = "wmctrl is not installed on the Pi."
            return False
        result = subprocess.run(
            [wmctrl, *args],
            env=self._desktop_env(),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        if result.returncode != 0:
            self._last_error = "The LXQt/Openbox desktop did not accept the command."
            return False
        self._last_error = None
        return True

    def show_desktop(self) -> tuple[dict, int]:
        xmessage = self._tool("xmessage")
        if not xmessage:
            self._last_error = (
                "xmessage is required for the touchscreen return button. "
                "Install the x11-utils package."
            )
            return self.status(), 503

        if not self._wmctrl("-k", "on"):
            return self.status(), 503

        try:
            with self._lock:
                helper = subprocess.Popen(
                    [
                        xmessage,
                        "-center",
                        "-title",
                        "FoxbodyDash Return",
                        "-buttons",
                        "RETURN TO DASH:0",
                        "-default",
                        "RETURN TO DASH",
                        "FOXBODY DESKTOP\n\nTap RETURN TO DASH when finished.",
                    ],
                    env=self._desktop_env(),
                    start_new_session=True,
                )
                self._return_helper = helper
        except Exception as exc:
            self._last_error = str(exc)
            self._wmctrl("-k", "off")
            self._wmctrl("-a", "FoxbodyDash Studio")
            return self.status(), 500

        self._last_error = None
        threading.Thread(
            target=self._watch_return_helper,
            args=(helper,),
            daemon=True,
        ).start()
        threading.Thread(target=self._focus_return_helper, daemon=True).start()
        return self.status(), 200

    def _watch_return_helper(self, helper: subprocess.Popen) -> None:
        helper.wait()
        with self._lock:
            if helper is not self._return_helper:
                return
            self._return_helper = None
        self._restore_dash_window()

    def _focus_return_helper(self) -> None:
        for _ in range(20):
            with self._lock:
                if (
                    not self._return_helper
                    or self._return_helper.poll() is not None
                ):
                    return
            if self._wmctrl("-a", "FoxbodyDash Return"):
                return
            time.sleep(0.2)

    def _restore_dash_window(self) -> bool:
        self._wmctrl("-k", "off")
        return self._wmctrl("-a", "FoxbodyDash Studio")

    def return_to_dash(self) -> tuple[dict, int]:
        with self._lock:
            if self._terminal and self._terminal.poll() is None:
                self._terminal.terminate()
            self._terminal = None

            helper = self._return_helper
            self._return_helper = None
            if helper and helper.poll() is None:
                helper.terminate()

        ok = self._restore_dash_window()
        return self.status(), 200 if ok else 503

    def open_terminal(self) -> tuple[dict, int]:
        terminal = next(
            (
                self._tool(name)
                for name in ("qterminal", "lxterminal", "x-terminal-emulator")
                if self._tool(name)
            ),
            None,
        )
        if not terminal:
            self._last_error = "No supported terminal is installed on the Pi."
            return self.status(), 503

        self._wmctrl("-k", "off")
        try:
            with self._lock:
                if not self._terminal or self._terminal.poll() is not None:
                    self._terminal = subprocess.Popen(
                        [terminal],
                        env=self._desktop_env(),
                        start_new_session=True,
                    )
        except Exception as exc:
            self._last_error = str(exc)
            return self.status(), 500

        self._last_error = None
        # Always raise the terminal, including when it was already running.
        threading.Thread(target=self._focus_terminal, daemon=True).start()
        return self.status(), 200

    def _terminal_window_id(self) -> Optional[str]:
        wmctrl = self._tool("wmctrl")
        if not wmctrl:
            return None
        result = subprocess.run(
            [wmctrl, "-lx"],
            env=self._desktop_env(),
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            return None

        for line in result.stdout.splitlines():
            lowered = line.lower()
            if any(
                marker in lowered
                for marker in ("qterminal", "lxterminal", "shell no.")
            ):
                fields = line.split(None, 1)
                if fields:
                    return fields[0]
        return None

    def _focus_terminal(self) -> None:
        for _ in range(20):
            with self._lock:
                if not self._terminal or self._terminal.poll() is not None:
                    return

            window_id = self._terminal_window_id()
            if window_id:
                self._wmctrl("-i", "-r", window_id, "-b", "remove,hidden")
                if self._wmctrl("-i", "-a", window_id):
                    return

            for title in ("Shell No. 1", "QTerminal", "LXTerminal"):
                if self._wmctrl("-a", title):
                    return
            time.sleep(0.2)
