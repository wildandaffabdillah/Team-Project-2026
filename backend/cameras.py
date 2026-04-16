import cv2
import numpy as np

camera_urls = {
    "cam1": 0,
    "cam2": 1
}
cameras = {}

def update_camera(cam_id, url):
    camera_urls[cam_id] = url
    if cam_id in cameras and cameras[cam_id] is not None:
        cameras[cam_id].release()
    try:
        url_int = int(url)
        cameras[cam_id] = cv2.VideoCapture(url_int)
    except ValueError:
        cameras[cam_id] = cv2.VideoCapture(url)
    
    if cameras[cam_id] and cameras[cam_id].isOpened():
        cameras[cam_id].set(cv2.CAP_PROP_BUFFERSIZE, 1)

# Initialize
for c_id, url in camera_urls.items():
    update_camera(c_id, url)

def get_camera(cam_id):
    return cameras.get(cam_id)

def get_offline_frame(text="CAMERA OFFLINE"):
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    font = cv2.FONT_HERSHEY_SIMPLEX
    textsize = cv2.getTextSize(text, font, 1, 2)[0]
    textX = (frame.shape[1] - textsize[0]) // 2
    textY = (frame.shape[0] + textsize[1]) // 2
    cv2.putText(frame, text, (textX, textY), font, 1, (0, 0, 255), 2, cv2.LINE_AA)
    return frame
