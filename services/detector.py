import base64
import io
import requests
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

@dataclass
class DetectionResult:
    worker_detected: bool
    helmet: bool
    vest: bool
    shoes: bool
    gloves: bool
    goggles: bool
    compliant: bool
    confidence: float
    violation_text: str
    mode: str
    boxes: list[dict]

class PPEDetector:
    def __init__(self, api_key: str, model_id: str, required_ppe: list[str] | None = None):
        self.api_key = api_key
        self.model_id = model_id
        self.required_ppe = required_ppe or ["helmet", "vest", "gloves", "goggles"]

    def decode_base64_image(self, data_url: str) -> np.ndarray:
        _, encoded = data_url.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

    def analyze(self, data_url: str) -> DetectionResult:
        frame = self.decode_base64_image(data_url)
        return self._analyze_with_roboflow(frame)

    def _analyze_with_roboflow(self, frame: np.ndarray) -> DetectionResult:
        _, buffer = cv2.imencode('.jpg', frame)
        url = f"https://detect.roboflow.com/{self.model_id}?api_key={self.api_key}&confidence=15"
        
        try:
            res = requests.post(url, files={"file": ("image.jpg", buffer.tobytes(), "image/jpeg")})
            json_res = res.json()
            predictions = json_res.get("predictions", [])
        except Exception as e:
            print("[DEBUG] AI Request Failed:", e)
            predictions = []

        persons = []
        items = []
        
        boxes = []
        confidences = []
        
        for p in predictions:
            conf = float(p["confidence"])
            confidences.append(conf)
            label = p["class"].lower()
            
            box_data = {
                "label": label,
                "confidence": round(conf, 3),
                "x1": int(p["x"] - p["width"]/2),
                "y1": int(p["y"] - p["height"]/2),
                "x2": int(p["x"] + p["width"]/2),
                "y2": int(p["y"] + p["height"]/2),
            }
            boxes.append(box_data)
            
            if label in ["person", "worker", "none", "no_helmet", "no_vest", "no_shoes", "no_gloves", "no_goggles"]:
                persons.append(p)
            elif label in ["helmet", "vest", "shoes", "gloves", "goggles"]:
                items.append(p)

        persons.sort(key=lambda p: p["x"])
        
        violation_strings = []
        is_compliant = True
        
        for i, person in enumerate(persons):
            has_helmet = False
            has_vest = False
            has_gloves = False
            has_goggles = False
            
            xmin = person["x"] - person["width"] / 2
            xmax = person["x"] + person["width"] / 2
            ymin = person["y"] - person["height"] / 2
            ymax = person["y"] + person["height"] / 2
            
            for item in items:
                if xmin <= item["x"] <= xmax and ymin <= item["y"] <= ymax:
                    if item["class"].lower() == "helmet": has_helmet = True
                    if item["class"].lower() == "vest": has_vest = True
                    if item["class"].lower() == "gloves": has_gloves = True
                    if item["class"].lower() == "goggles": has_goggles = True

            person_compliant = has_helmet and has_vest
            
            # P1 label injection directly into boxes list for UI rendering
            person_box_index = None
            for idx, b in enumerate(boxes):
                if b["label"] in ["person", "worker", "none", "no_helmet", "no_vest"] and b["x1"] == int(xmin) and b["y1"] == int(ymin):
                    person_box_index = idx
                    break
                    
            if person_box_index is not None:
                boxes[person_box_index]["label"] = f"P{i+1}: {'SAFE' if person_compliant else 'DANGER'}"

            if not person_compliant:
                is_compliant = False
                h_text = "✅ Helmet" if has_helmet else "❌ Helmet"
                v_text = "✅ Vest" if has_vest else "❌ Vest"
                violation_strings.append(f"P{i+1}: {h_text} | {v_text}")

        worker_detected = len(persons) > 0
        
        if not worker_detected:
            detected_labels = [p["class"] for p in predictions]
            if detected_labels:
                violation_text = f"AI detected: {', '.join(detected_labels)} (Not a Worker)"
            else:
                violation_text = "No worker detected"
            is_compliant = True
        elif is_compliant:
            violation_text = "PPE is complete and compliant"
        else:
            violation_text = " | ".join(violation_strings)
            
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

        global_helmet = any(i["class"].lower() == "helmet" for i in items)
        global_vest = any(i["class"].lower() == "vest" for i in items)
        global_shoes = any(i["class"].lower() == "shoes" for i in items)
        global_gloves = any(i["class"].lower() == "gloves" for i in items)
        global_goggles = any(i["class"].lower() == "goggles" for i in items)

        return DetectionResult(
            worker_detected=worker_detected,
            helmet=global_helmet, 
            vest=global_vest,
            shoes=global_shoes,
            gloves=global_gloves,
            goggles=global_goggles,
            compliant=is_compliant,
            confidence=round(avg_conf, 3),
            violation_text=violation_text,
            mode="roboflow",
            boxes=boxes,
        )