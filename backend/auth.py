import jwt
import datetime
from functools import wraps
from flask import request, jsonify

SECRET_KEY = "SECRET123"

def generate_token(user):
    payload = {
        "username": user["username"],
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=5)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({"message": "OK"}), 200
            
        token = request.headers.get("Authorization")
        if not token:
            token = request.args.get("token")

        if not token:
            return jsonify({"message": "Token missing"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except:
            return jsonify({"message": "Invalid token"}), 401

        return f(data, *args, **kwargs)

    return decorated
