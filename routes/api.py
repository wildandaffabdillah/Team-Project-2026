from flask import Blueprint, Response, current_app, jsonify, request, session, stream_with_context
import json
import requests
from pathlib import Path

from services.database import (
    export_report_csv,
    fetch_recent_logs,
    fetch_summary,
    insert_violation,
    now_iso,
)
from services.detector import PPEDetector

api_bp = Blueprint("api", __name__)

SETTINGS_FILE = Path("instance/settings.json")

def load_settings():
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"camera_type": "webcam", "camera_id": "", "camera_url": ""}

def save_settings(data):
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f)

@api_bp.route("/settings", methods=["GET"])
def get_settings():
    return jsonify(load_settings())

@api_bp.route("/settings", methods=["POST"])
def post_settings():
    if session.get("role") != "superadmin":
        return jsonify({"error": "Access Denied. Only Superadmin can modify camera settings."}), 403
    
    payload = request.get_json(silent=True) or {}
    current = load_settings()
    
    if "camera_type" in payload: current["camera_type"] = payload["camera_type"]
    if "camera_id" in payload: current["camera_id"] = payload["camera_id"]
    if "camera_url" in payload: current["camera_url"] = payload["camera_url"]
    
    save_settings(current)
    return jsonify({"status": "success", "settings": current})


def get_detector() -> PPEDetector:
    return PPEDetector(
        api_key=current_app.config["ROBOFLOW_API_KEY"],
        model_id=current_app.config["ROBOFLOW_MODEL_ID"],
        required_ppe=current_app.config["REQUIRED_PPE"],
    )


@api_bp.route("/analyze", methods=["POST"])
def analyze_frame():
    payload = request.get_json(silent=True) or {}
    frame = payload.get("frame")

    if not frame:
        return jsonify({"error": "Webcam frame not found."}), 400

    detector = get_detector()
    result = detector.analyze(frame)

    log_payload = {
        "created_at": now_iso(),
        "worker_detected": result.worker_detected,
        "helmet": result.helmet,
        "vest": result.vest,
        "shoes": result.shoes,
        "compliant": result.compliant,
        "violation_text": result.violation_text,
        "confidence": result.confidence,
        "mode": result.mode,
    }

    record_id = None
    if result.worker_detected:
        record_id = insert_violation(current_app.config["DATABASE"], log_payload)

    return jsonify(
        {
            "id": record_id,
            "status": "success",
            "result": {
                "worker_detected": result.worker_detected,
                "helmet": result.helmet,
                "vest": result.vest,
                "shoes": result.shoes,
                "gloves": result.gloves,
                "goggles": result.goggles,
                "compliant": result.compliant,
                "confidence": result.confidence,
                "violation_text": result.violation_text,
                "mode": result.mode,
                "boxes": result.boxes,
            },
        }
    )


@api_bp.route("/summary", methods=["GET"])
def summary():
    return jsonify(fetch_summary(current_app.config["DATABASE"]))


@api_bp.route("/logs", methods=["GET"])
def logs():
    limit = int(request.args.get("limit", 10))
    return jsonify(fetch_recent_logs(current_app.config["DATABASE"], limit=limit))


@api_bp.route("/report", methods=["GET"])
def report():
    csv_content = export_report_csv(current_app.config["DATABASE"])
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=safesight-k3-report.csv"
        },
    )

@api_bp.route("/proxy/video")
def proxy_video():
    url = request.args.get("url")
    if not url:
        return "Missing url parameter", 400
    try:
        # Stream the video from the IP Camera through our Flask backend to bypass CORS
        req = requests.get(url, stream=True, timeout=5)
        return Response(stream_with_context(req.iter_content(chunk_size=1024)), 
                        content_type=req.headers.get('content-type', 'multipart/x-mixed-replace'))
    except Exception as e:
        return str(e), 500