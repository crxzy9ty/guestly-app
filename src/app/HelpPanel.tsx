"use client";

import { useState } from "react";
import type { HelpFaq } from "@/lib/help-content";

function HelpItem({ q, a }: HelpFaq) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="text-sm font-bold text-ink">{q}</span>
        <span className="ml-3 shrink-0 text-lg text-slate">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4 text-[13px] leading-relaxed text-slate">{a}</div>}
    </div>
  );
}

export function HelpPanel({ faqs }: { faqs: HelpFaq[] }) {
  return (
    <div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-slate">
        Gyors útmutató a felület használatához — ha bármi nem egyértelmű, itt a válasz.
      </p>
      <div className="grid gap-2.5">
        {faqs.map((f) => (
          <HelpItem key={f.q} {...f} />
        ))}
      </div>
    </div>
  );
}
