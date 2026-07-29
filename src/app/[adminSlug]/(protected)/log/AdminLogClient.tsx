"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { drawTodayWinner, type DrawResult } from "@/app/actions/draw";
import { formatSubmissionId } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { formatBudapestTimestamp as fmtTs } from "@/lib/timezone";

export type AdminLogRow = {
  id: string;
  createdAt: string;
  venue: string;
  email: string | null;
  prizeId: string | null;
  winnerId: string | null;
  scores: Record<string, number>;
  reasons: Record<string, string>;
};

type Aspect = { key: string; label: string };

const selectClass = "h-9 rounded-lg border border-line bg-paper px-2.5 text-xs text-ink";

export function AdminLogClient({
  adminSlug,
  partners,
  selectedPartnerId,
  aspects,
  rows,
}: {
  adminSlug: string;
  partners: { id: string; name: string }[];
  selectedPartnerId: string | null;
  aspects: Aspect[];
  rows: AdminLogRow[];
}) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<"1" | "7" | "30" | "all">("7");
  const [onlyPrize, setOnlyPrize] = useState(false);
  const [minScore, setMinScore] = useState<"all" | "low" | "high">("all");
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [isDrawing, startDraw] = useTransition();
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const daysAgo = (now - new Date(r.createdAt).getTime()) / 86_400_000;
      if (dateRange === "1" && daysAgo > 1) return false;
      if (dateRange === "7" && daysAgo > 7) return false;
      if (dateRange === "30" && daysAgo > 30) return false;
      if (onlyPrize && !r.prizeId) return false;
      if (minScore !== "all") {
        const vals = Object.values(r.scores);
        const worst = vals.length ? Math.min(...vals) : 10;
        if (minScore === "low" && worst >= 6) return false;
        if (minScore === "high" && worst < 6) return false;
      }
      if (q) {
        const haystack = [formatSubmissionId(r.id), r.prizeId, r.email, r.venue].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, dateRange, onlyPrize, minScore, now, search]);

  const selectedPartnerName = partners.find((p) => p.id === selectedPartnerId)?.name ?? null;

  const exportCsv = () => {
    downloadCsv(
      `guestly-naplo-${new Date().toISOString().slice(0, 10)}.csv`,
      ["szavazat_id", "sorsolas_id", "email", "egyseg", "idopont", ...aspects.map((a) => a.key), "indoklas"],
      filtered.map((r) => [
        formatSubmissionId(r.id),
        r.prizeId,
        r.email,
        r.venue,
        fmtTs(r.createdAt),
        ...aspects.map((a) => r.scores[a.key] ?? ""),
        Object.values(r.reasons).join(" | "),
      ]),
    );
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Keresés szavazat ID, sorsolás ID, e-mail vagy egység szerint…"
        className="mb-2.5 h-9 w-full rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none"
      />
      <div className="mb-3.5 flex flex-wrap gap-2">
        <select
          value={selectedPartnerId ?? "all"}
          onChange={(e) => {
            setDrawResult(null);
            const val = e.target.value;
            router.push(val === "all" ? `/${adminSlug}/log` : `/${adminSlug}/log?partner=${val}`);
          }}
          className={selectClass}
        >
          <option value="all">Összes egység</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
        <button
          onClick={() => setOnlyPrize((v) => !v)}
          className="h-9 rounded-lg px-3 text-xs font-bold"
          style={{
            border: onlyPrize ? "1px solid var(--color-ink)" : "1px solid var(--color-line)",
            background: onlyPrize ? "var(--color-ink)" : "var(--color-paper)",
            color: onlyPrize ? "#fff" : "var(--color-ink)",
          }}
        >
          Csak sorsolásra jelentkezettek
        </button>
        <button onClick={exportCsv} className="h-9 rounded-lg border border-line px-3.5 text-xs font-bold text-ink">
          Exportálás (CSV)
        </button>
        <div className="ml-auto self-center text-xs text-slate">{filtered.length} találat</div>
      </div>

      {selectedPartnerId && (
        <div className="mb-4 rounded-xl border border-line bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <div className="text-sm font-bold text-ink">Napi sorsolás — {selectedPartnerName}</div>
              <div className="text-[11.5px] text-slate">
                Csak az ehhez az egységhez, az elmúlt 24 órában beérkezett jelentkezők közül sorsol.
              </div>
            </div>
            <button
              disabled={isDrawing}
              onClick={() =>
                startDraw(async () => {
                  setDrawResult(await drawTodayWinner(adminSlug, selectedPartnerId));
                })
              }
              className="h-9 rounded-lg bg-ink px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {isDrawing ? "Sorsolás…" : "🎲 Mai nyertes sorsolása"}
            </button>
          </div>
          {drawResult && (
            <div className="mt-3 border-t border-line pt-3 text-xs">
              {drawResult.ok && drawResult.winner ? (
                <span className="text-ink">
                  {drawResult.alreadyDrawn ? "Ma már kisorsoltuk a nyertest: " : "✓ Nyertes: "}
                  <span className="font-bold text-violet">{drawResult.winner.winnerId}</span>
                  {drawResult.winner.email && <> — <strong>{drawResult.winner.email}</strong></>}
                </span>
              ) : drawResult.ok ? (
                <span className="text-slate">Nincs ma jelentkező ehhez az egységhez — nincs kit sorsolni.</span>
              ) : (
                <span className="text-magenta">Hiba történt a sorsolás közben, próbáld újra.</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="max-h-[65vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[1080px] border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-10 bg-mist text-left">
              <th className="whitespace-nowrap px-3 py-2 font-bold text-slate">Szavazat ID</th>
              <th className="whitespace-nowrap px-3 py-2 font-bold text-slate">Sorsolás ID</th>
              <th className="whitespace-nowrap px-3 py-2 font-bold text-slate">E-mail</th>
              {!selectedPartnerId && <th className="whitespace-nowrap px-3 py-2 font-bold text-slate">Egység</th>}
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
                  <td className="whitespace-nowrap px-3 py-2 font-mono font-bold text-violet">{formatSubmissionId(r.id)}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-ink">
                    {r.prizeId ?? "—"}
                    {r.winnerId && (
                      <span className="ml-1.5 rounded-full bg-[#E8F5EE] px-1.5 py-0.5 text-[10px] font-bold text-green">
                        🎉 nyertes
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink">{r.email ?? "—"}</td>
                  {!selectedPartnerId && <td className="whitespace-nowrap px-3 py-2 text-ink">{r.venue}</td>}
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
                <td colSpan={aspects.length + (selectedPartnerId ? 5 : 6)} className="px-3 py-6 text-center text-slate">
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
