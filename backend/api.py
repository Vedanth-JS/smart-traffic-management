from __future__ import annotations

import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from traffic_algorithm import DensityLevel, compute_signal_plan, density_for_count

app = FastAPI(title="AI-Based Smart Traffic Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LaneStatus(BaseModel):
    lane_id: str
    vehicle_count: int
    density: DensityLevel
    signal_color: str
    remaining_seconds: int


class Intersection(BaseModel):
    id: str
    name: str
    x: int
    y: int
    lanes: List[LaneStatus]
    congestion_level: DensityLevel


class SignalUpdateRequest(BaseModel):
    intersection_id: str
    lane_id: str
    force_green_seconds: int


class TrafficStats(BaseModel):
    timestamp: datetime
    total_vehicles: int
    by_intersection: Dict[str, int]


class RouteRequest(BaseModel):
    start: str
    end: str


class RouteResponse(BaseModel):
    path: List[str]
    total_congestion_score: float


class Incident(BaseModel):
    id: str
    intersection_id: str
    level: str
    message: str
    created_at: datetime


class IngestCountsRequest(BaseModel):
    intersection_id: str
    counts_by_lane: Dict[str, int]


# In-memory simulation state (backed by DB in a real deployment)
INTERSECTIONS: Dict[str, Intersection] = {}
INCIDENTS: List[Incident] = []
TRAFFIC_HISTORY: List[TrafficStats] = []

WS_CONNECTIONS: List[WebSocket] = []


def _init_mock_city():
    if INTERSECTIONS:
        return
    grid_size = 3  # 3x4 ~= 12 intersections
    idx = 0
    for row in range(grid_size):
        for col in range(4):
            idx += 1
            intersection_id = f"I{idx}"
            lanes = []
            for ln in ["N", "E", "S", "W"]:
                count = random.randint(0, 20)
                density = density_for_count(count)
                lanes.append(
                    LaneStatus(
                        lane_id=ln,
                        vehicle_count=count,
                        density=density,
                        signal_color="RED",
                        remaining_seconds=0,
                    )
                )

            INTERSECTIONS[intersection_id] = Intersection(
                id=intersection_id,
                name=f"Intersection {intersection_id}",
                x=col,
                y=row,
                lanes=lanes,
                congestion_level=max(l.density for l in lanes),
            )


async def _broadcast_update():
    payload = {
        "type": "traffic_update",
        "intersections": [i.dict() for i in INTERSECTIONS.values()],
        "incidents": [i.dict() for i in INCIDENTS],
    }
    living_connections: List[WebSocket] = []
    for ws in WS_CONNECTIONS:
        try:
            await ws.send_json(payload)
            living_connections.append(ws)
        except Exception:
            # Drop dead connections
            continue
    WS_CONNECTIONS[:] = living_connections


async def _simulation_loop():
    """
    Background task: every 5 seconds, update simulated traffic,
    recompute signal plans, detect incidents, and broadcast via WebSocket.
    """
    _init_mock_city()
    last_tick = datetime.utcnow()
    while True:
        await asyncio.sleep(5)
        now = datetime.utcnow()
        dt = (now - last_tick).total_seconds()
        last_tick = now

        total_vehicles = 0
        by_intersection: Dict[str, int] = {}

        for inter_id, inter in INTERSECTIONS.items():
            counts = {}
            for lane in inter.lanes:
                # Random walk for vehicle counts
                delta = random.randint(-3, 5)
                lane.vehicle_count = max(0, lane.vehicle_count + delta)
                lane.density = density_for_count(lane.vehicle_count)
                counts[lane.lane_id] = lane.vehicle_count

            decision = compute_signal_plan(counts)
            # Set only the top lane to GREEN, others to RED, for simplicity
            for lane in inter.lanes:
                lane.signal_color = "RED"
                lane.remaining_seconds = 0
            if decision.lane_order:
                top = decision.lane_order[0]
                for lane in inter.lanes:
                    if lane.lane_id == top.lane_id:
                        lane.signal_color = "GREEN"
                        lane.remaining_seconds = decision.timings[lane.lane_id]

            inter.congestion_level = max(l.density for l in inter.lanes)
            inter_total = sum(l.vehicle_count for l in inter.lanes)
            by_intersection[inter_id] = inter_total
            total_vehicles += inter_total

            # Incident detection: sustained HIGH congestion
            if inter.congestion_level == DensityLevel.HIGH:
                # Very naive: create an incident if not already active
                exists = any(
                    inc.intersection_id == inter_id
                    and (now - inc.created_at) < timedelta(minutes=30)
                    for inc in INCIDENTS
                )
                if not exists:
                    INCIDENTS.append(
                        Incident(
                            id=f"INC-{len(INCIDENTS)+1}",
                            intersection_id=inter_id,
                            level="CRITICAL",
                            message="Sustained high congestion detected",
                            created_at=now,
                        )
                    )

        stats = TrafficStats(
            timestamp=now, total_vehicles=total_vehicles, by_intersection=by_intersection
        )
        TRAFFIC_HISTORY.append(stats)
        # keep last 500 snapshots
        if len(TRAFFIC_HISTORY) > 500:
            TRAFFIC_HISTORY[:] = TRAFFIC_HISTORY[-500:]

        await _broadcast_update()


@app.on_event("startup")
async def startup_event():
    _init_mock_city()
    asyncio.create_task(_simulation_loop())


@app.get("/intersections", response_model=List[Intersection])
async def get_intersections():
    return list(INTERSECTIONS.values())


@app.post("/signal-update")
async def signal_update(req: SignalUpdateRequest):
    inter = INTERSECTIONS.get(req.intersection_id)
    if not inter:
        return {"status": "error", "message": "Intersection not found"}
    for lane in inter.lanes:
        if lane.lane_id == req.lane_id:
            lane.signal_color = "GREEN"
            lane.remaining_seconds = req.force_green_seconds
        else:
            lane.signal_color = "RED"
            lane.remaining_seconds = 0
    inter.congestion_level = max(l.density for l in inter.lanes)
    await _broadcast_update()
    return {"status": "ok"}


@app.get("/traffic-stats", response_model=List[TrafficStats])
async def get_traffic_stats(limit: int = 100):
    return TRAFFIC_HISTORY[-limit:]


def _neighbors(node_id: str) -> List[str]:
    # Very simple grid connectivity based on coordinates
    inter = INTERSECTIONS[node_id]
    neighbors = []
    for other in INTERSECTIONS.values():
        if other.id == node_id:
            continue
        if abs(other.x - inter.x) + abs(other.y - inter.y) == 1:
            neighbors.append(other.id)
    return neighbors


@app.post("/route-optimize", response_model=RouteResponse)
async def route_optimize(req: RouteRequest):
    """
    Compute a least-congested path on the mock grid using Dijkstra
    with edge cost equal to downstream intersection congestion.
    """
    start = req.start
    end = req.end
    if start not in INTERSECTIONS or end not in INTERSECTIONS:
        return RouteResponse(path=[], total_congestion_score=0.0)

    # Dijkstra over intersections
    unvisited = set(INTERSECTIONS.keys())
    dist: Dict[str, float] = {k: float("inf") for k in INTERSECTIONS}
    prev: Dict[str, Optional[str]] = {k: None for k in INTERSECTIONS}
    dist[start] = 0.0

    def congestion_score(intersection_id: str) -> float:
        inter = INTERSECTIONS[intersection_id]
        level = inter.congestion_level
        if level == DensityLevel.LOW:
            return 1.0
        if level == DensityLevel.MEDIUM:
            return 3.0
        return 6.0

    while unvisited:
        current = min(unvisited, key=lambda x: dist[x])
        unvisited.remove(current)
        if current == end or dist[current] == float("inf"):
            break
        for nb in _neighbors(current):
            if nb not in unvisited:
                continue
            alt = dist[current] + congestion_score(nb)
            if alt < dist[nb]:
                dist[nb] = alt
                prev[nb] = current

    path: List[str] = []
    cur: Optional[str] = end
    if prev[cur] is None and cur != start:
        return RouteResponse(path=[], total_congestion_score=0.0)
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return RouteResponse(path=path, total_congestion_score=dist[end])


@app.get("/incidents", response_model=List[Incident])
async def get_incidents():
    # Return most recent first
    return sorted(INCIDENTS, key=lambda i: i.created_at, reverse=True)


@app.post("/ingest-counts")
async def ingest_counts(payload: IngestCountsRequest = Body(...)):
    """
    Ingest external lane vehicle counts (e.g. from CV pipeline) for a
    specific intersection and broadcast the updated state to dashboards.
    """
    inter = INTERSECTIONS.get(payload.intersection_id)
    if not inter:
        return {"status": "error", "message": "Intersection not found"}

    # Update lane counts and densities from payload
    for lane in inter.lanes:
        if lane.lane_id in payload.counts_by_lane:
            lane.vehicle_count = max(0, int(payload.counts_by_lane[lane.lane_id]))
            lane.density = density_for_count(lane.vehicle_count)

    # Recompute congestion level
    inter.congestion_level = max(l.density for l in inter.lanes)

    # Optionally recompute the "top" GREEN lane based purely on ingested counts
    counts = {lane.lane_id: lane.vehicle_count for lane in inter.lanes}
    decision = compute_signal_plan(counts)
    for lane in inter.lanes:
        lane.signal_color = "RED"
        lane.remaining_seconds = 0
    if decision.lane_order:
        top = decision.lane_order[0]
        for lane in inter.lanes:
            if lane.lane_id == top.lane_id:
                lane.signal_color = "GREEN"
                lane.remaining_seconds = decision.timings[lane.lane_id]

    await _broadcast_update()
    return {"status": "ok"}


@app.websocket("/ws/traffic")
async def websocket_traffic(ws: WebSocket):
    await ws.accept()
    WS_CONNECTIONS.append(ws)
    try:
        while True:
            # We don't expect messages from the client, but keep the
            # connection alive by reading pings if needed.
            await ws.receive_text()
    except WebSocketDisconnect:
        if ws in WS_CONNECTIONS:
            WS_CONNECTIONS.remove(ws)

