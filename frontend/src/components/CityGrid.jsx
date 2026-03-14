import React from "react";

const densityColor = (density) => {
  if (density === "HIGH") return "bg-red-500/80 shadow-red-500/60";
  if (density === "MEDIUM") return "bg-neonAmber/80 shadow-neonAmber/60";
  return "bg-neonGreen/80 shadow-neonGreen/60";
};

export default function CityGrid({ intersections, selectedId, onSelect }) {
  if (!intersections.length) {
    return <div className="text-xs text-slate-500">Loading simulation…</div>;
  }

  const maxX = Math.max(...intersections.map((i) => i.x));
  const maxY = Math.max(...intersections.map((i) => i.y));

  const grid = Array.from({ length: maxY + 1 }, (_, y) =>
    Array.from({ length: maxX + 1 }, (_, x) =>
      intersections.find((i) => i.x === x && i.y === y) || null
    )
  );

  return (
    <div className="relative">
      <div className="grid gap-4"
           style={{
             gridTemplateColumns: `repeat(${maxX + 1}, minmax(0, 1fr))`
           }}>
        {grid.flat().map((cell, idx) =>
          cell ? (
            <button
              key={cell.id}
              onClick={() => onSelect?.(cell)}
              className={`relative h-28 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900/90 
                          flex flex-col items-center justify-center overflow-hidden transition
                          hover:border-neonGreen/60 hover:shadow-lg hover:shadow-emerald-600/40
                          ${
                            selectedId === cell.id
                              ? "ring-2 ring-neonGreen/80 border-neonGreen/70"
                              : ""
                          }`}
            >
              <div
                className={`absolute w-3 h-3 rounded-full shadow-lg ${densityColor(
                  cell.congestion_level
                )}`}
                style={{ top: 10, right: 10 }}
              />
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">
                {cell.id}
              </div>
              <div className="text-xs font-semibold text-slate-100 mb-1">
                {cell.name}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-400">
                {cell.lanes.map((lane) => (
                  <span key={lane.lane_id} className="flex items-center gap-1">
                    <span className="font-mono text-[9px] text-slate-500">
                      {lane.lane_id}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        lane.signal_color === "GREEN"
                          ? "bg-neonGreen"
                          : lane.signal_color === "RED"
                          ? "bg-red-500"
                          : "bg-neonAmber"
                      }`}
                    />
                    <span className="text-[9px] text-slate-400">
                      {lane.vehicle_count}
                    </span>
                  </span>
                ))}
              </div>
            </button>
          ) : (
            <div key={idx} className="h-28" />
          )
        )}
      </div>
    </div>
  );
}

