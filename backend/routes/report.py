from flask import Blueprint, jsonify
from database import cursor

bp = Blueprint("report", __name__)

@bp.route("/stats")
def stats():
    cursor.execute("SELECT COUNT(*) as total FROM detections")
    total = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as violations FROM detections WHERE violation=1")
    violations = cursor.fetchone()["violations"]

    return jsonify({
        "total": total,
        "violations": violations,
        "safe": total - violations
    })