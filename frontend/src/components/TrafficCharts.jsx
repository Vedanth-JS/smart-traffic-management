import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export default function TrafficCharts({ intersections, stats }) {
  const laneSeries = useMemo(() => {
    const latest = intersections || [];
    const nowLabel = "now";
    const entries = [];
    latest.forEach((i) => {
      i.lanes.forEach((lane) => {
        entries.push({
          intersection: i.id,
          lane: lane.lane_id,
          time: nowLabel,
          vehicles: lane.vehicle_count
        });
      });
    });
    return entries;
  }, [intersections]);

  const historySeries = useMemo(() => {
    return (stats || []).map((s) => ({
      time: new Date(s.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      total: s.total_vehicles
    }));
  }, [stats]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
          Vehicle Flow (Now)
        </h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={laneSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="intersection" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #1f2937",
                  fontSize: 11
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="vehicles"
                stroke="#22c55e"
                dot={false}
                name="Vehicles per lane"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
          Total Volume Over Time
        </h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historySeries}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #1f2937",
                  fontSize: 11
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#trafficGradient)"
                name="Total vehicles"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

