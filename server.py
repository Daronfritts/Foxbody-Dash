from dataclasses import asdict
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from vehicle_data import vehicle

app = Flask(__name__, static_folder=".")
ROOT = Path(__file__).resolve().parent

ASSET_GROUPS = {
    "shapes": ROOT / "assets" / "designer" / "shapes",
    "materials": ROOT / "assets" / "designer" / "materials",
    "images": ROOT / "assets" / "designer" / "images",
    "gaugeParts": ROOT / "assets" / "designer" / "gauge-parts",
}
SUPPORTED_ASSET_SUFFIXES = {".svg", ".png", ".jpg", ".jpeg", ".webp"}


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
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_ASSET_SUFFIXES:
            continue

        relative = path.relative_to(ROOT).as_posix()
        assets.append(
            {
                "id": f"custom:{group_name}:{path.relative_to(folder).as_posix()}",
                "name": path.stem.replace("_", " ").replace("-", " ").title(),
                "file": path.name,
                "url": f"/{relative}",
                "format": path.suffix.lower().lstrip("."),
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


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
