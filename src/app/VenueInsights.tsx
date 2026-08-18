"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heatmap } from "@/app/dashboard/Heatmap";
import { TrendChart } from "@/app/dashboard/TrendChart";
import { PERIODS, type PeriodValue } from "@/lib/dashboard/period";
import type { AspectAverage, HeatmapGrid } from "@/lib/dashboard/heatmap";
import type { TrendPoint } from "@/lib/dashboard/trend";

// The period lives in the URL rather than component state so it survives a
// refresh, can be linked to a colleague, and — since the aggregation happens
// in SQL — is what the server actually queries on, not a client-side filter
// over rows already fetched.
function PeriodPicker({ period }: { period: PeriodValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    // Preserves ?partner= on the owner dashboard, where the venue switcher
    // uses the same query string.
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5 rounded-lg bg-line p-[3px]">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => select(p.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold ${
              period === p.value ? "bg-paper text-ink" : "text-slate"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {isPending && <span className="text-xs text-slate">Frissítés…</span>}
    </div>
  );
}

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
  trendSeries,
  alertMessage,
  totalSubmissions,
  period,
}: {
  aspectAverages: AspectAverage[];
  grids: Record<string, HeatmapGrid>;
  trendSeries: Record<string, TrendPoint[]>;
  alertMessage: string | null;
  totalSubmissions: number;
  period: PeriodValue;
}) {
  const [selectedAspect, setSelectedAspect] = useState(aspectAverages[0]?.key ?? "");
  // Several ways to read the same reviews, on purpose: the heatmap answers
  // "which day/hour is weak", the trend answers "is this getting better or
  // worse" — different questions, so a toggle rather than picking one.
  const [chartView, setChartView] = useState<"heatmap" | "trend">("heatmap");

  // `selectedAspect` is state, so it survives a venue switch (the owner's
  // VenueSwitcher navigates client-side to the same route) even though
  // `aspectAverages`/`grids` are now for a different venue — which can have a
  // different question set entirely. Falling back to the first available
  // aspect here (rather than trusting stale state) is what keeps Heatmap from
  // being handed an empty grid for a key that no longer exists.
  const activeAspect = aspectAverages.find((a) => a.key === selectedAspect) ?? aspectAverages[0];

  if (totalSubmissions === 0) {
    return (
      <>
        <PeriodPicker period={period} />
        {/* Distinguishes "nothing in this window" from "nothing ever" — without
            it, narrowing to 7 days on a quiet venue reads as data loss. */}
        <div className="rounded-xl border border-line bg-paper p-6 text-center text-sm text-slate">
          {period === "all"
            ? "Ehhez az egységhez még nem érkezett értékelés — amint az első vendég beküldi, itt fog megjelenni."
            : "Ebben az időszakban nem érkezett értékelés. Válassz hosszabb időszakot a fenti sávban."}
        </div>
      </>
    );
  }

  return (
    <>
      <PeriodPicker period={period} />

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-ink">
              {activeAspect?.label} — {chartView === "heatmap" ? "nap és óra szerint" : "időbeli alakulás"}
            </div>
            <div className="text-[11px] text-slate">
              {chartView === "heatmap"
                ? "A kiválasztott időszak értékelései hétköznap és napszak szerint összesítve."
                : "Ugyanezek az értékelések időrendben — javul vagy romlik ez a szempont?"}
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5 rounded-lg bg-line p-[3px]">
            {(
              [
                ["heatmap", "Hőtérkép"],
                ["trend", "Trend"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setChartView(k)}
                className={`rounded-md px-3 py-1 text-xs font-bold ${
                  chartView === k ? "bg-paper text-ink" : "text-slate"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {chartView === "heatmap" ? (
          <Heatmap grid={(activeAspect && grids[activeAspect.key]) ?? []} />
        ) : (
          <TrendChart points={(activeAspect && trendSeries[activeAspect.key]) ?? []} />
        )}
      </div>
    </>
  );
}
