"use client";

import { useMemo, useState } from "react";
import { formatSubmissionId } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { formatBudapestTimestamp as fmtTs } from "@/lib/timezone";

export type LogRow = {
  id: string;
  createdAt: string;
  scores: Record<string, number>;
  reasons: Record<string, string>;
};

type Aspect = { key: string; label: string };

export function LogTable({ rows, aspects }: { rows: LogRow[]; aspects: Aspect[] }) {
  const [dateRange, setDateRange] = useState<"1" | "7" | "30" | "all">("7");
  const [minScore, setMinScore] = useState<"all" | "low" | "high">("all");
  // Fixed at mount rather than read fresh per render/filter change: "how many
  // days ago" only needs to be approximately right, and reading Date.now()
  // during render trips the react-hooks/purity rule.
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const daysAgo = (now - new Date(r.createdAt).getTime()) / 86_400_000;
      if (dateRange === "1" && daysAgo > 1) return false;
      if (dateRange === "7" && daysAgo > 7) return false;
      if (dateRange === "30" && daysAgo > 30) return false;
      if (minScore !== "all") {
        const vals = Object.values(r.scores);
        const worst = vals.length ? Math.min(...vals) : 10;
        if (minScore === "low" && worst >= 6) return false;
        if (minScore === "high" && worst < 6) return false;
      }
      if (q && !formatSubmissionId(r.id).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, dateRange, minScore, now, search]);

  const exportCsv = () => {
    downloadCsv(
      `guestly-naplo-${new Date().toISOString().slice(0, 10)}.csv`,
      ["szavazat_id", "idopont", ...aspects.map((a) => a.key), "indoklas"],
      filtered.map((r) => [
        formatSubmissionId(r.id),
        fmtTs(r.createdAt),
        ...aspects.map((a) => r.scores[a.key] ?? ""),
        Object.values(r.reasons).join(" | "),
      ]),
    );
  };

  const selectClass = "h-9 rounded-lg border border-line bg-paper px-2.5 text-xs text-ink";

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Keresés szavazat ID szerint…"
        className="mb-2.5 h-9 w-full rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none"
      />
      <div className="mb-3.5 flex flex-wrap gap-2">
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value as typeof dateRange)} className={selectClass}>
          <option value="1">Elmúlt 24 óra</option>
          <option value="7">Elmúlt 7 nap</option>
          <option value="30">Elmúlt 30 nap</option>
          <option value="all">Összes</option>
        </select>
        <select value={minScore} onChange={(e) => setMinScore(e.target.value as typeof minScore)} className={selectClass}>
          <option value="all">Minden pontszám</option>
          <option value="low">Van gyenge szempont (&lt;6)</option>
          <option value="high">Csak erős értékelések (6+)</option>
        </select>
        <button onClick={exportCsv} className="h-9 rounded-lg border border-line px-3.5 text-xs font-bold text-ink">
          Exportálás (CSV)
        </button>
        <div className="ml-auto self-center text-xs text-slate">{filtered.length} találat</div>
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[780px] border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-10 bg-mist text-left">
              <th className="whitespace-nowrap px-3 py-2 font-bold text-slate">Szavazat ID</th>
              <th className="whitespace-nowrap px-3 py-2 font-bold text-slate">Időpont</th>
              {aspects.map((a) => (
                <th key={a.key} className="w-[110px] px-3 py-2 text-center font-bold text-slate">
                  {a.label}
                </th>
              ))}
              <th className="px-3 py-2 font-bold text-slate">Indoklás</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const reasonEntries = Object.entries(r.reasons);
              return (
                <tr key={r.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] font-bold text-violet">{formatSubmissionId(r.id)}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate">{fmtTs(r.createdAt)}</td>
                  {aspects.map((a) => (
                    <td
                      key={a.key}
                      className="px-3 py-2 text-center font-bold"
                      style={{ color: r.scores[a.key] < 6 ? "var(--color-magenta)" : "var(--color-ink)" }}
                    >
                      {r.scores[a.key] ?? "—"}
                    </td>
                  ))}
                  <td className="max-w-[220px] px-3 py-2 text-[11.5px] text-ink">
                    {reasonEntries.length
                      ? reasonEntries.map(([k, txt]) => (
                          <div key={k} className="mb-0.5">
                            <span className="font-bold text-magenta">{aspects.find((a) => a.key === k)?.label}:</span> {txt}
                          </div>
                        ))
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={aspects.length + 3} className="px-3 py-6 text-center text-slate">
                  Nincs a szűrésnek megfelelő értékelés.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
