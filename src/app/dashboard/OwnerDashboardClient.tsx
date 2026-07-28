"use client";

import { useState } from "react";
import { Heatmap } from "./Heatmap";
import { LogTable, type LogRow } from "./LogTable";
import { HelpPanel } from "@/app/HelpPanel";
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
  const [selectedAspect, setSelectedAspect] = useState(aspectAverages[0]?.key ?? "");

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
      ) : totalSubmissions === 0 ? (
        <div className="rounded-xl border border-line bg-paper p-6 text-center text-sm text-slate">
          Ehhez az egységhez még nem érkezett értékelés — amint az első vendég beküldi, itt fog
          megjelenni.
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-2.5">
            {aspectAverages.map((a) => (
              <button
                key={a.key}
                onClick={() => setSelectedAspect(a.key)}
                className="rounded-xl border-2 bg-paper p-3.5 text-left"
                style={{ borderColor: selectedAspect === a.key ? "var(--color-violet)" : "transparent" }}
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
            <div className="mb-3 text-sm font-bold text-ink">
              {aspectAverages.find((a) => a.key === selectedAspect)?.label} — heti bontás
            </div>
            <Heatmap grid={grids[selectedAspect] ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
