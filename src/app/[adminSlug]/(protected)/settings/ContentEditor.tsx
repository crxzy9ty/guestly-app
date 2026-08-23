"use client";

import { useState, useTransition } from "react";
import { saveContent } from "@/app/actions/content";
import type { MarketingContent } from "@/lib/content";

const inputClass = "h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none";
const smallInputClass = "h-9 w-full rounded-lg border border-line bg-paper px-2.5 text-[13px] text-ink outline-none";
const labelClass = "mb-1 block text-xs font-bold text-ink";
const boxClass = "mb-4 rounded-xl border border-line bg-paper p-4";
const itemBoxClass = "rounded-lg border border-line p-3";
const textareaClass = "h-[60px] w-full resize-none rounded-lg border border-line px-3 py-2 text-[12.5px] text-ink outline-none";

export function ContentEditor({ adminSlug, initial }: { adminSlug: string; initial: MarketingContent }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof MarketingContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((d) => ({ ...d, [key]: e.target.value }));
    setSaved(false);
  };

  // Shared by problems/steps — both are fixed-length { title, body } lists.
  const setTitleBodyItem =
    (key: "problems" | "steps") => (i: number, field: "title" | "body") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft((d) => ({ ...d, [key]: d[key].map((item, idx) => (idx === i ? { ...item, [field]: e.target.value } : item)) }));
      setSaved(false);
    };
  const setProblem = setTitleBodyItem("problems");
  const setStep = setTitleBodyItem("steps");

  const setSignal = (i: number, field: "tag" | "title" | "body") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((d) => ({ ...d, signal: d.signal.map((item, idx) => (idx === i ? { ...item, [field]: e.target.value } : item)) }));
    setSaved(false);
  };

  const setCompareRow = (i: number, field: "label" | "google" | "ours") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((d) => ({ ...d, compareRows: d.compareRows.map((item, idx) => (idx === i ? { ...item, [field]: e.target.value } : item)) }));
    setSaved(false);
  };

  const setStat = (i: number, field: "number" | "label") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((d) => ({ ...d, stats: d.stats.map((item, idx) => (idx === i ? { ...item, [field]: e.target.value } : item)) }));
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
        Itt szerkesztheted a publikus landing page összes szövegét — a mentés után azonnal megjelenik a
        látogatóknak.
      </p>

      <div className="sticky top-0 z-10 mb-5 flex items-center gap-2.5 bg-mist py-2">
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
        <div className="mb-3 text-sm font-bold text-ink">Navigáció és gombfeliratok</div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={labelClass}>Fejléc — bejelentkezés link</label>
            <input value={draft.navLogin} onChange={set("navLogin")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Elsődleges CTA (pl. „Demó kérése”)</label>
            <input value={draft.ctaPrimary} onChange={set("ctaPrimary")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Másodlagos CTA (pl. „Bejelentkezés →”)</label>
            <input value={draft.ctaSecondary} onChange={set("ctaSecondary")} className={inputClass} />
          </div>
        </div>
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Jelzés-csík a hero alatt (3 kártya)</div>
        <div className="grid gap-3">
          {draft.signal.map((s, i) => (
            <div key={i} className={itemBoxClass}>
              <div className="mb-2 text-xs font-bold text-slate">#{i + 1}</div>
              <div className="mb-2 grid grid-cols-[100px_1fr] gap-2">
                <input value={s.tag} onChange={setSignal(i, "tag")} placeholder="Időbélyeg / címke" className={smallInputClass} />
                <input value={s.title} onChange={setSignal(i, "title")} placeholder="Cím" className={smallInputClass} />
              </div>
              <textarea value={s.body} onChange={setSignal(i, "body")} placeholder="Szöveg" className={textareaClass} />
            </div>
          ))}
        </div>
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Probléma szekció</div>
        <label className={labelClass}>Kis felirat (eyebrow)</label>
        <input value={draft.problemEyebrow} onChange={set("problemEyebrow")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Cím</label>
        <input value={draft.problemTitle} onChange={set("problemTitle")} className={`${inputClass} mb-3`} />
        <div className="grid gap-3">
          {draft.problems.map((p, i) => (
            <div key={i} className={itemBoxClass}>
              <div className="mb-2 text-xs font-bold text-slate">Kártya #{i + 1}</div>
              <input value={p.title} onChange={setProblem(i, "title")} placeholder="Cím" className={`${smallInputClass} mb-2 font-bold`} />
              <textarea value={p.body} onChange={setProblem(i, "body")} placeholder="Szöveg" className={textareaClass} />
            </div>
          ))}
        </div>
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Összehasonlítás szekció (Fydback vs Google Review)</div>
        <label className={labelClass}>Kis felirat (eyebrow)</label>
        <input value={draft.compareEyebrow} onChange={set("compareEyebrow")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Cím</label>
        <input value={draft.compareTitle} onChange={set("compareTitle")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Bevezető szöveg</label>
        <textarea value={draft.compareBody} onChange={set("compareBody")} className={`${textareaClass} mb-3`} />
        <div className="mb-3 grid grid-cols-2 gap-2.5">
          <div>
            <label className={labelClass}>Bal oszlop feje (pl. „Google Review”)</label>
            <input value={draft.compareColGoogle} onChange={set("compareColGoogle")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jobb oszlop feje (pl. „Fydback”)</label>
            <input value={draft.compareColOurs} onChange={set("compareColOurs")} className={inputClass} />
          </div>
        </div>
        <div className="grid gap-2">
          {draft.compareRows.map((row, i) => (
            <div key={i} className={itemBoxClass}>
              <div className="mb-2 text-xs font-bold text-slate">Sor #{i + 1}</div>
              <input value={row.label} onChange={setCompareRow(i, "label")} placeholder="Szempont" className={`${smallInputClass} mb-2 font-bold`} />
              <div className="grid grid-cols-2 gap-2">
                <input value={row.google} onChange={setCompareRow(i, "google")} placeholder="Google Review" className={smallInputClass} />
                <input value={row.ours} onChange={setCompareRow(i, "ours")} placeholder="Fydback" className={smallInputClass} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Lépések szekció (Hogyan működik)</div>
        <label className={labelClass}>Kis felirat (eyebrow)</label>
        <input value={draft.stepsEyebrow} onChange={set("stepsEyebrow")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Cím</label>
        <input value={draft.stepsTitle} onChange={set("stepsTitle")} className={`${inputClass} mb-3`} />
        <div className="grid gap-3">
          {draft.steps.map((s, i) => (
            <div key={i} className={itemBoxClass}>
              <div className="mb-2 text-xs font-bold text-slate">Lépés #{i + 1}</div>
              <input value={s.title} onChange={setStep(i, "title")} placeholder="Cím" className={`${smallInputClass} mb-2 font-bold`} />
              <textarea value={s.body} onChange={setStep(i, "body")} placeholder="Szöveg" className={textareaClass} />
            </div>
          ))}
        </div>
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Statisztika sáv</div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {draft.stats.map((s, i) => (
            <div key={i} className={itemBoxClass}>
              <div className="mb-2 text-xs font-bold text-slate">#{i + 1}</div>
              <label className={labelClass}>Szám</label>
              <input value={s.number} onChange={setStat(i, "number")} className={`${smallInputClass} mb-2`} />
              <label className={labelClass}>Felirat</label>
              <input value={s.label} onChange={setStat(i, "label")} className={smallInputClass} />
            </div>
          ))}
        </div>
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">GYIK</div>
        <label className={labelClass}>Kis felirat (eyebrow)</label>
        <input value={draft.faqEyebrow} onChange={set("faqEyebrow")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Cím</label>
        <input value={draft.faqTitle} onChange={set("faqTitle")} className={`${inputClass} mb-3`} />
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

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Záró CTA szekció</div>
        <label className={labelClass}>Kis felirat (eyebrow)</label>
        <input value={draft.finalCtaEyebrow} onChange={set("finalCtaEyebrow")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Cím</label>
        <input value={draft.finalCtaTitle} onChange={set("finalCtaTitle")} className={`${inputClass} mb-3`} />
        <label className={labelClass}>Alszöveg</label>
        <textarea value={draft.finalCtaBody} onChange={set("finalCtaBody")} className="h-[60px] w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none" />
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Nyereményjáték</div>
        <label className={labelClass}>Alapértelmezett nyeremény</label>
        <p className="mb-2 text-[11.5px] leading-relaxed text-slate">
          Ez jelenik meg annál a partnernél, aki a saját partner-adatlapján nem ad meg egyedi nyereményt.
        </p>
        <input value={draft.defaultPrizeDescription} onChange={set("defaultPrizeDescription")} className={inputClass} />
      </div>

      <div className={boxClass}>
        <div className="mb-3 text-sm font-bold text-ink">Lábléc</div>
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className={labelClass}>Adatkezelési link felirata</label>
            <input value={draft.footerPrivacy} onChange={set("footerPrivacy")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Impresszum link felirata</label>
            <input value={draft.footerImprint} onChange={set("footerImprint")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Copyright szöveg</label>
            <input value={draft.footerCopyright} onChange={set("footerCopyright")} className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}
