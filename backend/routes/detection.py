from flask import Blueprint, request, jsonify
from services.roboflow_service import detect_ppe
from services.ppe_checker import check_violation
from database import cursor, db

bp = Blueprint("detect", __name__)

@bp.route("/detect", methods=["POST"])
def detect():
    file = request.files["image"]
    file.save("temp.jpg")

    result = detect_ppe("temp.jpg")
    predictions = result.get("predictions", [])

    person, helmet, vest, violation = check_violation(predictions)

    cursor.execute(
        "INSERT INTO detections (person, helmet, vest, violation) VALUES (%s,%s,%s,%s)",
        (person, helmet, vest, violation)
    )
    db.commit()

    if violation:
        cursor.execute(
            "INSERT INTO alerts (message) VALUES (%s)",
            ("Worker without PPE detected!",)
        )
        db.commit()

    return jsonify({
        "person": person,
        "helmet": helmet,
        "vest": vest,
        "violation": violation
    })