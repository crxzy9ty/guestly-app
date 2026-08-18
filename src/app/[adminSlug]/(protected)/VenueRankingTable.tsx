"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { downloadCsv } from "@/lib/csv";

export type VenueStat = {
  id: string;
  name: string;
  avgScore: number | null;
  reviewCount: number;
  prizeCount: number;
  worstAspectLabel: string | null;
  worstAspectAvg: number | null;
};

export function VenueRankingTable({ stats, adminSlug }: { stats: VenueStat[]; adminSlug: string }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stats;
    return stats.filter((s) => s.name.toLowerCase().includes(q));
  }, [stats, search]);

  const exportCsv = () => {
    downloadCsv(
      `fydback-rangsor-${new Date().toISOString().slice(0, 10)}.csv`,
      ["egyseg", "atlag", "ertekelesek", "sorsolasra_jelentkezett", "leggyengebb_szempont"],
      filtered.map((s) => [
        s.name,
        s.avgScore?.toFixed(1) ?? "",
        s.reviewCount,
        s.prizeCount,
        s.worstAspectLabel ? `${s.worstAspectLabel} (${s.worstAspectAvg?.toFixed(1)})` : "",
      ]),
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés egység neve szerint…"
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none"
        />
        <button onClick={exportCsv} className="h-9 rounded-lg border border-line px-3.5 text-xs font-bold text-ink">
          Exportálás (CSV)
        </button>
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[560px] border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-10 bg-mist text-left">
              <th className="px-3 py-2 font-bold text-slate">Egység</th>
              <th className="px-3 py-2 text-center font-bold text-slate">Átlag</th>
              <th className="px-3 py-2 text-center font-bold text-slate">Értékelések</th>
              <th className="px-3 py-2 text-center font-bold text-slate">Sorsolásra jelentkezett</th>
              <th className="px-3 py-2 font-bold text-slate">Leggyengébb szempont</th>
              <th className="px-3 py-2 font-bold text-slate"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-3 py-2 font-bold text-ink">{s.name}</td>
                <td className="px-3 py-2 text-center font-bold text-ink">{s.avgScore?.toFixed(1) ?? "—"}</td>
                <td className="px-3 py-2 text-center text-slate">{s.reviewCount}</td>
                <td className="px-3 py-2 text-center text-slate">{s.prizeCount}</td>
                <td className="px-3 py-2 text-slate">
                  {s.worstAspectLabel ? `${s.worstAspectLabel} (${s.worstAspectAvg?.toFixed(1)})` : "—"}
                </td>
                {/* An explicit link rather than a click handler on the row: it
                    is keyboard-reachable, middle-clickable, and visibly a
                    link, none of which a clickable <tr> gives for free. */}
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <Link href={`/${adminSlug}/venue/${s.id}`} className="font-bold text-violet">
                    Részletek →
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate">
                  Nincs a keresésnek megfelelő egység.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
