import React from "react";

export default function IncidentSidebar({ incidents }) {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Incidents & Alerts
        </h2>
        <span className="text-[10px] text-slate-500">
          {incidents?.length || 0} active
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 text-xs">
        {!incidents?.length && (
          <div className="text-slate-500 text-[11px]">
            No active incidents. Network operating nominally.
          </div>
        )}
        {incidents?.map((inc) => (
          <div
            key={inc.id}
            className="border border-red-500/40 bg-red-950/40 rounded-lg px-3 py-2"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-red-300">
                {inc.level}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {new Date(inc.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
            <div className="text-[11px] text-slate-100 mb-1">
              {inc.message}
            </div>
            <div className="text-[10px] text-slate-400">
              Intersection: <span className="font-mono">{inc.intersection_id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

