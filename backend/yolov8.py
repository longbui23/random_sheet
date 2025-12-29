import base64
import cv2
import numpy as np
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model
model = YOLO("yolov8n.pt")

# Define classes considered hazards
HAZARD_CLASSES = {"person", "car", "bicycle", "chair", "dog", "stairs"}

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    print("Client connected!")

    frame_count = 0

    while True:
        try:
            # Receive base64-encoded frame from frontend
            data = await ws.receive_text()
            if "," in data:
                data = data.split(",")[1]  # remove "data:image/jpeg;base64," prefix

            img_bytes = base64.b64decode(data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is None:
                continue  # skip invalid frames

            frame_count += 1

            # Run YOLOv8 detection every 3 frames for speed
            if frame_count % 3 == 0:
                results = model(frame)
                boxes_to_send = []

                for result in results:
                    for box in result.boxes:
                        cls_id = int(box.cls[0])
                        cls_name = model.names[cls_id]
                        conf = float(box.conf[0])
                        x1, y1, x2, y2 = map(int, box.xyxy[0])

                        if cls_name in HAZARD_CLASSES and conf > 0.3:
                            boxes_to_send.append({
                                "class": cls_name,
                                "conf": round(conf, 2),
                                "x1": x1,
                                "y1": y1,
                                "x2": x2,
                                "y2": y2
                            })

                # Send all detected boxes to frontend
                if boxes_to_send:
                    await ws.send_json({"boxes": boxes_to_send})

        except Exception as e:
            print("WebSocket error:", e)
            break