"use client";

import { useState } from "react";
import { LogTable, type LogRow } from "./LogTable";
import { HelpPanel } from "@/app/HelpPanel";
import { VenueInsights } from "@/app/VenueInsights";
import { ownerHelpFaqs } from "@/lib/help-content";
import { periodLabel, type PeriodValue } from "@/lib/dashboard/period";
import type { AspectAverage, HeatmapGrid } from "@/lib/dashboard/heatmap";
import type { TrendPoint } from "@/lib/dashboard/trend";
import type { Suggestion } from "@/lib/dashboard/suggestions";

export function OwnerDashboardClient({
  aspectAverages,
  grids,
  hours,
  trendSeries,
  alertMessage,
  suggestion,
  totalSubmissions,
  logRows,
  aspects,
  period,
}: {
  aspectAverages: AspectAverage[];
  grids: Record<string, HeatmapGrid>;
  hours: number[];
  trendSeries: Record<string, TrendPoint[]>;
  alertMessage: string | null;
  suggestion: Suggestion | null;
  totalSubmissions: number;
  logRows: LogRow[];
  aspects: { key: string; label: string }[];
  period: PeriodValue;
}) {
  const [view, setView] = useState<"overview" | "log" | "help">("overview");

  return (
    <div>
      {/* Names the window explicitly: this count now moves when the period
          changes, and an unqualified "43 értékelés összesen" would read as a
          total and look like reviews had gone missing. */}
      <div className="mb-5 text-sm text-slate">
        {totalSubmissions} értékelés
        {period === "all" ? " összesen" : ` — ${periodLabel(period).toLowerCase()}`}
      </div>

      <div className="mb-5 flex w-fit gap-1.5 rounded-lg bg-line p-[3px]">
        {(
          [
            ["overview", "Áttekintés"],
            ["log", "Napló"],
            ["help", "Súgó"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`rounded-md px-4 py-1.5 text-xs font-bold ${view === k ? "bg-paper text-ink" : "text-slate"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {view === "help" ? (
        <HelpPanel faqs={ownerHelpFaqs} />
      ) : view === "log" ? (
        <LogTable rows={logRows} aspects={aspects} />
      ) : (
        // Aspect tiles + alert + heatmap live in VenueInsights so the admin
        // venue detail page renders the exact same panel from the same code.
        <VenueInsights
          period={period}
          aspectAverages={aspectAverages}
          grids={grids}
          hours={hours}
          trendSeries={trendSeries}
          alertMessage={alertMessage}
          suggestion={suggestion}
          totalSubmissions={totalSubmissions}
        />
      )}
    </div>
  );
}
