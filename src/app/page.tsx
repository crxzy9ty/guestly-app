import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONTENT, type MarketingContent } from "@/lib/content";
import { FaqItem } from "./FaqItem";
import { Logo } from "./Logo";
import { BackToTop } from "./BackToTop";

const GRAD = "linear-gradient(135deg, #22E5EA 0%, #5B21B6 55%, #E619C8 100%)";

const STEPS = [
  {
    title: "Kihelyezed az asztali kártyát",
    body: "Minden asztalra kerül egy QR-kód. Nincs app, nincs regisztráció — a vendég csak a telefonja kameráját nyitja meg.",
  },
  {
    title: "A vendég 30 másodperc alatt értékel",
    body: "Nincs kellemetlen szituáció, nem kell odahívni senkit — csak öt gyors kérdés. Cserébe részt vesz egy napi nyereményjátékban is, amit te állítasz be.",
  },
  {
    title: "Te látod, mi történik óráról órára",
    body: "Nem havi átlagot kapsz, hanem azt, hogy péntek este 7-kor pontosan mi romlik el — és javíthatsz, mielőtt elveszíted a vendéget.",
  },
];

const COMPARISON_ROWS: [string, string, string][] = [
  ["Mikor tudod meg", "Napokkal-hetekkel később, ha egyáltalán", "Aznap, akár óránkénti bontásban"],
  ["Ki látja", "Bárki, nyilvánosan", "Csak te és a csapatod"],
  ["Mit mond", "Egy összesített csillagszám", "Konkrét szempont, időpont, gyakran ok is"],
  ["Mit takar az átlag", "Egy 5 éves múlt átlaga — egy rossz hónap alig mozgatja", "Az elmúlt napok/hetek valós állapota"],
  ["Cselekvésre alkalmas?", "Csak utólagos reagálás", "Beavatkozhatsz, mielőtt gond lesz belőle"],
];

function Section({ children, mist = false }: { children: React.ReactNode; mist?: boolean }) {
  return (
    <section className={mist ? "bg-mist" : "bg-paper"}>
      <div className="mx-auto max-w-4xl px-6 py-16">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-violet">{children}</div>;
}

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("content_settings").select("content").eq("id", 1).maybeSingle();
  const content = (data?.content as MarketingContent | undefined) ?? DEFAULT_CONTENT;

  return (
    <div className="text-ink">
      {/* Nav */}
      <div className="mx-auto flex max-w-4xl items-center justify-between bg-paper px-6 py-5">
        <div className="flex items-center gap-2">
          <Logo size={27} />
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="px-1.5 py-2 text-sm font-semibold text-ink">
            Bejelentkezés
          </Link>
          <Link href="/demo" className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white">
            Demó kérése
          </Link>
        </div>
      </div>

      {/* Hero */}
      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>{content.heroEyebrow}</Eyebrow>
          <h1 className="mb-5 text-[clamp(32px,6vw,48px)] font-bold leading-[1.08] tracking-tight">
            {content.heroTitlePrefix}
            <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {content.heroTitleHighlight}
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-[17px] leading-relaxed text-slate">{content.heroBody}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/demo" className="rounded-lg bg-ink px-7 py-3.5 text-[15px] font-bold text-white">
              {content.ctaPrimary}
            </Link>
            <Link href="/login" className="rounded-lg border border-line px-7 py-3.5 text-[15px] font-bold text-ink">
              {content.ctaSecondary}
            </Link>
          </div>
        </div>
      </Section>

      {/* Problem */}
      <Section mist>
        <Eyebrow>A probléma</Eyebrow>
        <h2 className="mb-8 max-w-md text-[28px] font-bold tracking-tight">
          A legtöbb visszajelzés túl későn, túl homályosan érkezik
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            ["Havi átlagok", "Egy negyedéves felmérés nem mondja meg, hogy péntek este mi ment rosszul."],
            [
              "Néma vendégek",
              "A legtöbben nem szólnak, mert kellemetlen odahívni a felszolgálót — inkább csendben legközelebb máshova mennek.",
            ],
            ["Nyilvános kritika", "Amit megosztanak, az gyakran egyenesen Google-re kerül, mire te megtudod."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-line bg-paper p-5">
              <div className="mb-2 text-[15px] font-bold">{title}</div>
              <div className="text-[13.5px] leading-relaxed text-slate">{body}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Fydback vs Google Review */}
      <Section>
        <Eyebrow>Miért nem elég a Google Review</Eyebrow>
        <h2 className="mb-4 max-w-lg text-[28px] font-bold tracking-tight">
          Nem egy plusz csatorna vagyunk — egy korábbi lépcsőfok
        </h2>
        <p className="mb-7 max-w-xl text-[15px] leading-relaxed text-slate">
          A Google Review akkor derít fényt a problémára, amikor már nyilvános, és a vendég már döntött. A Fydback ezt a
          pillanat előtt hozza el hozzád — belsőleg, cselekvésre alkalmas formában.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-mist text-left">
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3 font-bold text-slate">Google Review</th>
                <th className="px-4 py-3 font-bold text-ink">Fydback</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(([label, google, ours], i) => (
                <tr key={label} className={`border-t border-line ${i % 2 ? "bg-mist" : "bg-paper"}`}>
                  <td className="px-4 py-3 font-bold text-ink">{label}</td>
                  <td className="px-4 py-3 text-slate">{google}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* How it works */}
      <Section mist>
        <Eyebrow>Hogyan működik</Eyebrow>
        <h2 className="mb-10 max-w-md text-[28px] font-bold tracking-tight">Három lépés az asztaltól a döntésig</h2>
        <div className="grid gap-7 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title}>
              <div
                className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] text-[15px] font-bold text-white"
                style={{ background: GRAD }}
              >
                {i + 1}
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
            {[
              ["30 mp", "egy vendég átlagos kitöltési ideje"],
              ["1 nap", "a bevezetéstől az első adatokig"],
              ["0", "letöltendő alkalmazás a vendégnek"],
            ].map(([n, l]) => (
              <div key={l}>
                <div
                  className="mb-1.5 text-4xl font-bold tracking-tight"
                  style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                >
                  {n}
                </div>
                <div className="text-[13px] text-white/65">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section mist>
        <Eyebrow>Kérdések</Eyebrow>
        <h2 className="mb-6 text-[28px] font-bold tracking-tight">Amit tudni érdemes indulás előtt</h2>
        <div>
          {content.faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className="py-5 text-center">
          <h2 className="mb-3.5 text-[30px] font-bold tracking-tight">{content.finalCtaTitle}</h2>
          <p className="mx-auto mb-7 max-w-md text-[15px] leading-relaxed text-slate">{content.finalCtaBody}</p>
          <Link href="/demo" className="inline-block rounded-lg bg-ink px-7 py-3.5 text-[15px] font-bold text-white">
            {content.ctaPrimary}
          </Link>
        </div>
      </Section>

      {/* Footer */}
      <div className="border-t border-line bg-paper px-6 py-7">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo size={14} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate">
            <Link href="/adatvedelem" className="hover:text-ink">
              Adatkezelési tájékoztató
            </Link>
            <Link href="/impresszum" className="hover:text-ink">
              Impresszum
            </Link>
            <span>© 2026 Fydback</span>
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
