import { useRef, useEffect } from "react";

interface Box {
  class: string;
  conf: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const FRAME_WIDTH = 320;
  const FRAME_HEIGHT = 240;

  const boxesRef = useRef<Box[]>([]);
  const lastSpokenAlert = useRef<string>("");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => console.log("WebSocket connected");
    ws.onerror = (err) => console.error("WebSocket error:", err);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Replace boxes with latest detection — old boxes disappear immediately
      if (data.boxes) {
        boxesRef.current = data.boxes.filter((b: Box) => b.conf >= 0.85);
      } else {
        boxesRef.current = []; // no detection → clear boxes
      }

      // Speak alerts once per new detection
      if (data.alerts && data.alerts.length > 0) {
        const alertText = data.alerts[0];
        if (alertText !== lastSpokenAlert.current) {
          lastSpokenAlert.current = alertText;
          speechSynthesis.speak(new SpeechSynthesisUtterance(alertText));
        }
      }
    };

    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Create canvas overlay
      if (!canvasRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = FRAME_WIDTH;
        canvas.height = FRAME_HEIGHT;
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        canvasRef.current = canvas;
        videoRef.current?.parentElement?.appendChild(canvas);
      }

      function sendFrame() {
        if (!videoRef.current || !canvasRef.current) return;

        const offCanvas = document.createElement("canvas");
        offCanvas.width = FRAME_WIDTH;
        offCanvas.height = FRAME_HEIGHT;
        const offCtx = offCanvas.getContext("2d");
        if (!offCtx) return;

        // Mirror video for backend
        offCtx.translate(FRAME_WIDTH, 0);
        offCtx.scale(-1, 1);
        offCtx.drawImage(videoRef.current, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

        const dataUrl = offCanvas.toDataURL("image/jpeg", 0.5);
        if (ws.readyState === WebSocket.OPEN) ws.send(dataUrl);

        drawBoxes();
        requestAnimationFrame(sendFrame);
      }

      function drawBoxes() {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        const scaleX = canvasRef.current.width / FRAME_WIDTH;
        const scaleY = canvasRef.current.height / FRAME_HEIGHT;

        boxesRef.current.forEach((b: Box) => {
          const x1 = canvasRef.current.width - b.x2 * scaleX; // mirror X
          const x2 = canvasRef.current.width - b.x1 * scaleX;

          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.strokeRect(x1, b.y1 * scaleY, x2 - x1, (b.y2 - b.y1) * scaleY);

          ctx.fillStyle = "red";
          ctx.font = "16px Arial";
          ctx.fillText(`${b.class} ${b.conf.toFixed(2)}`, x1, b.y1 * scaleY - 5);
        });
      }

      sendFrame();
    }

    startCamera();
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)" // mirror
        }}
      />
    </div>
  );
}
