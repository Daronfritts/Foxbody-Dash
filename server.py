from flask import Flask, jsonify, send_from_directory
from vehicle_data import vehicle
from dataclasses import asdict

app = Flask(__name__, static_folder=".")


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/vehicle")
def vehicle_api():
    return jsonify(asdict(vehicle))


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
