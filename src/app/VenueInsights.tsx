"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heatmap } from "@/app/dashboard/Heatmap";
import { TrendChart } from "@/app/dashboard/TrendChart";
import { PERIODS, type PeriodValue } from "@/lib/dashboard/period";
import { heatColor, type AspectAverage, type HeatmapGrid } from "@/lib/dashboard/heatmap";
import type { TrendPoint } from "@/lib/dashboard/trend";
import { scoreTierLabel } from "@/lib/dashboard/severity";
import type { Suggestion } from "@/lib/dashboard/suggestions";

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
  hours,
  trendSeries,
  alertMessage,
  suggestion,
  totalSubmissions,
  period,
}: {
  aspectAverages: AspectAverage[];
  grids: Record<string, HeatmapGrid>;
  hours: number[];
  trendSeries: Record<string, TrendPoint[]>;
  alertMessage: string | null;
  suggestion: Suggestion | null;
  totalSubmissions: number;
  period: PeriodValue;
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
        <div className="mb-2.5 flex items-start gap-2.5 rounded-xl bg-ink p-4 text-white">
          <span className="text-lg">⚠</span>
          <div className="text-sm leading-relaxed">{alertMessage}</div>
        </div>
      )}

      {/* Rule-based, not measured — the "Javaslat" pill and the distinct
          (bordered, not solid-ink) styling exist so this never reads as
          another data point next to the alert above it. The severity badge
          uses the same heatColor() the heatmap/trend dots use, so the same
          score reads as the same color everywhere in the app — it's an
          absolute 1-10 read (src/lib/dashboard/severity.ts), not relative to
          this partner's own alert_threshold, so it means the same thing no
          matter how strict a given partner's threshold is set. */}
      {suggestion && (
        <div className="mb-5 rounded-xl border border-line bg-paper p-4">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-block rounded-full bg-violet px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Javaslat
            </span>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: heatColor(suggestion.avg),
                color: suggestion.avg < 5 ? "#fff" : "var(--color-ink)",
              }}
            >
              {scoreTierLabel(suggestion.avg)}
            </span>
          </div>
          <div className="text-sm leading-relaxed text-ink">{suggestion.text}</div>
        </div>
      )}

      {/* Trend sits above the heatmap, both always visible, rather than a
          toggle between them — the two answer different questions ("is this
          getting better or worse" vs. "which day/hour is weak"), and showing
          both at once reads as a richer view of the same data instead of
          hiding one behind a click. */}
      <div className="mb-4 rounded-2xl border border-line bg-paper p-4">
        <div className="mb-3">
          <div className="text-sm font-bold text-ink">{activeAspect?.label} — időbeli alakulás</div>
          <div className="text-[11px] text-slate">
            Ugyanezek az értékelések időrendben — javul vagy romlik ez a szempont?
          </div>
        </div>
        <TrendChart points={(activeAspect && trendSeries[activeAspect.key]) ?? []} />
      </div>

      <div className="rounded-2xl border border-line bg-paper p-4">
        <div className="mb-3">
          <div className="text-sm font-bold text-ink">{activeAspect?.label} — nap és óra szerint</div>
          <div className="text-[11px] text-slate">
            A kiválasztott időszak értékelései hétköznap és napszak szerint összesítve.
          </div>
        </div>
        <Heatmap grid={(activeAspect && grids[activeAspect.key]) ?? []} hours={hours} />
      </div>
    </>
  );
}
