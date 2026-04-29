from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
DB_PATH = INSTANCE_DIR / "safesight.db"
MODEL_PATH = BASE_DIR / "models" / "ppe.pt"


class Config:
    SECRET_KEY = "secret123"
    DATABASE = str(DB_PATH)
    ROBOFLOW_API_KEY = "a0ZmLbsda0FYqW9X6dwD"
    ROBOFLOW_MODEL_ID = "ppe-wzdov-n1fly/1"
    ALERT_COOLDOWN_SECONDS = 10
    CAPTURE_INTERVAL_MS = 1800
    REQUIRED_PPE = ["helmet", "vest", "shoes"]