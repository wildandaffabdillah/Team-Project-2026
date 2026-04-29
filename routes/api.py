from flask import Blueprint, Response, current_app, jsonify, request

from services.database import (
    export_report_csv,
    fetch_recent_logs,
    fetch_summary,
    insert_violation,
    now_iso,
)
from services.detector import PPEDetector

api_bp = Blueprint("api", __name__)


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
        return jsonify({"error": "Frame webcam tidak ditemukan."}), 400

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