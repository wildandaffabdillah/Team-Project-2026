import cv2
import numpy as np
import threading
import time

camera_urls = {
    "cam1": 0,
    "cam2": 1
}

class ThreadedCamera:
    def __init__(self, url):
        self.url = url
        try:
            url_int = int(url)
            # Solusi khusus Windows: Paksa pakai DirectShow (CAP_DSHOW) 
            # untuk menghindari bug MSMF (Microsoft Media Foundation)
            self.video = cv2.VideoCapture(url_int, cv2.CAP_DSHOW)
        except ValueError:
            self.video = cv2.VideoCapture(url)

        self.grabbed = False
        self.frame = None
        self.stopped = False
        
        # Mulai thread background murni untuk camera read
        if self.video.isOpened():
            self.thread = threading.Thread(target=self.update, args=())
            self.thread.daemon = True
            self.thread.start()

    def update(self):
        while not self.stopped:
            if not self.video.isOpened():
                time.sleep(0.5)
                continue
                
            self.grabbed, frame = self.video.read()
            if self.grabbed:
                self.frame = frame.copy()
            
            # Beri sedikit napas agar hardware/USB bus Windows (MSMF) tidak meledak/crash 
            # karena ditarik datanya ribuan kali per detik
            time.sleep(0.03)

    def read(self):
        return self.grabbed, self.frame

    def isOpened(self):
        return self.video.isOpened()

    def release(self):
        self.stopped = True
        if hasattr(self, 'thread'):
            self.thread.join(timeout=1)
        self.video.release()

cameras = {}

def update_camera(cam_id, url):
    camera_urls[cam_id] = url
    if cam_id in cameras and cameras[cam_id] is not None:
        cameras[cam_id].release()
        
    cameras[cam_id] = ThreadedCamera(url)

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
