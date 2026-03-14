## AI-Based Smart Traffic Management System

An end-to-end, AI-powered smart traffic management system that:

- detects and counts vehicles per lane using YOLOv8 and OpenCV
- computes traffic density and adaptive signal timings
- simulates a multi-intersection city grid with real-time updates
- exposes a FastAPI backend + WebSocket feed
- provides a React + Tailwind + Recharts dashboard with admin overrides

---

### 1. Project Structure

```text
smart-traffic-system (this repo)
├─ dataset/                # sample videos or frames (you provide)
├─ models/                 # YOLOv8 weights (yolov8n.pt etc.)
├─ vehicle_detection.py    # YOLOv8 wrapper + drawing utils
├─ vehicle_counter.py      # lane-based vehicle counting
├─ traffic_algorithm.py    # density levels + timing algorithm
├─ signal_controller.py    # finite-state signal controller
├─ emergency_vehicle_detection.py
├─ smart_traffic_cli.py    # CLI demo using camera/video
├─ backend/
│  └─ api.py               # FastAPI app: REST + WebSocket + simulation
├─ frontend/
│  ├─ package.json         # React + Vite + Tailwind + Recharts
│  └─ src/                 # dashboard UI
├─ database/
│  └─ schema.sql           # PostgreSQL schema + seed intersections
├─ Dockerfile.backend
├─ Dockerfile.frontend
├─ docker-compose.yml
└─ requirements.txt        # Python dependencies
```

---

### 2. System Architecture

High-level flow:

- **Traffic Camera / Simulator**
  - Frame extraction (`smart_traffic_cli.py`)
  - Vehicle detection (`vehicle_detection.py`, YOLOv8)
  - Vehicle counting per lane (`vehicle_counter.py`)
  - Density + timing algorithm (`traffic_algorithm.py`)
  - Signal control + emergency override (`signal_controller.py`, `emergency_vehicle_detection.py`)
- **Backend (FastAPI, `backend/api.py`)**
  - REST APIs: `/intersections`, `/signal-update`, `/traffic-stats`, `/incidents`, `/route-optimize`
  - WebSocket: `/ws/traffic` pushes live intersection + incident updates
  - Simulation loop updates 12+ intersections every 5s (bonus: simulation mode)
- **Database (PostgreSQL, `database/schema.sql`)**
  - `intersections`, `lanes`, `traffic_snapshots`, `signal_logs`, `incidents`, `vehicles`
  - Initialization + seed grid
- **Frontend (React + Tailwind + Recharts, `frontend/`)**
  - City grid map view
  - AI Signal Control panel
  - Live charts + analytics
  - Incidents sidebar

Architecture diagram (Mermaid):

```mermaid
flowchart LR
    CAM[Traffic Camera / Video] --> FE[Frame Extraction]
    FE --> DET[YOLOv8 Vehicle Detection]
    DET --> CNT[Lane-wise Vehicle Counting]
    CNT --> DENS[Density Calculation]
    DENS --> ALG[Dynamic Signal Algorithm]
    ALG --> SIG[Signal Controller]
    SIG -->|state| API[FastAPI Backend]
    API <-->|REST / WS| UI[React Dashboard]
    API --> DB[(PostgreSQL)]
    DET -->|counts, detections| DB
```

---

### 3. Backend API (FastAPI)

Backend entrypoint: `backend/api.py`.

#### 3.1 REST Endpoints

- **GET `/intersections`**
  - Returns all intersections + lane status + congestion level.
- **POST `/signal-update`**
  - Body:
    ```json
    {
      "intersection_id": "I1",
      "lane_id": "N",
      "force_green_seconds": 30
    }
    ```
  - Manually forces a lane to GREEN for a given duration.
- **GET `/traffic-stats?limit=100`**
  - Returns historical traffic snapshots (aggregated).
- **GET `/incidents`**
  - Returns active incidents (e.g., sustained HIGH congestion).
- **POST `/route-optimize`**
  - Body:
    ```json
    {
      "start": "I1",
      "end": "I10"
    }
    ```
  - Returns least-congested path:
    ```json
    {
      "path": ["I1", "I2", "I6", "I10"],
      "total_congestion_score": 13.0
    }
    ```

#### 3.2 WebSocket

- **`/ws/traffic`**
  - Server pushes JSON payloads every few seconds:
    ```json
    {
      "type": "traffic_update",
      "intersections": [...],
      "incidents": [...]
    }
    ```
  - Used by the React dashboard for real-time updates.

#### 3.3 Simulation Mode

- On backend startup:
  - Initializes a **3×4 grid** of intersections (`I1`–`I12`).
  - Every 5 seconds:
    - Random-walk vehicle counts per lane.
    - Computes density + adaptive GREEN lane via `traffic_algorithm.compute_signal_plan`.
    - Flags incidents when congestion stays HIGH.
    - Appends to in-memory `TRAFFIC_HISTORY` (can be wired to DB).

---

### 4. Frontend Dashboard (React + Tailwind + Recharts)

Located in `frontend/`.

- **City Grid (`CityGrid.jsx`)**
  - Renders intersections as neon tiles on a dark map.
  - Each tile:
    - Color-coded congestion (LOW/MEDIUM/HIGH).
    - Shows per-lane signal colors + vehicle counts.
  - Click to select for detailed view.
- **AI Signal Control Panel (`SignalControlPanel.jsx`)**
  - Shows lanes for the selected intersection:
    - Vehicle count
    - Density level
    - Current signal color + remaining time (simulated)
  - Button: **“Force GREEN 30s”** → calls `/signal-update`.
