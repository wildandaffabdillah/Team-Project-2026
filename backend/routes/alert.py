from flask import Blueprint, jsonify
from database import cursor

bp = Blueprint("alert", __name__)

@bp.route("/alerts")
def alerts():
    cursor.execute("SELECT * FROM alerts ORDER BY created_at DESC")
    return jsonify(cursor.fetchall())