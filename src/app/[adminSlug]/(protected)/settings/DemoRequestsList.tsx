"use client";

import { useMemo, useState, useTransition } from "react";
import { updateDemoRequestStatus } from "@/app/actions/content";
import { downloadCsv } from "@/lib/csv";

export type DemoRequestRow = {
  id: string;
  name: string;
  email: string;
  business: string;
  message: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

function fmtTs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}.`;
}

export function DemoRequestsList({ adminSlug, requests }: { adminSlug: string; requests: DemoRequestRow[] }) {
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => [r.name, r.business, r.email].join(" ").toLowerCase().includes(q));
  }, [requests, search]);

  const exportCsv = () => {
    downloadCsv(
      `fydback-demo-keresek-${new Date().toISOString().slice(0, 10)}.csv`,
      ["nev", "email", "vallalkozas", "uzenet", "statusz", "datum"],
      filtered.map((r) => [r.name, r.email, r.business, r.message, r.status, fmtTs(r.created_at)]),
    );
  };

  if (requests.length === 0) {
    return <div className="rounded-xl border border-line bg-paper p-5 text-center text-sm text-slate">Még nincs demó-kérés.</div>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés név, vállalkozás vagy e-mail szerint…"
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none"
        />
        <button onClick={exportCsv} className="h-9 rounded-lg border border-line px-3.5 text-xs font-bold text-ink">
          Exportálás (CSV)
        </button>
      </div>

      <div className="grid max-h-[65vh] gap-2.5 overflow-auto">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border border-line bg-paper p-4">
            <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-ink">
                  {r.name} — {r.business}
                </div>
                <div className="text-xs text-slate">
                  {r.email} · {fmtTs(r.created_at)}
                </div>
              </div>
              <select
                defaultValue={r.status}
                onChange={(e) =>
                  startTransition(() => {
                    updateDemoRequestStatus(adminSlug, r.id, e.target.value as DemoRequestRow["status"]);
                  })
                }
                className="h-8 rounded-lg border border-line bg-paper px-2 text-xs text-ink"
              >
                <option value="new">Új</option>
                <option value="contacted">Felvéve a kapcsolat</option>
                <option value="closed">Lezárva</option>
              </select>
            </div>
            {r.message && <p className="text-[13px] leading-relaxed text-ink">{r.message}</p>}
          </div>
        ))}
        {filtered.length === 0 && <div className="rounded-xl border border-line bg-paper p-5 text-center text-sm text-slate">Nincs a keresésnek megfelelő demó-kérés.</div>}
      </div>
    </div>
  );
}