- **Traffic Charts (`TrafficCharts.jsx`)**
  - Recharts-based:
    - Line chart: current per-lane volumes.
    - Area chart: total vehicles over time (peak-hour analytics).
- **Incident Sidebar (`IncidentSidebar.jsx`)**
  - Scrollable list of congestion incidents and alerts.

Set API base via environment:

- Default: `http://localhost:8000`
- Override: `VITE_API_BASE=http://your-backend:8000`

---

### 5. Computer Vision Modules (YOLOv8 + OpenCV)

#### 5.1 Vehicle Detection (`vehicle_detection.py`)

- Wraps `ultralytics.YOLO` with a `VehicleDetector` class.
- Detects:
  - cars, buses, trucks, motorcycles
  - optional emergency vehicles (ambulance, fire truck)
- Draws bounding boxes and class labels.

Usage:

```python
from vehicle_detection import VehicleDetector, draw_detections, load_video_capture

cap = load_video_capture(0)  # webcam
detector = VehicleDetector(model_path="models/yolov8n.pt")

ret, frame = cap.read()
detections, emergency = detector.detect(frame)
frame_vis = draw_detections(frame, detections)
```

#### 5.2 Vehicle Counting (`vehicle_counter.py`)

- Uses fixed lane lines (`LaneConfig`) and assigns detections to nearest lane.

```python
from vehicle_counter import LaneConfig, LaneCounter

lanes = [
    LaneConfig("Lane A", (100, 0), (100, 480)),
    LaneConfig("Lane B", (320, 0), (320, 480)),
]
counter = LaneCounter(lanes)
counts = counter.count_by_lane(detections)
```

#### 5.3 Traffic Density + Dynamic Timing (`traffic_algorithm.py`)

- Density levels:
  - LOW: `< 10` vehicles → 15s green
  - MEDIUM: `10–30` vehicles → 30s green
  - HIGH: `> 30` vehicles → 60s green
- `compute_signal_plan(counts_by_lane)` returns:
  - lane order (highest vehicle count first)
  - timings per lane

#### 5.4 Signal Controller (`signal_controller.py`)

- Finite-state controller with GREEN → YELLOW → RED transitions.
- Ensures only **one lane is GREEN** at a time.
- Supports emergency override (`force_green_for_lane`).

#### 5.5 Emergency Vehicle Detection (`emergency_vehicle_detection.py`)

- Helper to detect emergency vehicles from detections:
  - `emergency_present(detections)`
  - `filter_non_emergency(detections)`

---

### 6. CLI Demo: Smart Intersection from Camera/Video

Script: `smart_traffic_cli.py`

Example:

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Put YOLOv8 weights at models/yolov8n.pt or adjust the path.
python smart_traffic_cli.py --source 0
```

Console output (example):

```text
Lane A: 45 vehicles -> HIGH
Lane B: 22 vehicles -> MEDIUM
Lane C: 7 vehicles  -> LOW

Signal Lane A: GREEN (60s remaining)
Signal Lane B: RED   (0s remaining)
Signal Lane C: RED   (0s remaining)
----------------------------------------
```

---

### 7. Database & Sample Dataset

- PostgreSQL schema in `database/schema.sql`:
  - `intersections`, `lanes`
  - `traffic_snapshots` (for historical counts + densities)
  - `signal_logs` (AI decisions & overrides)
  - `incidents` (congestion / accidents / closures)
  - `vehicles` (per-detection logs)
- On Docker DB startup, `schema.sql` seeds a **12-intersection grid**.

Sample dataset usage:

- Place any traffic camera video into `dataset/` (e.g., `dataset/intersection_a.mp4`).
- Run:
  ```bash
  python smart_traffic_cli.py --source dataset/intersection_a.mp4
  ```
- Use that video as a demo input while the backend/React simulation runs in parallel.

---

### 8. Running the Full Stack (Docker)

Prerequisites:

- Docker + Docker Compose installed.

Steps:

```bash
cd smart-traffic-system  # repo root
docker-compose up --build
```

This starts:

- `db`: PostgreSQL with schema + seeds
- `backend`: FastAPI at `http://localhost:8000`
- `frontend`: React dashboard at `http://localhost:5173`

Open the dashboard:

- Go to `http://localhost:5173` in your browser.
- Watch intersections update every 5 seconds.
- Use the AI Signal Control panel to:
  - override GREEN signals per lane
  - observe congestion heat and incidents

---

### 9. Local (Non-Docker) Development

#### 9.1 Backend

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

uvicorn backend.api:app --reload --port 8000
```

By default, this uses in-memory simulation only. To connect to PostgreSQL, set:

```bash
set DATABASE_URL=postgres://traffic:traffic@localhost:5432/traffic
```

#### 9.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

---

### 10. Extending the System

- **Real YOLO → Backend Integration**
  - Expose an internal gRPC/REST endpoint for per-intersection camera processors
    to post counts and densities into the backend instead of using pure simulation.
- **Traffic Heatmaps**
  - Add a heatmap layer on top of `CityGrid` by mapping congestion to color intensity.
- **Peak Hour Analytics**
  - Query `traffic_snapshots` by hour/day and render advanced charts with Recharts.
- **Admin Panel**
  - Add authentication and role-based access for operators.

This project gives you a working, extensible baseline that:

- demonstrates AI-based traffic signal control with YOLOv8 and OpenCV,
- provides a modern, neon-themed React monitoring UI,
- simulates a multi-intersection city and exposes clear APIs for integration.

