from dataclasses import asdict
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from vehicle_data import vehicle
from microsquirt import microsquirt
from pico_simulator import pico_simulator
from tuning_mode import TuningModeManager


app = Flask(__name__, static_folder=".")
ROOT = Path(__file__).resolve().parent

tuning_mode = TuningModeManager(microsquirt.start, microsquirt.stop)

ASSET_GROUPS = {
    "shapes": ROOT / "assets" / "designer" / "shapes",
    "materials": ROOT / "assets" / "designer" / "materials",
    "images": ROOT / "assets" / "designer" / "images",
    "gaugeParts": ROOT / "assets" / "designer" / "gauge-parts",
    "icons": ROOT / "assets" / "icons" / "dashboard" / "warnings",
    "indicators": ROOT / "assets" / "icons" / "dashboard" / "indicators",
}

SUPPORTED_ASSET_SUFFIXES = {
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp"
}


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/vehicle")
def vehicle_api():
    return jsonify(asdict(vehicle))


def _scan_asset_folder(group_name: str, folder: Path):
    if not folder.exists():
        return []

    assets = []

    for path in sorted(folder.rglob("*")):
        if (
            not path.is_file()
            or path.suffix.lower() not in SUPPORTED_ASSET_SUFFIXES
        ):
            continue

        relative_from_root = path.relative_to(ROOT).as_posix()
        relative_from_group = path.relative_to(folder).as_posix()

        assets.append(
            {
                "id": f"asset:{group_name}:{relative_from_group}",
                "name": path.stem
                    .replace("_", " ")
                    .replace("-", " ")
                    .title(),
                "file": path.name,
                "url": f"/{relative_from_root}",
                "format": path.suffix.lower().lstrip("."),
                "group": group_name,
                "path": relative_from_group,
            }
        )

    return assets


@app.route("/api/assets")
def designer_assets_api():
    return jsonify(
        {
            group_name: _scan_asset_folder(group_name, folder)
            for group_name, folder in ASSET_GROUPS.items()
        }
    )


@app.route("/api/tuning/status")
def tuning_status_api():
    return jsonify(tuning_mode.status())


@app.route("/api/tuning/open", methods=["POST"])
def tuning_open_api():
    state, status_code = tuning_mode.open()
    return jsonify(state), status_code


@app.route("/api/tuning/close", methods=["POST"])
def tuning_close_api():
    state, status_code = tuning_mode.close()
    return jsonify(state), status_code


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)


if __name__ == "__main__":
    microsquirt.start()
    pico_simulator.start()

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True,
        use_reloader=False
    )
