import Link from "next/link";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { resolveContent } from "@/lib/content";
import { FaqItem } from "./FaqItem";
import { Logo } from "./Logo";
import { BackToTop } from "./BackToTop";

// Same palette as the real logo (see Logo.tsx) — kept local to this page
// rather than promoted to the shared theme tokens in globals.css, since
// those tokens (mist/line/violet/etc.) are relied on across the dashboard
// and admin UI with the older brand colors.
const GRAD = "linear-gradient(90deg, #17e0ff 0%, #7c3aff 45%, #ff2fc4 100%)";
const MIST = "bg-[#f4efff]";
const HAIRLINE = "border-[#e2d6f7]";

const display = Outfit({ subsets: ["latin"], weight: ["600", "700", "800"] });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "600"] });

// Visual-only properties for the 3 fixed signal cells and the 3 fixed
// dotmark colors — not text, so not part of the editable content model.
const SIGNAL_VISUAL = [
  { color: "#17e0ff", size: 10 },
  { color: "#7c3aff", size: 18 },
  { color: "#ff2fc4", size: 28 },
];

function Section({
  children,
  mist = false,
  divider = true,
}: {
  children: React.ReactNode;
  mist?: boolean;
  divider?: boolean;
}) {
  return (
    <section className={`${mist ? MIST : "bg-paper"} ${divider ? `border-t ${HAIRLINE}` : ""}`}>
      <div className="mx-auto max-w-4xl px-6 py-16">{children}</div>
    </section>
  );
}

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div
      className={`${mono.className} mb-3 flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.1em] text-slate ${center ? "justify-center" : ""}`}
    >
      {children}
    </div>
  );
}

function Dotmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const s = size === "lg" ? [9, 15, 22] : [5, 8, 12];
  return (
    <span className="inline-flex shrink-0 items-end gap-[5px]">
      <span className="rounded-full" style={{ width: s[0], height: s[0], background: "#17e0ff" }} />
      <span className="rounded-full" style={{ width: s[1], height: s[1], background: "#7c3aff" }} />
      <span className="rounded-full" style={{ width: s[2], height: s[2], background: "#ff2fc4" }} />
    </span>
  );
}

