"""TunerStudio window/serial handoff for FoxbodyDash.

The manager never accepts a command from an HTTP request.  The executable and
window settings come only from environment variables or known installation
paths, which keeps the local API from becoming an arbitrary command runner.
"""

from __future__ import annotations

import os
import shlex
import shutil
import subprocess
import threading
import time
from pathlib import Path
from typing import Callable, Optional


class TuningModeManager:
    DEFAULT_COMMANDS = (
        "/opt/TunerStudioMS/TunerStudio.sh",
        "/home/dietpi/TunerStudioMS/TunerStudio.sh",
        "/home/dietpi/TunerStudio/TunerStudio.sh",
    )

    def __init__(self, ecu_start: Callable[[], None], ecu_stop: Callable[..., None]):
        self._ecu_start = ecu_start
        self._ecu_stop = ecu_stop
        self._lock = threading.RLock()
        self._process: Optional[subprocess.Popen] = None
        self._active = False
        self._last_error: Optional[str] = None
        self._simulation = os.getenv("FOX_TUNING_SIMULATE", "0") == "1"

    def _command(self) -> Optional[list[str]]:
        configured = os.getenv("FOX_TUNERSTUDIO_COMMAND", "").strip()
        if configured:
            parts = shlex.split(configured)
            executable = shutil.which(parts[0]) or (
                parts[0] if Path(parts[0]).is_file() else None
            )
            if executable:
                parts[0] = executable
                return parts
            return None

        for candidate in self.DEFAULT_COMMANDS:
            if Path(candidate).is_file():
                return [candidate]
        return None

    def _desktop_env(self) -> dict[str, str]:
        env = os.environ.copy()
        env.setdefault("DISPLAY", os.getenv("FOX_TUNING_DISPLAY", ":0"))
        xauthority = os.getenv(
            "FOX_TUNING_XAUTHORITY", "/home/dietpi/.Xauthority"
        )
        if Path(xauthority).exists():
            env.setdefault("XAUTHORITY", xauthority)
        return env

    def _focus_tunerstudio(self) -> None:
        wmctrl = shutil.which("wmctrl")
        if not wmctrl:
            return
        env = self._desktop_env()
        for _ in range(30):
            with self._lock:
                if not self._active:
                    return
            result = subprocess.run(
                [wmctrl, "-a", "TunerStudio"],
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
            if result.returncode == 0:
                return
            time.sleep(0.25)

    def _watch_process(self, process: subprocess.Popen) -> None:
        process.wait()
        with self._lock:
            if process is not self._process:
                return
            self._process = None
            was_active = self._active
            self._active = False
        if was_active:
            self._ecu_start()

    def status(self) -> dict:
        command = self._command()
        with self._lock:
            # The watcher owns process-exit cleanup and ECU reconnection.  Do
            # not clear state here or a status poll could race that cleanup.
            running = bool(self._process and self._process.poll() is None)
            return {
                "active": self._active,
                "running": running,
                "available": self._simulation or command is not None,
                "simulation": self._simulation,
                "last_error": self._last_error,
            }

    def open(self) -> tuple[dict, int]:
        with self._lock:
            if self._active:
                threading.Thread(
                    target=self._focus_tunerstudio, daemon=True
                ).start()
                return self.status(), 200

            command = self._command()
            if not self._simulation and not command:
                self._last_error = (
                    "TunerStudio was not found. Set FOX_TUNERSTUDIO_COMMAND "
                    "to its launcher path on the Pi."
                )
                return self.status(), 503

            # Release /dev/ttyUSB0 before TunerStudio tries to connect.
            self._ecu_stop(wait=True)
            self._last_error = None

            if self._simulation:
                self._active = True
                return self.status(), 200

            try:
                process = subprocess.Popen(
                    command,
                    cwd=str(Path(command[0]).resolve().parent),
                    env=self._desktop_env(),
                    start_new_session=True,
                )
            except Exception as exc:
                self._last_error = str(exc)
                self._ecu_start()
                return self.status(), 500

            self._process = process
            self._active = True
            threading.Thread(
                target=self._watch_process,
                args=(process,),
                name="tunerstudio-watcher",
                daemon=True,
            ).start()
            threading.Thread(
                target=self._focus_tunerstudio,
                name="tunerstudio-focus",
                daemon=True,
            ).start()
            return self.status(), 200

    def close(self) -> tuple[dict, int]:
        with self._lock:
            if not self._active:
                self._ecu_start()
                return self.status(), 200

            if self._simulation:
                self._active = False
                self._ecu_start()
                return self.status(), 200

            process = self._process
            if process and process.poll() is None:
                # SIGTERM gives TunerStudio a chance to close normally.  We do
                # not force-kill it because that could discard an unsaved tune.
                process.terminate()
                return {
                    **self.status(),
                    "message": (
                        "Closing TunerStudio. FoxbodyDash reconnects when "
                        "TunerStudio has fully released the serial port."
                    ),
                }, 202

            self._process = None
            self._active = False
            self._ecu_start()
            return self.status(), 200
