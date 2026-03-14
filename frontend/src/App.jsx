import React, { useEffect, useMemo, useState } from "react";
import CityGrid from "./components/CityGrid";
import SignalControlPanel from "./components/SignalControlPanel";
import TrafficCharts from "./components/TrafficCharts";
import IncidentSidebar from "./components/IncidentSidebar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function App() {
  const [intersections, setIntersections] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [stats, setStats] = useState([]);

  // Initial fetch
  useEffect(() => {
    const load = async () => {
      const [interRes, statsRes, incRes] = await Promise.all([
        fetch(`${API_BASE}/intersections`),
        fetch(`${API_BASE}/traffic-stats`),
        fetch(`${API_BASE}/incidents`)
      ]);
      setIntersections(await interRes.json());
      setStats(await statsRes.json());
      setIncidents(await incRes.json());
    };
    load().catch(console.error);
  }, []);

  // WebSocket for live updates
  useEffect(() => {
    const wsUrl = API_BASE.replace("http", "ws") + "/ws/traffic";
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "traffic_update") {
        setIntersections(data.intersections || []);
        setIncidents(data.incidents || []);
      }
    };
    return () => ws.close();
  }, []);

  const handleForceGreen = async (intersectionId, laneId, seconds) => {
    await fetch(`${API_BASE}/signal-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intersection_id: intersectionId,
        lane_id: laneId,
        force_green_seconds: seconds
      })
    });
  };

  const totalVehicles = useMemo(() => {
    if (!intersections.length) return 0;
    return intersections.reduce(
      (acc, i) =>
        acc +
        i.lanes.reduce((lnAcc, ln) => {
          return lnAcc + ln.vehicle_count;
        }, 0),
      0
    );
  }, [intersections]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neonGreen tracking-wide">
              AI-Based Smart Traffic Management
            </h1>
            <p className="text-xs text-slate-400">
              Real-time adaptive signal control • Simulation mode
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/50">
              Simulation: <span className="text-neonGreen font-mono">ACTIVE</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700">
              Total vehicles:{" "}
              <span className="font-mono text-neonAmber">{totalVehicles}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 grid grid-cols-12 gap-4">
        <section className="col-span-8 flex flex-col gap-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-emerald-900/30">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-[0.2em]">
                City Grid
              </h2>
              <span className="text-[10px] text-slate-500">
                Click an intersection to inspect details
              </span>
            </div>
            <CityGrid
              intersections={intersections}
              selectedId={selectedIntersection?.id}
              onSelect={setSelectedIntersection}
            />
          </div>

          <TrafficCharts intersections={intersections} stats={stats} />
        </section>

        <section className="col-span-4 flex flex-col gap-4">
          <SignalControlPanel
            intersection={selectedIntersection}
            onForceGreen={handleForceGreen}
          />
          <IncidentSidebar incidents={incidents} />
        </section>
      </main>
    </div>
  );
}

