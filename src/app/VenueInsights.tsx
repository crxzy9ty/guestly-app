"use client";

import { useState } from "react";
import { Heatmap } from "@/app/dashboard/Heatmap";
import type { AspectAverage, HeatmapGrid } from "@/lib/dashboard/heatmap";

// The per-venue "what is actually happening here" panel: one tile per aspect,
// the weak-spot alert, and the selected aspect's weekday x hour heatmap.
//
// Shared deliberately between the owner dashboard and the admin venue detail
// page. An admin supporting a partner over the phone needs to see the SAME
// numbers the partner is looking at — two separate implementations of this
// would drift, and a support conversation is exactly when that hurts.
export function VenueInsights({
  aspectAverages,
  grids,
  alertMessage,
  totalSubmissions,
}: {
  aspectAverages: AspectAverage[];
  grids: Record<string, HeatmapGrid>;
  alertMessage: string | null;
  totalSubmissions: number;
}) {
  const [selectedAspect, setSelectedAspect] = useState(aspectAverages[0]?.key ?? "");

  // `selectedAspect` is state, so it survives a venue switch (the owner's
  // VenueSwitcher navigates client-side to the same route) even though
  // `aspectAverages`/`grids` are now for a different venue — which can have a
  // different question set entirely. Falling back to the first available
  // aspect here (rather than trusting stale state) is what keeps Heatmap from
  // being handed an empty grid for a key that no longer exists.
  const activeAspect = aspectAverages.find((a) => a.key === selectedAspect) ?? aspectAverages[0];

  if (totalSubmissions === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper p-6 text-center text-sm text-slate">
        Ehhez az egységhez még nem érkezett értékelés — amint az első vendég beküldi, itt fog
        megjelenni.
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-2.5">
        {aspectAverages.map((a) => (
          <button
            key={a.key}
            onClick={() => setSelectedAspect(a.key)}
            className="rounded-xl border-2 bg-paper p-3.5 text-left"
            style={{ borderColor: activeAspect?.key === a.key ? "var(--color-violet)" : "transparent" }}
          >
            <div className="mb-1 text-xs text-slate">
              {a.icon} {a.label}
            </div>
            <div
              className="text-xl font-bold tracking-tight"
              style={{ color: a.avg !== null && a.avg < 6.5 ? "var(--color-magenta)" : "var(--color-ink)" }}
            >
              {a.avg !== null ? a.avg.toFixed(1) : "—"}
            </div>
          </button>
        ))}
      </div>

      {alertMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-ink p-4 text-white">
          <span className="text-lg">⚠</span>
          <div className="text-sm leading-relaxed">{alertMessage}</div>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-paper p-4">
        <div className="mb-3 text-sm font-bold text-ink">{activeAspect?.label} — nap és óra szerint</div>
        <Heatmap grid={(activeAspect && grids[activeAspect.key]) ?? []} />
      </div>
    </>
  );
}
