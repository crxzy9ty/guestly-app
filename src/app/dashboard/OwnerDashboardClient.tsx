"use client";

import { useState } from "react";
import { LogTable, type LogRow } from "./LogTable";
import { HelpPanel } from "@/app/HelpPanel";
import { VenueInsights } from "@/app/VenueInsights";
import { ownerHelpFaqs } from "@/lib/help-content";
import type { AspectAverage, HeatmapGrid } from "@/lib/dashboard/heatmap";

export function OwnerDashboardClient({
  aspectAverages,
  grids,
  alertMessage,
  totalSubmissions,
  logRows,
  aspects,
}: {
  aspectAverages: AspectAverage[];
  grids: Record<string, HeatmapGrid>;
  alertMessage: string | null;
  totalSubmissions: number;
  logRows: LogRow[];
  aspects: { key: string; label: string }[];
}) {
  const [view, setView] = useState<"overview" | "log" | "help">("overview");

  return (
    <div>
      <div className="mb-5 text-sm text-slate">{totalSubmissions} értékelés összesen</div>

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
          aspectAverages={aspectAverages}
          grids={grids}
          alertMessage={alertMessage}
          totalSubmissions={totalSubmissions}
        />
      )}
    </div>
  );
}
