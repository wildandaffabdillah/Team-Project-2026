import requests

def detect_ppe(image_path):
    url = "https://detect.roboflow.com/ppe-wzdov-n1fly/1"
    
    with open(image_path, "rb") as f:
        response = requests.post(
            url,
            files={"file": f},
            params={"api_key": "a0ZmLbsda0FYqW9X6dwD"}
        )

    return response.json()