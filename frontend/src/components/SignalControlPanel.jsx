import React from "react";

const densityBadge = (density) => {
  if (density === "HIGH")
    return "bg-red-900/60 text-red-300 border-red-500/60";
  if (density === "MEDIUM")
    return "bg-amber-900/60 text-amber-200 border-amber-500/60";
  return "bg-emerald-900/60 text-emerald-200 border-emerald-500/60";
};

export default function SignalControlPanel({ intersection, onForceGreen }) {
  if (!intersection) {
    return (
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
          AI Signal Control
        </h2>
        <p className="text-xs text-slate-500">
          Select an intersection on the map to view AI decisions and manually
          override signals.
        </p>
      </div>
    );
  }

  const handleOverride = (laneId, seconds) => {
    onForceGreen?.(intersection.id, laneId, seconds);
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-emerald-900/40">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            AI Signal Control
          </h2>
          <div className="text-sm text-slate-100">{intersection.name}</div>
        </div>
        <span
          className={`px-2 py-1 rounded-full border text-[10px] font-mono ${densityBadge(
            intersection.congestion_level
          )}`}
        >
          {intersection.congestion_level} LOAD
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {intersection.lanes.map((lane) => (
          <div
            key={lane.lane_id}
            className="flex items-center justify-between text-xs py-2 px-2 rounded-lg bg-slate-900/80 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-[11px] font-mono text-slate-400">
                {lane.lane_id}
              </span>
              <span className="text-[11px] text-slate-300">
                {lane.vehicle_count} vehicles
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full border ${densityBadge(
                  lane.density
                )}`}
              >
                {lane.density}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    lane.signal_color === "GREEN"
                      ? "bg-neonGreen"
                      : lane.signal_color === "RED"
                      ? "bg-red-500"
                      : "bg-neonAmber"
                  }`}
                />
                {lane.signal_color}
              </span>
              <button
                onClick={() => handleOverride(lane.lane_id, 30)}
                className="px-2 py-1 rounded-md bg-emerald-600/80 hover:bg-emerald-500 text-[10px] text-slate-950 font-semibold"
              >
                Force GREEN 30s
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2">
        Admin overrides are logged in the backend as AI decisions with reason
        <span className="font-mono text-neonAmber"> "manual_override"</span>.
      </div>
    </div>
  );
}