// Bobbing 3-dot mark above the headline — the logo's own growing-dot motif,
// given gentle motion. `animate-[dot-bob_...]` refers to a keyframe defined
// once, globally, in globals.css (harmless to share since nothing else
// references that name).
function HeroMark() {
  return (
    <div className="mt-4 mb-4 inline-flex items-end gap-2.5">
      <span
        className="h-3.5 w-3.5 rounded-full bg-[#17e0ff] animate-[dot-bob_3.6s_ease-in-out_infinite] motion-reduce:animate-none"
      />
      <span
        className="h-6 w-6 rounded-full bg-[#7c3aff] animate-[dot-bob_4.2s_ease-in-out_infinite_0.3s] motion-reduce:animate-none"
      />
      <span
        className="h-9 w-9 rounded-full bg-[#ff2fc4] animate-[dot-bob_4.8s_ease-in-out_infinite_0.6s] motion-reduce:animate-none"
      />
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("content_settings").select("content").eq("id", 1).maybeSingle();
  const content = resolveContent(data?.content);

  return (
    <div className={`${body.className} text-ink`}>
      {/* Nav */}
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Logo size={27} />
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="px-1.5 py-2 text-sm font-semibold text-ink">
            {content.navLogin}
          </Link>
          <Link href="/demo" className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white">
            {content.ctaPrimary}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <Section divider={false}>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow center>{content.heroEyebrow}</Eyebrow>
          <HeroMark />
          <h1
            className={`${display.className} mx-auto mb-5 max-w-[18ch] text-[clamp(32px,6vw,52px)] font-extrabold leading-[1.05] tracking-tight`}
          >
            {content.heroTitlePrefix}
            <span style={{ backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {content.heroTitleHighlight}
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-[17px] leading-relaxed text-slate">{content.heroBody}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/demo" className="rounded-xl bg-ink px-7 py-3.5 text-[15px] font-bold text-white">
              {content.ctaPrimary}
            </Link>
            <Link href="/login" className={`rounded-xl border ${HAIRLINE} px-7 py-3.5 text-[15px] font-bold text-ink`}>
              {content.ctaSecondary}
            </Link>
          </div>

          <div className={`mt-16 grid gap-px overflow-hidden rounded-[20px] border ${HAIRLINE} bg-[#e2d6f7] sm:grid-cols-3`}>
            {content.signal.map((c, i) => (
              <div key={c.tag} className="bg-paper px-6 py-7 text-left">
                <div
                  className="mb-4 rounded-full"
                  style={{ width: SIGNAL_VISUAL[i].size, height: SIGNAL_VISUAL[i].size, background: SIGNAL_VISUAL[i].color }}
                />
                <div className={`${mono.className} mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate`}>
                  {c.tag}
                </div>
                <div className="mb-1.5 text-[16px] font-bold">{c.title}</div>
                <div className="text-[13.5px] leading-relaxed text-slate">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Problem */}
      <Section mist>
        <Eyebrow>{content.problemEyebrow}</Eyebrow>
        <h2 className={`${display.className} mb-8 max-w-md text-[28px] font-extrabold tracking-tight`}>{content.problemTitle}</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {content.problems.map((p) => (
            <div key={p.title} className={`rounded-2xl border ${HAIRLINE} bg-paper p-5`}>
              <div className="mb-2 text-[15px] font-bold">{p.title}</div>
              <div className="text-[13.5px] leading-relaxed text-slate">{p.body}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Fydback vs Google Review */}
      <Section>
        <Eyebrow>{content.compareEyebrow}</Eyebrow>
        <h2 className={`${display.className} mb-4 max-w-lg text-[28px] font-extrabold tracking-tight`}>{content.compareTitle}</h2>
        <p className="mb-7 max-w-xl text-[15px] leading-relaxed text-slate">{content.compareBody}</p>
        <div className={`overflow-x-auto rounded-2xl border ${HAIRLINE}`}>
          <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
            <thead>
              <tr className={`${MIST} text-left`}>
                <th className="px-4 py-3"></th>
                <th className={`${mono.className} px-4 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-slate`}>
                  {content.compareColGoogle}
                </th>
                <th className={`${mono.className} px-4 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#7c3aff]`}>
                  {content.compareColOurs}
                </th>
              </tr>
            </thead>
            <tbody>
              {content.compareRows.map((row, i) => (
                <tr key={row.label} className={`border-t ${HAIRLINE} ${i % 2 ? MIST : "bg-paper"}`}>
                  <td className="px-4 py-3 font-bold text-ink">{row.label}</td>
                  <td className="px-4 py-3 text-slate">{row.google}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* How it works */}
      <Section mist>
        <Eyebrow>{content.stepsEyebrow}</Eyebrow>
        <h2 className={`${display.className} mb-10 max-w-md text-[28px] font-extrabold tracking-tight`}>{content.stepsTitle}</h2>
        <div className="grid gap-7 sm:grid-cols-3">
          {content.steps.map((s) => (
            <div key={s.title}>
              <div className="mb-4">
                <Dotmark size="lg" />
              </div>
              <div className="mb-2 text-[16px] font-bold">{s.title}</div>
              <div className="text-sm leading-relaxed text-slate">{s.body}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Stats strip */}
      <Section>
        <div className="rounded-2xl bg-ink px-6 py-12">
          <div className="grid gap-7 text-center sm:grid-cols-3">
            {content.stats.map((s) => (
              <div key={s.label}>
                <div
                  className={`${display.className} mb-1.5 text-4xl font-extrabold tracking-tight`}
                  style={{ backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                >
                  {s.number}
                </div>
                <div className="text-[13px] text-white/65">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section mist>
        <Eyebrow>{content.faqEyebrow}</Eyebrow>
        <h2 className={`${display.className} mb-6 text-[28px] font-extrabold tracking-tight`}>{content.faqTitle}</h2>
        <div>
          {content.faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className="py-5 text-center">
          <Eyebrow center>
            <Dotmark />
            {content.finalCtaEyebrow}
          </Eyebrow>
          <h2 className={`${display.className} mb-3.5 text-[30px] font-extrabold tracking-tight`}>{content.finalCtaTitle}</h2>
          <p className="mx-auto mb-7 max-w-md text-[15px] leading-relaxed text-slate">{content.finalCtaBody}</p>
          <Link href="/demo" className="inline-block rounded-xl bg-ink px-7 py-3.5 text-[15px] font-bold text-white">
            {content.ctaPrimary}
          </Link>
        </div>
      </Section>

      {/* Footer */}
      <div className={`border-t ${HAIRLINE} bg-paper px-6 py-7`}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <Logo size={14} />
          <div className="flex items-center gap-4 text-xs text-slate">
            <Link href="/adatvedelem" className="hover:text-ink">
              {content.footerPrivacy}
            </Link>
            <Link href="/impresszum" className="hover:text-ink">
              {content.footerImprint}
            </Link>
            <span>{content.footerCopyright}</span>
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
