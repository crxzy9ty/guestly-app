"use client";

import { useMemo, useState, useTransition } from "react";
import { markPartnerMessageRead } from "@/app/actions/partner-messages";

export type PartnerMessageRow = {
  id: string;
  partnerName: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function fmtTs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PartnerMessagesList({ adminSlug, messages }: { adminSlug: string; messages: PartnerMessageRow[] }) {
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => [m.partnerName, m.message].join(" ").toLowerCase().includes(q));
  }, [messages, search]);

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper p-5 text-center text-sm text-slate">
        Még nem küldött üzenetet egyik partner sem.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés egység vagy üzenet szövege szerint…"
          className="h-9 w-full max-w-sm rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none"
        />
      </div>

      <div className="grid max-h-[65vh] gap-2.5 overflow-auto">
        {filtered.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl border p-4 ${m.is_read ? "border-line bg-paper" : "border-violet bg-paper"}`}
          >
            <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-ink">{m.partnerName}</div>
                <div className="text-xs text-slate">{fmtTs(m.created_at)}</div>
              </div>
              <button
                onClick={() =>
                  startTransition(() => {
                    markPartnerMessageRead(adminSlug, m.id, !m.is_read);
                  })
                }
                className={`h-8 shrink-0 rounded-lg px-3 text-xs font-bold ${
                  m.is_read ? "border border-line text-slate" : "bg-violet text-white"
                }`}
              >
                {m.is_read ? "Olvasottnak jelölve" : "Olvasottnak jelölés"}
              </button>
            </div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{m.message}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-line bg-paper p-5 text-center text-sm text-slate">
            Nincs a keresésnek megfelelő üzenet.
          </div>
        )}
      </div>
    </div>
  );
}
