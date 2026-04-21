from flask import Flask, jsonify, Response, request, send_file
from flask_cors import CORS
import cv2, requests, base64
from datetime import datetime

from auth import generate_token, token_required
from cameras import get_camera, get_offline_frame
from database import conn, get_cursor
from report import generate_pdf
import concurrent.futures

app = Flask(__name__)
CORS(app)

config = {
    "api_key": "a0ZmLbsda0FYqW9X6dwD",
    "model_id": "ppe-wzdov-n1fly/1"
}

executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)
global_predictions = {"cam1": [], "cam2": []}

def run_ai_background(frame, cam_id):
    result = detect(frame)
    preds = result.get("predictions", [])
    global_predictions[cam_id] = preds
    c = get_cursor()
    violations_found = False
    for p in preds:
        if p["class"] not in ["helmet", "vest"]:
            c.execute(
                "INSERT INTO violations VALUES (NULL, ?, ?, ?)",
                (datetime.now().isoformat(), cam_id, f"Missing PPE: {p['class'].upper()}")
            )
            violations_found = True
    if violations_found:
        conn.commit()

users = [
    {"username": "admin", "password": "123", "role": "admin"},
    {"username": "supervisor", "password": "123", "role": "supervisor"}
]

# 🔐 LOGIN
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    for user in users:
        if user["username"] == data["username"] and user["password"] == data["password"]:
            token = generate_token(user)
            return jsonify({"token": token})
    return jsonify({"message": "Invalid"}), 401


# 🧠 DETECTION
def detect(frame):
    _, buffer = cv2.imencode('.jpg', frame)
    url = f"https://detect.roboflow.com/{config['model_id']}?api_key={config['api_key']}"
    try:
        # Roboflow accepts multipart/form-data via files
        res = requests.post(url, files={"file": ("image.jpg", buffer.tobytes(), "image/jpeg")})
        json_res = res.json()
        print("[DEBUG] AI Response:", json_res) # Print to terminal for debugging
        return json_res
    except Exception as e:
        print("[DEBUG] AI Request Failed:", e)
        return {"predictions": []}




# 🎥 VIDEO STREAM MULTI CAM
@app.route("/video/<cam_id>")
@token_required
def video(user, cam_id):
    camera = get_camera(cam_id)
    import time
    def gen():
        last_detect = 0
        while True:
            if camera is None or not camera.isOpened():
                frame = get_offline_frame()
                _, buffer = cv2.imencode('.jpg', frame)
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                time.sleep(1) # delay if offline
                continue

            success, frame = camera.read()
            if not success or frame is None:
                frame = get_offline_frame("FEED ERROR")
                _, buffer = cv2.imencode('.jpg', frame)
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                time.sleep(0.5)
                continue
                
            current_time = time.time()
            if current_time - last_detect > 2.0:
                last_detect = current_time
                executor.submit(run_ai_background, frame.copy(), cam_id)

            # Draw AI Boxes on every frame using last known predictions
            for p in global_predictions.get(cam_id, []):
                x = int(p["x"] - p["width"] / 2)
                y = int(p["y"] - p["height"] / 2)
                w = int(p["width"])
                h = int(p["height"])
                
                color = (0, 255, 0) # Green
                if p["class"] not in ["helmet", "vest"]:
                    color = (0, 0, 255) # Red for danger/violation
                
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, f"{p['class'].upper()}", (x, max(15, y - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            # Tidak ada time.sleep() disini agar streaming stabil 30fps!

    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')



# 🚨 ALERT
@app.route("/alerts")
@token_required
def alerts(user):
    c = get_cursor()
    c.execute("SELECT * FROM violations ORDER BY id DESC")
    data = c.fetchall()
    return jsonify(data)

# ⚙️ SETTINGS
@app.route("/settings", methods=["GET"])
@token_required
def get_settings(user):
    from cameras import camera_urls
    return jsonify({"api_key": config["api_key"], "camera_urls": camera_urls})

@app.route("/settings", methods=["POST"])
@token_required
def set_settings(user):
    from cameras import update_camera
    data = request.json
    if "api_key" in data:
        config["api_key"] = data["api_key"]
    if "camera_urls" in data:
        for c_id, url in data["camera_urls"].items():
            update_camera(c_id, url)
    return jsonify({"message": "Settings saved"})


# 📄 EXPORT PDF
@app.route("/report")
@token_required
def report(user):
    period = request.args.get('period', 'all')
    file = generate_pdf(period=period)
    return send_file(file, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True)