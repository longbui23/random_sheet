import base64
import cv2
import numpy as np
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from ultralytics import YOLO

app = FastAPI()
model = YOLO("yolov8n.pt")

connected_clients = []
hazard_classes = ["person", "car", "bus", "bicycle"]

# Define same frame size as front-end
FRAME_WIDTH = 320
FRAME_HEIGHT = 240

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    last_alert = None

    try:
        while True:
            data = await ws.receive_text()
            header, encoded = data.split(",", 1)
            img_data = base64.b64decode(encoded)
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            results = model(frame)[0]

            boxes_to_send = []
            alerts = []

            orig_h, orig_w = frame.shape[:2]

            for box in results.boxes:
                cls_name = model.names[int(box.cls[0])]
                conf = float(box.conf[0])
                if conf < 0.75:
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Scale coordinates to FRAME_WIDTH x FRAME_HEIGHT
                x1_scaled = int(x1 / orig_w * FRAME_WIDTH)
                x2_scaled = int(x2 / orig_w * FRAME_WIDTH)
                y1_scaled = int(y1 / orig_h * FRAME_HEIGHT)
                y2_scaled = int(y2 / orig_h * FRAME_HEIGHT)

                # Flip X for mirrored front-end
                x1_final = FRAME_WIDTH - x2_scaled
                x2_final = FRAME_WIDTH - x1_scaled

                boxes_to_send.append({
                    "class": cls_name,
                    "conf": round(conf, 2),
                    "x1": x1_final,
                    "y1": y1_scaled,
                    "x2": x2_final,
                    "y2": y2_scaled
                })

                if cls_name in hazard_classes and last_alert != cls_name:
                    last_alert = cls_name
                    alerts.append(f"Hazard: {cls_name} detected!")

            await ws.send_text(json.dumps({
                "boxes": boxes_to_send,
                "alerts": alerts
            }))

    except WebSocketDisconnect:
        connected_clients.remove(ws)
