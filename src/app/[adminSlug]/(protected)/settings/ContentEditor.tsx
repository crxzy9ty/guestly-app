"use client";

import { useState, useTransition } from "react";
import { saveContent } from "@/app/actions/content";
import type { MarketingContent } from "@/lib/content";

const inputClass = "h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none";
const labelClass = "mb-1 block text-xs font-bold text-ink";
const boxClass = "mb-4 rounded-xl border border-line bg-paper p-4";

export function ContentEditor({ adminSlug, initial }: { adminSlug: string; initial: MarketingContent }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof MarketingContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((d) => ({ ...d, [key]: e.target.value }));
    setSaved(false);
  };

  const setFaq = (i: number, field: "q" | "a", value: string) => {
    setDraft((d) => ({ ...d, faqs: d.faqs.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)) }));
    setSaved(false);
  };

  const addFaq = () => {
    setDraft((d) => ({ ...d, faqs: [...d.faqs, { q: "Új kérdés", a: "Új válasz…" }] }));
    setSaved(false);
  };

  const removeFaq = (i: number) => {
    setDraft((d) => ({ ...d, faqs: d.faqs.filter((_, idx) => idx !== i) }));
    setSaved(false);
  };

  const save = () => {
    startTransition(async () => {
      const result = await saveContent(adminSlug, draft);
      setSaved(result.ok);
    });
  };

  return (
    <div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-slate">
        Itt szerkesztheted a publikus landing page főbb szövegeit — a mentés után azonnal megjelenik a
        látogatóknak.
      </p>

      <div className="mb-5 flex items-center gap-2.5">
        <button
          onClick={save}
          disabled={isPending}
          className="h-9 rounded-lg bg-ink px-5 text-xs font-bold text-white disabled:opacity-50"
        >
          {isPending ? "Mentés…" : "Mentés"}
        </button>
        {saved && <span className="text-xs font-bold text-green">✓ Mentve</span>}
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Hero szekció</div>
        <label className={labelClass}>Kis felirat (eyebrow)</label>
        <input value={draft.heroEyebrow} onChange={set("heroEyebrow")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Cím — első fele</label>
        <input value={draft.heroTitlePrefix} onChange={set("heroTitlePrefix")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Cím — kiemelt vége (gradiens)</label>
        <input value={draft.heroTitleHighlight} onChange={set("heroTitleHighlight")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Alszöveg</label>
        <textarea value={draft.heroBody} onChange={set("heroBody")} className="h-[70px] w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none" />
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Gombfeliratok</div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={labelClass}>Elsődleges CTA</label>
            <input value={draft.ctaPrimary} onChange={set("ctaPrimary")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Másodlagos CTA</label>
            <input value={draft.ctaSecondary} onChange={set("ctaSecondary")} className={inputClass} />
          </div>
        </div>
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Záró CTA szekció</div>
        <label className={labelClass}>Cím</label>
        <input value={draft.finalCtaTitle} onChange={set("finalCtaTitle")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Alszöveg</label>
        <textarea value={draft.finalCtaBody} onChange={set("finalCtaBody")} className="h-[60px] w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none" />
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">GYIK</div>
        <div className="grid gap-3">
          {draft.faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate">#{i + 1}</span>
                <button onClick={() => removeFaq(i)} className="text-xs font-semibold text-slate">
                  Törlés
                </button>
              </div>
              <input value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} className={`${inputClass} mb-2 font-bold`} />
              <textarea
                value={f.a}
                onChange={(e) => setFaq(i, "a", e.target.value)}
                className="h-[60px] w-full resize-none rounded-lg border border-line px-3 py-2 text-[12.5px] text-ink outline-none"
              />
            </div>
          ))}
        </div>
        <button onClick={addFaq} className="mt-3 h-9 rounded-lg border border-line px-4 text-xs font-bold text-ink">
          + Új kérdés hozzáadása
        </button>
      </div>
    </div>
  );
}
