## What It Does
Real-time assistive AI that narrates the physical world for visually impaired users.

Here’s a **single, clean Markdown file** you can copy and use directly without interruptions or nested backtick issues:

````markdown
# Real-Time Detection Project Setup

This guide covers setting up the front-end (React/TypeScript) and back-end (Python/FastAPI) for the real-time object detection project.

---

## 1️⃣ Front-End Setup

1. **Navigate to the front-end folder**:

```bash
cd frontend
````

2. **Install npm packages**:

```bash
npm install
```

3. **Create or update `.env`** in the `frontend/` folder:

```
REACT_APP_WS_URL=ws://localhost:8000/ws
```

4. **Run the front-end**:

```bash
npm start
```

> The front-end will now run at `http://localhost:3000` (default React port).

---

## 2️⃣ Back-End Setup

1. **Activate Python virtual environment**:

* Linux/macOS:

```bash
source venv/bin/activate
```

* Windows:

```bash
venv\Scripts\activate
```

2. **Install Python packages**:

```bash
pip install -r requirements.txt
```

3. **Run the FastAPI server**:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> The back-end WebSocket will run at `ws://localhost:8000/ws`.

---

## 3️⃣ Notes

* Ensure `FRAME_WIDTH` and `FRAME_HEIGHT` in the front-end match the backend scaling for correct box placement.
* The `.env` file allows easy configuration of the WebSocket URL.
* Keep both front-end and back-end running concurrently for real-time detection.
* Make sure your camera is accessible in the browser for live video streaming.

```

This is **fully unified** — you can copy it straight into a README.md or any Markdown editor without breaking.  

```

