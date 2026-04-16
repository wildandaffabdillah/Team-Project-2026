import requests
from config import API_KEY, MODEL

def detect_ppe(image_path):
    url = f"https://detect.roboflow.com/{MODEL}?api_key={API_KEY}"

    with open(image_path, "rb") as f:
        res = requests.post(url, files={"file": f})

    return res.json()