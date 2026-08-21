"use client";

import { useState } from "react";

export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e2d6f7] py-5">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <span className="text-base font-bold tracking-tight text-ink">{q}</span>
        <span className="ml-4 shrink-0 text-xl text-[#7c3aff]">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate">{a}</p>}
    </div>
  );
}
