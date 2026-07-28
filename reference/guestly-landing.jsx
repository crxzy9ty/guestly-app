import React, { useState, createContext, useContext } from 'react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ---- Design tokens (shared with the product prototype) ----
const C = {
  ink: '#15131C',
  paper: '#FFFFFF',
  mist: '#F6F5FA',
  line: '#E7E4F0',
  cyan: '#22E5EA',
  violet: '#5B21B6',
  magenta: '#E619C8',
  slate: '#6B6878',
  green: '#1F9D6B',
};

const GRAD = `linear-gradient(135deg, ${C.cyan} 0%, ${C.violet} 55%, ${C.magenta} 100%)`;

const DEFAULT_ASPECTS = [
  { key: 'tisztasag', label: 'Tisztaság', icon: '✦' },
  { key: 'gyorsasag', label: 'Kiszolgálás gyorsasága', icon: '⚡' },
  { key: 'kiszolgalas', label: 'Kiszolgálás minősége', icon: '♥' },
  { key: 'etel', label: 'Étel-ital minősége', icon: '☕' },
  { key: 'hangulat', label: 'Hangulat', icon: '✺' },
];

// ---- Question sets: reusable, named collections of aspects that can be assigned to one or more partners ----
// "Alap kérdések" is the default set every new partner starts with; it can be edited like any other set.
const DEFAULT_QUESTION_SETS = [
  { id: 'QS-ALAP', name: 'Alap kérdések', aspects: DEFAULT_ASPECTS },
];

// partnerAssignments: { [venueName]: questionSetId } — falls back to 'QS-ALAP' when unassigned
const AspectsContext = createContext({
  questionSets: DEFAULT_QUESTION_SETS,
  setQuestionSets: () => {},
  partnerAssignments: {},
  setPartnerAssignments: () => {},
});

// Returns the aspects list for a given venue (or the default set if no venue / no assignment given)
function useAspects(venueName) {
  const { questionSets, partnerAssignments } = useContext(AspectsContext);
  const setId = venueName ? (partnerAssignments[venueName] || 'QS-ALAP') : 'QS-ALAP';
  const set = questionSets.find((s) => s.id === setId) || questionSets[0];
  return set ? set.aspects : DEFAULT_ASPECTS;
}

function useQuestionSets() {
  return useContext(AspectsContext);
}

// ---- Editable marketing page content: admin-editable via the "Tartalom szerkesztése" settings tab ----
const DEFAULT_CONTENT = {
  heroEyebrow: 'Vendégelégedettség · valós időben',
  heroTitlePrefix: 'Tudd meg, mit gondolnak a vendégeid — ',
  heroTitleHighlight: 'mielőtt elmennek.',
  heroBody: 'Egy QR-kód az asztalon. Öt kérdés a vendégnek. Neked pedig egy óránkénti kimutatás arról, hol csúszik el a kiszolgálás — mielőtt egy rossz Google-értékelésből tudod meg.',
  ctaPrimary: 'Demó kérése',
  ctaSecondary: 'Bejelentkezés →',
  finalCtaTitle: 'Nézzük meg együtt a saját asztalaidon',
  finalCtaBody: '15 perces beszélgetés, valódi példákkal a te vendégkörödre szabva. Kötelezettség nélkül.',
  faqs: [
    { q: 'Kell hozzá saját applikáció a vendégnek?', a: 'Nem. A QR-kód a telefon natív kameráján keresztül nyílik meg egy böngészőben — nincs letöltés, nincs regisztráció a vendég oldalán.' },
    { q: 'Mennyi idő alatt indul el nálam?', a: 'A QR-kártyák kihelyezése és a fiókod beállítása jellemzően egy napon belül elkészül.' },
    { q: 'Ki látja az értékeléseket?', a: 'Csak te és az általad megadott üzletvezetők — az értékelések nem nyilvánosak, nem kerülnek fel Google-re vagy más felületre.' },
    { q: 'Mennyibe kerül?', a: 'Az árazást jelenleg alakítjuk ki induló partnereinkkel közösen. Kérj demót, és személyesen egyeztetünk egy a vállalkozásodhoz illő csomagról.' },
    { q: 'Mibe kerül a napi nyereményjáték?', a: 'Egyetlen ingyen kávé alapanyagköltsége naponta — havi szinten jellemzően pár ezer forint, miközben a nyertes gyakran kísérővel tér vissza, aki fizető vendégként fogyaszt.' },
    { q: 'Hogyan kapja meg a vendég a nyereményt?', a: 'A napi nyertes e-mailben kap egy egyedi kupon-kódot, amit legközelebbi látogatásakor a pultnál megmutat — nincs szükség appra vagy plusz eszközre a pultosnál.' },
    { q: 'Kötelező részt vennem a nyereményjátékban?', a: 'Nem, ez opcionális kiegészítő — a vendégelégedettség-mérés önmagában is működik nélküle, de sokat segít a válaszadási hajlandóságban.' },
  ],
};

const ContentContext = createContext({ content: DEFAULT_CONTENT, setContent: () => {} });
function useContent() {
  return useContext(ContentContext).content;
}

function seedData() {
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const days = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  const hours = [10, 14, 18, 20];
  const data = {};
  DEFAULT_ASPECTS.forEach((a, ai) => {
    data[a.key] = days.map((d, di) =>
      hours.map((h) => {
        let base = 8.3 - ai * 0.1;
        if ((di === 4 || di === 5) && h >= 18) base -= a.key === 'gyorsasag' ? 3.1 : 0.4;
        const val = Math.max(1, Math.min(10, base + (rand() - 0.5) * 1.2));
        return Math.round(val * 10) / 10;
      })
    );
  });
  return { days, hours, data };
}
const DEMO = seedData();

function heatColor(v) {
  const t = (v - 1) / 9;
  const from = [230, 25, 200];   // 1  — needs attention
  const mid = [246, 245, 250];   // 5.5 — neutral
  const good = [110, 201, 141];  // 8   — solid green
  const great = [15, 110, 72];   // 10  — deep green, clearly distinct
  let r, g, b;
  if (t < 0.5) {
    const k = t / 0.5;
    r = from[0] + (mid[0] - from[0]) * k;
    g = from[1] + (mid[1] - from[1]) * k;
    b = from[2] + (mid[2] - from[2]) * k;
  } else if (t < 0.78) {
    const k = (t - 0.5) / 0.28;
    r = mid[0] + (good[0] - mid[0]) * k;
    g = mid[1] + (good[1] - mid[1]) * k;
    b = mid[2] + (good[2] - mid[2]) * k;
  } else {
    const k = (t - 0.78) / 0.22;
    r = good[0] + (great[0] - good[0]) * k;
    g = good[1] + (great[1] - good[1]) * k;
    b = good[2] + (great[2] - good[2]) * k;
  }
  return `rgb(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`;
}

function Wordmark({ size = 22, dark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: size * 0.9, height: size * 0.9, borderRadius: 6, background: GRAD, flexShrink: 0 }} />
      <span style={{ fontSize: size * 0.82, fontWeight: 700, letterSpacing: '-0.01em', color: dark ? C.paper : C.ink }}>
        Guestly
      </span>
    </div>
  );
}

// ---- Live mini heatmap, the hero's proof-not-a-mockup element ----
function LiveHeatmap() {
  const [selected, setSelected] = useState('gyorsasag');
  const grid = DEMO.data[selected];
  return (
    <div style={{
      background: C.paper, borderRadius: 16, border: `1px solid ${C.line}`,
      padding: 20, boxShadow: '0 24px 60px rgba(21,19,28,0.10)', width: '100%', maxWidth: 380,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.slate, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Élő nézet · Kávézó Aroma
        </span>
        <span style={{ fontSize: 10, color: C.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
          élesben fut
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {DEFAULT_ASPECTS.map((a) => (
          <button
            key={a.key}
            onClick={() => setSelected(a.key)}
            style={{
              padding: '6px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: selected === a.key ? `1px solid ${C.ink}` : `1px solid ${C.line}`,
              background: selected === a.key ? C.ink : C.paper,
              color: selected === a.key ? '#fff' : C.slate,
              transition: 'all 0.15s',
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `28px repeat(${DEMO.hours.length}, 1fr)`, gap: 4, marginBottom: 4 }}>
        <div />
        {DEMO.hours.map((h) => (
          <div key={h} style={{ fontSize: 9, color: C.slate, textAlign: 'center' }}>{h}h</div>
        ))}
      </div>
      {DEMO.days.map((d, di) => (
        <div key={d} style={{ display: 'grid', gridTemplateColumns: `28px repeat(${DEMO.hours.length}, 1fr)`, gap: 4, marginBottom: 4 }}>
          <div style={{ fontSize: 10, color: C.slate, display: 'flex', alignItems: 'center' }}>{d}</div>
          {grid[di].map((v, hi) => (
            <div key={hi} style={{
              aspectRatio: '1', borderRadius: 5, background: heatColor(v),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: v < 5 ? '#fff' : C.ink,
            }}>
              {v.toFixed(1)}
            </div>
          ))}
        </div>
      ))}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}`, fontSize: 12, color: C.ink, lineHeight: 1.5 }}>
        <strong style={{ color: C.magenta }}>Kiszolgálás gyorsasága</strong> visszaesik péntek–szombat 18–20h között. Ezt eddig senki nem mondta el neked.
      </div>
    </div>
  );
}

function Section({ children, bg = C.paper, style = {} }) {
  return (
    <section style={{ background: bg, padding: '72px 24px', ...style }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function Eyebrow({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.violet, marginBottom: 12 }}>
      {children}
    </div>
  );
}

const STEPS = [
  { title: 'Kihelyezed az asztali kártyát', body: 'Minden asztalra kerül egy QR-kód. Nincs app, nincs regisztráció — a vendég csak a telefonja kameráját nyitja meg.' },
  { title: 'A vendég 30 másodperc alatt értékel', body: 'Nincs kellemetlen szituáció, nem kell odahívni senkit — csak öt gyors kérdés. Cserébe részt vesz egy napi nyereményjátékban is, amit te állítasz be.' },
  { title: 'Te látod, mi történik óráról órára', body: 'Nem havi átlagot kapsz, hanem azt, hogy péntek este 7-kor pontosan mi romlik el — és javíthatsz, mielőtt elveszíted a vendéget.' },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.line}`, padding: '20px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>{q}</span>
        <span style={{ fontSize: 20, color: C.slate, flexShrink: 0, marginLeft: 16 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: C.slate, maxWidth: 640 }}>{a}</p>}
    </div>
  );
}

function MarketingPage({ onLogin, onDemo, onAdminLogin }) {
  const content = useContent();
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: C.ink, background: C.paper }}>
      <style>{`
        @media (min-width: 900px) {
          .hero-grid {
            grid-template-columns: 1.05fr 0.95fr !important;
            text-align: left !important;
            gap: 64px !important;
          }
          .hero-copy { text-align: left !important; }
          .hero-copy h1 { margin-left: 0 !important; margin-right: 0 !important; }
          .hero-copy p { margin-left: 0 !important; margin-right: 0 !important; }
          .hero-cta { justify-content: flex-start !important; }
          .hero-visual { justify-content: flex-end !important; }
        }
      `}</style>

      {/* Nav */}
      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1040, margin: '0 auto' }}>
        <Wordmark size={20} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={onLogin} style={navGhost}>Bejelentkezés</button>
          <button onClick={onDemo} style={navCta}>Demó kérése</button>
        </div>
      </div>

      {/* Hero */}
      <Section style={{ paddingTop: 40 }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 40, alignItems: 'center' }}>
          <div className="hero-copy" style={{ textAlign: 'center' }}>
            <Eyebrow>{content.heroEyebrow}</Eyebrow>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08,
              margin: '0 auto 20px', maxWidth: 720,
            }}>
              {content.heroTitlePrefix}<span style={{
                background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>{content.heroTitleHighlight}</span>
            </h1>
            <p style={{ fontSize: 17, color: C.slate, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 32px' }}>
              {content.heroBody}
            </p>
            <div className="hero-cta" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
              <button onClick={onDemo} style={btnPrimary}>{content.ctaPrimary}</button>
              <button onClick={onLogin} style={btnSecondary}>{content.ctaSecondary}</button>
            </div>
          </div>
          <div className="hero-visual" style={{ display: 'flex', justifyContent: 'center' }}>
            <LiveHeatmap />
          </div>
        </div>
      </Section>

      {/* Problem */}
      <Section bg={C.mist}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 32 }}>
          <div>
            <Eyebrow>A probléma</Eyebrow>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 16px', maxWidth: 480 }}>
              A legtöbb visszajelzés túl későn, túl homályosan érkezik
            </h2>
          </div>
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {[
              ['Havi átlagok', 'Egy negyedéves felmérés nem mondja meg, hogy péntek este mi ment rosszul.'],
              ['Néma vendégek', 'A legtöbben nem szólnak, mert kellemetlen odahívni a felszolgálót vagy elkérni a panaszkönyvet — inkább csendben legközelebb máshova mennek.'],
              ['Nyilvános kritika', 'Amit megosztanak, az gyakran egyenesen Google-re kerül, mire te megtudod.'],
            ].map(([title, body]) => (
              <div key={title} style={{ background: C.paper, borderRadius: 14, padding: 22, border: `1px solid ${C.line}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: C.slate, lineHeight: 1.55 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Guestly vs Google Review comparison */}
      <Section>
        <Eyebrow>Miért nem elég a Google Review</Eyebrow>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 16px', maxWidth: 560 }}>
          Nem egy plusz csatorna vagyunk — egy korábbi lépcsőfok
        </h2>
        <p style={{ fontSize: 15, color: C.slate, lineHeight: 1.6, maxWidth: 620, margin: '0 0 28px' }}>
          A Google Review akkor derít fény a problémára, amikor már nyilvános, és a vendég már döntött. A Guestly ezt
          a pillanat előtt hozza el hozzád — belsőleg, cselekvésre alkalmas formában.
        </p>
        <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ background: C.mist, textAlign: 'left' }}>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: C.ink }}></th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: C.slate }}>Google Review</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: C.ink }}>Guestly</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Mikor tudod meg', 'Napokkal-hetekkel később, ha egyáltalán', 'Aznap, akár óránkénti bontásban'],
                ['Ki látja', 'Bárki, nyilvánosan', 'Csak te és a csapatod'],
                ['Mit mond', 'Egy összesített csillagszám', 'Konkrét szempont, időpont, gyakran ok is'],
                ['Mit takar az átlag', 'Egy 5 éves múlt átlaga — egy rossz hónap alig mozgatja', 'Az elmúlt napok/hetek valós állapota, külön a régi adatoktól'],
                ['Cselekvésre alkalmas?', 'Csak utólagos reagálás', 'Beavatkozhatsz, mielőtt gond lesz belőle'],
                ['Kockázat', 'Egy rossz értékelés örökre ott marad', 'Nincs nyilvános kockázat'],
              ].map(([label, google, guestly], i) => (
                <tr key={label} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? C.mist : C.paper }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: C.ink }}>{label}</td>
                  <td style={{ padding: '12px 16px', color: C.slate }}>{google}</td>
                  <td style={{ padding: '12px 16px', color: C.ink, fontWeight: 600 }}>{guestly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: 20, background: C.ink, color: '#fff', borderRadius: 14, padding: '20px 24px', maxWidth: 640,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.cyan, marginBottom: 8 }}>
            Egy csillagszám félrevezető is lehet
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85 }}>
            Egy 5 éve működő hely csillagszáma több száz értékelés átlaga — egy rosszabb hónap alig mozgatja meg.
            Ha 4 évig 4,5 csillagos volt a hely, de az utóbbi 2-3 hónapban romlott a kiszolgálás, ez a Google
            felszínén szinte nem is látszik, miközben a jelenlegi vendégek most, valóban rosszabb élményt kapnak.
          </div>
        </div>

        <div style={{
          marginTop: 20, background: C.mist, borderRadius: 14, padding: '20px 24px', maxWidth: 640,
        }}>
          <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>
            A cél kettős: egyrészt <strong>elégedettségmérés</strong> — tudod, mit gondolnak a vendégeid, mielőtt
            elmennek. Másrészt egy <strong>vállalkozásfejlesztési eszköz</strong> — látod, mikor és hol van szükség
            plusz figyelemre a csapatodtól, mielőtt ez bárkinek problémát jelentene.
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <Eyebrow>Hogyan működik</Eyebrow>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 40px', maxWidth: 480 }}>
          Három lépés az asztaltól a döntésig
        </h2>
        <div style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {STEPS.map((s, i) => (
            <div key={s.title}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: GRAD,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{s.title}</div>
              <div style={{ fontSize: 14, color: C.slate, lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Social proof style stat strip */}
      <Section bg={C.ink} style={{ padding: '56px 24px' }}>
        <div style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', textAlign: 'center' }}>
          {[
            ['30 mp', 'egy vendég átlagos kitöltési ideje'],
            ['1 nap', 'a bevezetéstől az első adatokig'],
            ['0', 'letöltendő alkalmazás a vendégnek'],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{
                fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6,
                background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>
                {n}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <Eyebrow>Kérdések</Eyebrow>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 24px' }}>
          Amit tudni érdemes indulás előtt
        </h2>
        <div>
          {content.faqs.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </Section>

      {/* Final CTA */}
      <Section bg={C.mist}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px' }}>
            {content.finalCtaTitle}
          </h2>
          <p style={{ fontSize: 15, color: C.slate, maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.6 }}>
            {content.finalCtaBody}
          </p>
          <button onClick={onDemo} style={btnPrimary}>{content.ctaPrimary}</button>
        </div>
      </Section>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.line}`, padding: '28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1040, margin: '0 auto', flexWrap: 'wrap', gap: 12 }}>
        <Wordmark size={16} />
        <span style={{ fontSize: 12, color: C.slate }}>© 2026 Guestly</span>
      </div>
      <div style={{ textAlign: 'center', padding: '0 24px 24px' }}>
        <button
          onClick={onAdminLogin}
          style={{ background: 'none', border: 'none', color: C.line, fontSize: 10, cursor: 'pointer', padding: 4 }}
        >
          ·
        </button>
      </div>
    </div>
  );
}

const btnPrimary = {
  background: C.ink, color: '#fff', border: 'none', borderRadius: 10,
  padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  letterSpacing: '-0.01em',
};

const btnSecondary = {
  background: 'transparent', color: C.ink, border: `1px solid ${C.line}`, borderRadius: 10,
  padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  letterSpacing: '-0.01em',
};

const navCta = {
  background: C.ink, color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};

const navGhost = {
  background: 'none', color: C.ink, border: 'none',
  padding: '9px 6px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

// ---- Login ----
// ---- Demo request (for prospective, not-yet-customers) ----
function DemoRequest({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', business: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const complete = form.name.trim() && form.email.trim() && form.business.trim();

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: C.mist, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: 'system-ui, sans-serif', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 8px' }}>
          Köszönjük, {form.name.split(' ')[0] || 'a jelentkezést'}!
        </h1>
        <p style={{ fontSize: 14, color: C.slate, maxWidth: 340, lineHeight: 1.6, margin: '0 0 24px' }}>
          Hamarosan felvesszük veled a kapcsolatot a(z) <strong style={{ color: C.ink }}>{form.email}</strong> címen,
          hogy egyeztessünk egy 15 perces bemutatót a(z) <strong style={{ color: C.ink }}>{form.business}</strong> számára.
        </p>
        <button onClick={onBack} style={btnSecondary}>← Vissza a főoldalra</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.mist, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ marginBottom: 28 }}>
        <Wordmark size={22} />
      </div>
      <div style={{
        width: '100%', maxWidth: 420, background: C.paper, borderRadius: 16,
        border: `1px solid ${C.line}`, padding: '32px 28px', boxShadow: '0 20px 50px rgba(21,19,28,0.08)',
      }}>
        <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 6px' }}>
          Kérj demót
        </h1>
        <p style={{ fontSize: 13.5, color: C.slate, margin: '0 0 24px', lineHeight: 1.5 }}>
          15 perces, kötelezettség nélküli bemutató a saját vendéglátóhelyedre szabva.
        </p>

        <label style={fieldLabel}>Neved</label>
        <input value={form.name} onChange={set('name')} placeholder="Kovács Anna" style={fieldInput} />

        <label style={{ ...fieldLabel, marginTop: 16 }}>E-mail cím</label>
        <input type="email" value={form.email} onChange={set('email')} placeholder="anna@kavezoaroma.hu" style={fieldInput} />

        <label style={{ ...fieldLabel, marginTop: 16 }}>Vendéglátóhely neve</label>
        <input value={form.business} onChange={set('business')} placeholder="Kávézó Aroma" style={fieldInput} />

        <label style={{ ...fieldLabel, marginTop: 16 }}>Üzenet (opcionális)</label>
        <textarea
          value={form.message} onChange={set('message')} placeholder="Pár szó a vendéglátóhelyedről..."
          style={{ ...fieldInput, height: 80, padding: '10px 12px', resize: 'none', fontFamily: 'system-ui, sans-serif' }}
        />

        <button
          disabled={!complete}
          onClick={() => setSubmitted(true)}
          style={{ ...btnPrimary, width: '100%', marginTop: 22, opacity: complete ? 1 : 0.4, cursor: complete ? 'pointer' : 'not-allowed' }}
        >
          Demó kérése
        </button>
      </div>
      <button onClick={onBack} style={{ ...navGhost, marginTop: 20, color: C.slate }}>
        ← Vissza a főoldalra
      </button>
    </div>
  );
}

// ---- Reusable loading spinner: simulates the wait for a real API/auth call in production ----
function Spinner({ size = 18, color }) {
  return (
    <span
      style={{
        display: 'inline-block', width: size, height: size,
        border: `2.5px solid rgba(255,255,255,0.35)`,
        borderTopColor: color || '#fff',
        borderRadius: '50%',
        animation: 'guestly-spin 0.7s linear infinite',
      }}
    />
  );
}

function Login({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => onSuccess('owner'), 700); // simulated auth round-trip
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.mist, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`@keyframes guestly-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ marginBottom: 28 }}>
        <Wordmark size={22} />
      </div>
      <div style={{
        width: '100%', maxWidth: 380, background: C.paper, borderRadius: 16,
        border: `1px solid ${C.line}`, padding: '32px 28px', boxShadow: '0 20px 50px rgba(21,19,28,0.08)',
      }}>
        <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 6px' }}>
          Üdvözlünk újra
        </h1>
        <p style={{ fontSize: 13.5, color: C.slate, margin: '0 0 24px' }}>
          Jelentkezz be az üzleted statisztikáinak megtekintéséhez.
        </p>

        <label style={fieldLabel}>E-mail cím</label>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}
          placeholder="partner@kavezoaroma.hu" style={fieldInput}
        />

        <label style={{ ...fieldLabel, marginTop: 16 }}>Jelszó</label>
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)} disabled={loading}
          placeholder="••••••••" style={fieldInput}
        />

        <button
          onClick={handleLogin} disabled={loading}
          style={{ ...btnPrimary, width: '100%', marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.75 : 1 }}
        >
          {loading ? <><Spinner size={15} /> Bejelentkezés…</> : 'Bejelentkezés'}
        </button>

        <div style={{ fontSize: 12, color: C.slate, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          Demó mód — bármilyen adattal beléphetsz.
        </div>
      </div>
      <button onClick={onBack} disabled={loading} style={{ ...navGhost, marginTop: 20, color: C.slate }}>
        ← Vissza a főoldalra
      </button>
    </div>
  );
}

// ---- Admin login: separate, discreet entry point — not linked from normal owner flow ----
function AdminLogin({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => onSuccess('admin'), 700);
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.ink, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ marginBottom: 28 }}>
        <Wordmark size={22} dark />
      </div>
      <div style={{
        width: '100%', maxWidth: 380, background: '#201D29', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)', padding: '32px 28px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: C.cyan, marginBottom: 10,
        }}>
          Belső hozzáférés
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 6px' }}>
          Admin bejelentkezés
        </h1>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px' }}>
          Csak a Guestly csapata számára.
        </p>

        <label style={{ ...fieldLabel, color: '#fff' }}>E-mail cím</label>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}
          placeholder="te@guestly.hu"
          style={{ ...fieldInput, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
        />

        <label style={{ ...fieldLabel, color: '#fff', marginTop: 16 }}>Jelszó</label>
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)} disabled={loading}
          placeholder="••••••••"
          style={{ ...fieldInput, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
        />

        <button
          onClick={handleLogin} disabled={loading}
          style={{ ...btnPrimary, width: '100%', marginTop: 22, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.75 : 1 }}
        >
          {loading ? <><Spinner size={15} /> Belépés…</> : 'Belépés'}
        </button>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          Demó mód — bármilyen adattal beléphetsz.
        </div>
      </div>
      <button onClick={onBack} disabled={loading} style={{ ...navGhost, marginTop: 20, color: 'rgba(255,255,255,0.4)' }}>
        ← Vissza a főoldalra
      </button>
    </div>
  );
}

const fieldLabel = {
  display: 'block', fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6,
};

const fieldInput = {
  width: '100%', boxSizing: 'border-box', height: 44, borderRadius: 8,
  border: `1px solid ${C.line}`, padding: '0 12px', fontSize: 14,
  fontFamily: 'system-ui, sans-serif', outline: 'none', color: C.ink,
};

// ---- Owner dashboard (full hourly breakdown, reused pattern from the product prototype) ----
const DASH_HOURS = [8, 10, 12, 14, 16, 18, 20];
const DASH_DAYS = ['Hét', 'Ked', 'Sze', 'Csüt', 'Pén', 'Szo', 'Vas'];
const DASH_RANGE_LEN = 120; // enough history for any custom date range the owner might pick
const DASH_TODAY = new Date('2026-07-25T00:00:00');

function seedDashData() {
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const data = {}; // weekly: [day][hour]
  const daily = {}; // daily: [{ date, value }], last DASH_RANGE_LEN days
  DEFAULT_ASPECTS.forEach((a, ai) => {
    data[a.key] = DASH_DAYS.map((d, di) =>
      DASH_HOURS.map((h) => {
        let base = 8.2 - ai * 0.15;
        if ((di === 4 || di === 5) && h >= 18) {
          if (a.key === 'gyorsasag') base -= 2.6;
          if (a.key === 'tisztasag') base -= 1.4;
        }
        if (h === 8) base += 0.6;
        const val = Math.max(1, Math.min(10, base + (rand() - 0.5) * 1.6));
        return Math.round(val * 10) / 10;
      })
    );
    daily[a.key] = Array.from({ length: DASH_RANGE_LEN }, (_, dayIdx) => {
      const date = new Date(DASH_TODAY.getTime() - (DASH_RANGE_LEN - 1 - dayIdx) * 86400000);
      let base = 8.2 - ai * 0.15;
      const dow = date.getDay(); // 0 = Sunday
      if ((dow === 5 || dow === 6) && a.key === 'gyorsasag') base -= 1.3;
      // Gentle long-term improvement trend, plus noise
      base += (dayIdx / DASH_RANGE_LEN) * 0.5;
      const val = Math.max(1, Math.min(10, base + (rand() - 0.5) * 1.4));
      return { date, value: Math.round(val * 10) / 10 };
    });
  });
  return { hourly: data, daily };
}
const DASH_SEED = seedDashData();
const DASH_DATA = DASH_SEED.hourly;
const DASH_DAILY = DASH_SEED.daily;

function fmtShortDate(d) {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function avg(arr) {
  const flat = arr.flat();
  return flat.reduce((s, v) => s + v, 0) / flat.length;
}

// ---- Synthetic per-submission log, for the admin entry-level view ----
const LOG_VENUES = ['Kávézó Aroma', 'Bisztró Nap', 'Sör & Prézli Bár'];

const SAMPLE_REASONS = {
  tisztasag: ['Az asztal koszos volt', 'A mosdó nem volt tiszta', 'Morzsás volt a szék'],
  gyorsasag: ['Sokáig kellett várni a rendelésre', '25 percet vártunk az ételre', 'Lassú volt a kiszolgálás'],
  kiszolgalas: ['A személyzet barátságtalan volt', 'Senki nem figyelt ránk', 'Türelmetlen volt a felszolgáló'],
  etel: ['Hideg volt az étel', 'Túl sós volt a leves', 'Nem az volt, amit rendeltünk'],
  hangulat: ['Túl hangos volt a zene', 'Zsúfolt és kényelmetlen volt', 'Rossz volt a világítás'],
};

function seedSubmissions() {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const rows = [];
  const now = new Date('2026-07-25T21:00:00');
  for (let i = 0; i < 48; i++) {
    const minutesAgo = Math.floor(rand() * 60 * 24 * 7);
    const ts = new Date(now.getTime() - minutesAgo * 60000);
    const venue = LOG_VENUES[Math.floor(rand() * LOG_VENUES.length)];
    const scores = {};
    const reasons = {};
    DEFAULT_ASPECTS.forEach((a) => {
      const v = Math.max(1, Math.min(10, Math.round(7.5 + (rand() - 0.5) * 5)));
      scores[a.key] = v;
      if (v <= 3 && rand() > 0.3) {
        const options = SAMPLE_REASONS[a.key];
        reasons[a.key] = options[Math.floor(rand() * options.length)];
      }
    });
    const hasPrizeEntry = rand() > 0.4;
    rows.push({
      id: `SUB-${(1000 + i).toString(36).toUpperCase()}`,
      prizeId: hasPrizeEntry ? `PRZ-${(2000 + i).toString(36).toUpperCase()}` : null,
      email: hasPrizeEntry ? `vendeg${i}@example.com` : null,
      venue,
      ts,
      scores,
      reasons,
    });
  }
  return rows.sort((a, b) => b.ts - a.ts);
}
const SUBMISSIONS = seedSubmissions();

function fmtTs(d) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function relativeTime(date) {
  const now = new Date('2026-07-25T21:00:00');
  const diffMs = now - date;
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const diffDay = Math.round(diffMs / 86400000);
  if (diffMin < 1) return 'most';
  if (diffMin < 60) return `${diffMin} perce`;
  if (diffHr < 24) return `${diffHr} órája`;
  if (diffDay < 30) return `${diffDay} napja`;
  return fmtTs(date).split(' ')[0];
}

function exportRowsToCsv(rows, aspects) {
  const headers = ['id', 'prizeid', 'email', 'venue', 'timestamp', ...aspects.map((a) => a.key), 'reason'];
  const csvEscape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  rows.forEach((r) => {
    const reasonText = Object.values(r.reasons || {}).join(' | ');
    const row = [
      r.id, r.prizeId || '', r.email || '', r.venue, fmtTs(r.ts),
      ...aspects.map((a) => r.scores[a.key] ?? ''),
      reasonText,
    ];
    lines.push(row.map(csvEscape).join(','));
  });
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guestly-napló-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const SUBMISSION_COLUMNS = [
  { key: 'id', label: 'Szavazat ID', required: false },
  { key: 'prizeid', label: 'Sorsolás ID', required: false },
  { key: 'email', label: 'E-mail', required: false },
  { key: 'venue', label: 'Egység', required: true },
  { key: 'timestamp', label: 'Időpont', required: true },
  { key: 'tisztasag', label: 'Tisztaság', required: false },
  { key: 'gyorsasag', label: 'Gyorsaság', required: false },
  { key: 'kiszolgalas', label: 'Kiszolgálás', required: false },
  { key: 'etel', label: 'Étel-ital', required: false },
  { key: 'hangulat', label: 'Hangulat', required: false },
  { key: 'reason', label: 'Indoklás (gyenge pontnál)', required: false },
];

function AdminLog({ role = 'admin', ownVenue, focusVenue = null, onClearFocus }) {
  const [submissions, setSubmissions] = useState(SUBMISSIONS);
  const [venueFilter, setVenueFilter] = useState(role === 'owner' ? ownVenue : (focusVenue || 'all'));
  const [onlyPrize, setOnlyPrize] = useState(false);
  const [minScore, setMinScore] = useState('all'); // all | low | high
  const [dateRange, setDateRange] = useState(role === 'owner' ? 'all' : '7'); // 1 | 7 | 30 | all
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [drawResult, setDrawResult] = useState(null);
  const relevantVenue = role === 'owner' ? ownVenue : (venueFilter !== 'all' ? venueFilter : null);
  const ASPECTS = useAspects(relevantVenue);

  React.useEffect(() => {
    if (role === 'admin' && focusVenue) setVenueFilter(focusVenue);
  }, [focusVenue, role]);

  const now = new Date('2026-07-25T21:00:00');

  // Draw a winner strictly among today's prize-entrants for the currently selected venue.
  // The venue filter comes from state the user cannot bypass with a typed value — this is what
  // technically rules out a cross-venue draw, not just a UI convention.
  const drawTodayWinner = () => {
    if (!relevantVenue) return; // guard: never draw across "all venues"
    const todaysEligible = submissions.filter((r) => {
      if (r.venue !== relevantVenue) return false;
      if (!r.prizeId) return false;
      if (r.winnerId) return false; // already won before
      const daysAgo = (now - r.ts) / (1000 * 60 * 60 * 24);
      return daysAgo <= 1;
    });
    if (todaysEligible.length === 0) {
      setDrawResult({ venue: relevantVenue, winner: null });
      return;
    }
    const winner = todaysEligible[Math.floor(Math.random() * todaysEligible.length)];
    const drawId = `WIN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    setSubmissions(submissions.map((r) => (r.id === winner.id ? { ...r, winnerId: drawId } : r)));
    setDrawResult({ venue: relevantVenue, winner: { ...winner, winnerId: drawId } });
  };

  const importSubmissions = (rowsRaw) => {
    const parsed = rowsRaw
      .filter((r) => r.venue && r.timestamp)
      .map((r, i) => {
        const scores = {};
        ASPECTS.forEach((a) => {
          const v = parseFloat(r[a.key]);
          scores[a.key] = Number.isFinite(v) ? Math.max(1, Math.min(10, v)) : 7;
        });
        const reasons = {};
        if (r.reason && r.reason.trim()) {
          const worstKey = ASPECTS.map((a) => a.key).sort((x, y) => scores[x] - scores[y])[0];
          if (scores[worstKey] <= 3) reasons[worstKey] = r.reason.trim();
        }
        const ts = new Date(r.timestamp);
        return {
          id: r.id?.trim() || `SUB-IMP${i}`,
          prizeId: r.prizeid?.trim() || null,
          email: r.email?.trim() || null,
          venue: r.venue.trim(),
          ts: isNaN(ts) ? now : ts,
          scores,
          reasons,
        };
      });
    setSubmissions([...parsed, ...submissions].sort((a, b) => b.ts - a.ts));
  };

  const rows = submissions.filter((r) => {
    if (role === 'owner' && r.venue !== ownVenue) return false;
    if (role === 'admin' && venueFilter !== 'all' && r.venue !== venueFilter) return false;
    if (onlyPrize && !r.prizeId) return false;
    const daysAgo = (now - r.ts) / (1000 * 60 * 60 * 24);
    if (dateRange === '1' && daysAgo > 1) return false;
    if (dateRange === '7' && daysAgo > 7) return false;
    if (minScore !== 'all') {
      const worstScore = Math.min(...Object.values(r.scores));
      if (minScore === 'low' && worstScore >= 6) return false;
      if (minScore === 'high' && worstScore < 6) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [r.id, r.prizeId, r.email, r.venue].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      {role === 'admin' && focusVenue && venueFilter === focusVenue && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: C.mist, border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 12.5, color: C.ink }}>
            Szűrve: <strong>{focusVenue}</strong> — pontosan úgy látod, ahogy a partner.
          </div>
          <button
            onClick={() => { setVenueFilter('all'); onClearFocus && onClearFocus(); }}
            style={{ background: 'none', border: 'none', color: C.violet, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Szűrő törlése
          </button>
        </div>
      )}
      {role === 'admin' && relevantVenue && (
        <div style={{
          background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 2 }}>
                Napi sorsolás — {relevantVenue}
              </div>
              <div style={{ fontSize: 11.5, color: C.slate }}>
                Csak az ehhez az egységhez, ma beérkezett jelentkezők közül sorsol — más egység jelentkezői nem kerülhetnek be.
              </div>
            </div>
            <button onClick={drawTodayWinner} style={{ ...btnPrimary, height: 38, padding: '0 18px', fontSize: 12.5 }}>
              🎲 Mai nyertes sorsolása
            </button>
          </div>

          {drawResult && drawResult.venue === relevantVenue && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
              {drawResult.winner ? (
                <div style={{ fontSize: 12.5, color: C.ink }}>
                  ✓ Nyertes: <strong style={{ fontFamily: 'monospace', color: C.violet }}>{drawResult.winner.id}</strong>
                  {drawResult.winner.email && <> — <strong>{drawResult.winner.email}</strong></>}
                  <span style={{ color: C.slate }}> · Sorsolás azonosító: {drawResult.winner.winnerId}</span>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: C.slate }}>
                  Nincs ma jelentkező ehhez az egységhez — nincs kit sorsolni.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {role === 'admin' && (
        <CsvImport
          expectedColumns={SUBMISSION_COLUMNS}
          exampleHeader="id,prizeid,email,venue,timestamp,tisztasag,gyorsasag,kiszolgalas,etel,hangulat"
          onImport={importSubmissions}
        />
      )}
      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Keresés szavazat ID, sorsolás ID, e-mail vagy egység szerint…"
        style={{ ...fieldInput, height: 36, marginBottom: 10, width: '100%' }}
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {role === 'admin' && (
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">Összes egység</option>
            {LOG_VENUES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={selectStyle}>
          <option value="1">Elmúlt 24 óra</option>
          <option value="7">Elmúlt 7 nap</option>
          <option value="30">Elmúlt 30 nap</option>
          <option value="all">Összes (kezdettől)</option>
        </select>
        <select value={minScore} onChange={(e) => setMinScore(e.target.value)} style={selectStyle}>
          <option value="all">Minden pontszám</option>
          <option value="low">Van gyenge szempont (&lt;6)</option>
          <option value="high">Csak erős értékelések (6+)</option>
        </select>
        {role === 'admin' && (
          <button
            onClick={() => setOnlyPrize(!onlyPrize)}
            style={{
              height: 34, borderRadius: 8, border: onlyPrize ? `1px solid ${C.ink}` : `1px solid ${C.line}`,
              background: onlyPrize ? C.ink : C.paper, color: onlyPrize ? '#fff' : C.ink,
              fontSize: 12, fontWeight: 600, padding: '0 12px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
            }}
          >
            Csak sorsolásra jelentkezettek
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: C.slate, alignSelf: 'center' }}>
          {rows.length} találat
        </div>
      </div>

      {role === 'admin' && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12,
          background: C.mist, border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>
            {selectedIds.length} kijelölve
          </span>
          <button
            onClick={() => exportRowsToCsv(rows, ASPECTS)}
            style={{ ...btnSecondary, height: 32, padding: '0 14px', fontSize: 11.5 }}
          >
            Összes találat exportálása (CSV)
          </button>
          {selectedIds.length > 0 && (
            confirmBulkDelete ? (
              <span style={{ display: 'inline-flex', gap: 6 }}>
                <button
                  onClick={() => {
                    setSubmissions(submissions.filter((s) => !selectedIds.includes(s.id)));
                    setSelectedIds([]);
                    setConfirmBulkDelete(false);
                  }}
                  style={{ background: C.magenta, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Törlés megerősítése
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(false)}
                  style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', color: C.slate }}
                >
                  Mégsem
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmBulkDelete(true)}
                style={{ height: 32, padding: '0 14px', fontSize: 11.5, borderRadius: 8, border: 'none', background: 'none', color: C.slate, fontWeight: 600, cursor: 'pointer' }}
              >
                Kijelöltek törlése
              </button>
            )
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto', background: C.paper, borderRadius: 12, border: `1px solid ${C.line}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: role === 'admin' ? 940 : 780 }}>
          <thead>
            <tr style={{ background: C.mist, textAlign: 'left' }}>
              {role === 'admin' && (
                <th style={th}>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))}
                    onChange={() => {
                      const rowIds = rows.map((r) => r.id);
                      const allSelected = rowIds.every((id) => selectedIds.includes(id));
                      setSelectedIds(allSelected ? selectedIds.filter((id) => !rowIds.includes(id)) : [...new Set([...selectedIds, ...rowIds])]);
                    }}
                  />
                </th>
              )}
              <th style={th}>Szavazat ID</th>
              {role === 'admin' && <th style={th}>Sorsolás ID</th>}
              {role === 'admin' && <th style={th}>E-mail</th>}
              {role === 'admin' && <th style={th}>Egység</th>}
              <th style={th}>Időpont</th>
              {ASPECTS.map((a) => <th key={a.key} style={{ ...th, textAlign: 'center' }}>{a.label.split(' ')[0]}</th>)}
              <th style={th}>Indoklás</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const reasonEntries = Object.entries(r.reasons || {});
              return (
              <tr key={r.id} style={{ borderTop: `1px solid ${C.line}` }}>
                {role === 'admin' && (
                  <td style={td}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => setSelectedIds((prev) => (prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]))}
                    />
                  </td>
                )}
                <td style={{ ...td, fontFamily: 'monospace', color: C.violet, fontWeight: 700 }}>{r.id}</td>
                {role === 'admin' && (
                  <td style={{ ...td, fontFamily: 'monospace', color: r.prizeId ? C.ink : C.slate }}>
                    {r.prizeId || '—'}
                    {r.winnerId && (
                      <span style={{
                        marginLeft: 6, fontFamily: 'system-ui, sans-serif', fontSize: 10, fontWeight: 700,
                        color: C.green, background: '#E8F5EE', padding: '2px 6px', borderRadius: 999,
                      }}>
                        🎉 nyertes
                      </span>
                    )}
                  </td>
                )}
                {role === 'admin' && (
                  <td style={{ ...td, color: r.email ? C.ink : C.slate }}>{r.email || '—'}</td>
                )}
                {role === 'admin' && <td style={td}>{r.venue}</td>}
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: C.slate }}>{fmtTs(r.ts)}</td>
                {ASPECTS.map((a) => (
                  <td key={a.key} style={{ ...td, textAlign: 'center', fontWeight: 700, color: r.scores[a.key] < 6 ? C.magenta : C.ink }}>
                    {r.scores[a.key]}
                  </td>
                ))}
                <td style={{ ...td, whiteSpace: 'normal', maxWidth: 220, color: reasonEntries.length ? C.ink : C.slate, fontSize: 11.5 }}>
                  {reasonEntries.length
                    ? reasonEntries.map(([k, txt]) => (
                        <div key={k} style={{ marginBottom: 2 }}>
                          <span style={{ color: C.magenta, fontWeight: 700 }}>{ASPECTS.find((a) => a.key === k)?.label.split(' ')[0]}:</span> {txt}
                        </div>
                      ))
                    : '—'}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {role === 'owner' && (
        <div style={{ fontSize: 11, color: C.slate, marginTop: 10, lineHeight: 1.5 }}>
          Adatvédelmi okból a vendégek e-mail címét és a sorsolási azonosítót csak a Guestly admin felülete mutatja.
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  height: 34, borderRadius: 8, border: `1px solid ${C.line}`, background: C.paper,
  fontSize: 12, padding: '0 10px', color: C.ink, fontFamily: 'system-ui, sans-serif',
};

const th = { padding: '9px 12px', fontSize: 11, fontWeight: 700, color: C.slate, whiteSpace: 'nowrap' };
const td = { padding: '9px 12px', whiteSpace: 'nowrap' };

// ---- Partner (venue) management — admin only ----
// ---- Generic CSV import helper, reused by Partners and the submissions log ----
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const splitLine = (l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

function CsvImport({ expectedColumns, onImport, exampleHeader }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleFile = (file) => {
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCsv(e.target.result);
      const missing = expectedColumns.filter((c) => c.required && !headers.includes(c.key));
      if (missing.length > 0) {
        setError(`Hiányzó oszlop(ok): ${missing.map((m) => m.key).join(', ')}`);
        setPreview(null);
        return;
      }
      const objs = rows.map((r) => {
        const obj = {};
        expectedColumns.forEach((c) => {
          const idx = headers.indexOf(c.key);
          obj[c.key] = idx >= 0 ? (r[idx] || '') : '';
        });
        return obj;
      });
      setPreview(objs);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (preview) onImport(preview);
    setPreview(null);
    setFileName('');
    setOpen(false);
  };

  return (
    <div style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: 16, marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'system-ui, sans-serif',
        }}
      >
        CSV importálás
        <span style={{ color: C.slate, fontSize: 16 }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11.5, color: C.slate, marginBottom: 10, lineHeight: 1.5 }}>
            Várt oszlopok (fejléc sorban, vesszővel elválasztva): <code style={{ background: C.mist, padding: '1px 5px', borderRadius: 4 }}>{exampleHeader}</code>
          </div>
          <input
            ref={fileInputRef} type="file" accept=".csv,text/csv"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ ...btnSecondary, height: 38, fontSize: 12.5 }}
          >
            {fileName || 'Fájl kiválasztása…'}
          </button>

          {error && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.magenta, fontWeight: 600 }}>{error}</div>
          )}

          {preview && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: C.slate, marginBottom: 8 }}>
                {preview.length} sor beolvasva — ellenőrizd, majd erősítsd meg.
              </div>
              <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, minWidth: 480 }}>
                  <thead>
                    <tr style={{ background: C.mist }}>
                      {expectedColumns.map((c) => <th key={c.key} style={th}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                        {expectedColumns.map((c) => <td key={c.key} style={td}>{row[c.key] || '—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 5 && (
                <div style={{ fontSize: 11, color: C.slate, marginBottom: 12 }}>…és még {preview.length - 5} sor.</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={confirmImport} style={{ ...btnPrimary, height: 38, fontSize: 12.5 }}>
                  {preview.length} sor importálása
                </button>
                <button
                  onClick={() => { setPreview(null); setFileName(''); }}
                  style={{ ...btnSecondary, height: 38, fontSize: 12.5 }}
                >
                  Mégsem
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function genVenueId() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `VEN-${rand}`;
}

const SEED_PARTNERS = [
  {
    id: 'VEN-A0K3F', name: 'Kávézó Aroma',
    address: '1901 Hollywood Blvd, Hollywood, FL 33020',
    phone: '+1 (954) 555-0142', email: 'info@kavezoaroma.com',
    contactName: 'Kovács Anna', contactPhone: '+1 (954) 555-0143',
    addedAt: '2026.06.02.', lastModifiedAt: new Date('2026-07-20T14:22:00'),
  },
  {
    id: 'VEN-B7J1Q', name: 'Bisztró Nap',
    address: '212 SW 2nd St, Fort Lauderdale, FL 33301',
    phone: '+1 (954) 555-0198', email: 'kapcsolat@bisztronap.com',
    contactName: 'Nagy Péter', contactPhone: '+1 (954) 555-0199',
    addedAt: '2026.06.14.', lastModifiedAt: new Date('2026-06-14T09:10:00'),
  },
  {
    id: 'VEN-C4M9X', name: 'Sör & Prézli Bár',
    address: '1420 Harrison St, Hollywood, FL 33020',
    phone: '+1 (954) 555-0177', email: 'info@sorprezli.com',
    contactName: 'Tóth Gábor', contactPhone: '+1 (954) 555-0178',
    addedAt: '2026.07.03.', lastModifiedAt: new Date('2026-07-23T17:45:00'),
  },
];

const emptyPartnerForm = { name: '', address: '', phone: '', email: '', contactName: '', contactPhone: '' };

const PARTNER_COLUMNS = [
  { key: 'name', label: 'Név', required: true },
  { key: 'address', label: 'Cím', required: false },
  { key: 'phone', label: 'Telefon', required: false },
  { key: 'email', label: 'E-mail', required: false },
  { key: 'contactname', label: 'Kapcsolattartó', required: false },
  { key: 'contactphone', label: 'Kapcsolattartó tel.', required: false },
];

function PartnerManager({ onSelectPartner }) {
  const [partners, setPartners] = useState(SEED_PARTNERS);
  const [form, setForm] = useState(emptyPartnerForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [qrModalFor, setQrModalFor] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addPartner = () => {
    if (!form.name.trim()) return;
    const newPartner = {
      id: genVenueId(),
      name: form.name.trim(),
      address: form.address.trim() || '—',
      phone: form.phone.trim() || '—',
      email: form.email.trim() || '—',
      contactName: form.contactName.trim() || '—',
      contactPhone: form.contactPhone.trim() || '—',
      addedAt: fmtTs(new Date()).split(' ')[0],
      lastModifiedAt: new Date(),
    };
    setPartners([newPartner, ...partners]);
    setForm(emptyPartnerForm);
    setShowForm(false);
  };

  const startEditPartner = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      address: p.address === '—' ? '' : p.address,
      phone: p.phone === '—' ? '' : p.phone,
      email: p.email === '—' ? '' : p.email,
      contactName: p.contactName === '—' ? '' : p.contactName,
      contactPhone: p.contactPhone === '—' ? '' : p.contactPhone,
    });
    setShowForm(true);
  };

  const saveEditPartner = () => {
    if (!form.name.trim()) return;
    setPartners(partners.map((p) => (p.id === editingId ? {
      ...p,
      name: form.name.trim(),
      address: form.address.trim() || '—',
      phone: form.phone.trim() || '—',
      email: form.email.trim() || '—',
      contactName: form.contactName.trim() || '—',
      contactPhone: form.contactPhone.trim() || '—',
      lastModifiedAt: new Date(),
    } : p)));
    setEditingId(null);
    setForm(emptyPartnerForm);
    setShowForm(false);
  };

  const cancelForm = () => {
    setEditingId(null);
    setForm(emptyPartnerForm);
    setShowForm(false);
  };

  const removePartner = (id) => {
    setPartners(partners.filter((p) => p.id !== id));
    setConfirmDelete(null);
  };

  const importPartners = (rows) => {
    const imported = rows
      .filter((r) => r.name && r.name.trim())
      .map((r) => ({
        id: genVenueId(),
        name: r.name.trim(),
        address: r.address?.trim() || '—',
        phone: r.phone?.trim() || '—',
        email: r.email?.trim() || '—',
        contactName: r.contactname?.trim() || '—',
        contactPhone: r.contactphone?.trim() || '—',
        addedAt: fmtTs(new Date()).split(' ')[0],
      }));
    setPartners([...imported, ...partners]);
  };

  return (
    <div>
      <div style={{
        background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`,
        padding: 16, marginBottom: 16,
      }}>
        <button
          onClick={() => (showForm ? cancelForm() : setShowForm(true))}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'system-ui, sans-serif',
          }}
        >
          {editingId ? 'Egység szerkesztése' : 'Új vendéglátóegység hozzáadása'}
          <span style={{ color: C.slate, fontSize: 16 }}>{showForm ? '−' : '+'}</span>
        </button>

        {showForm && (
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            <div>
              <label style={fieldLabel}>Egység neve</label>
              <input value={form.name} onChange={set('name')} placeholder="Kávézó Aroma" style={{ ...fieldInput, height: 38 }} />
            </div>
            <div>
              <label style={fieldLabel}>Pontos cím</label>
              <input value={form.address} onChange={set('address')} placeholder="Utca, házszám, város, irányítószám" style={{ ...fieldInput, height: 38 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={fieldLabel}>Telefonszám</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+1 (954) 555-0100" style={{ ...fieldInput, height: 38 }} />
              </div>
              <div>
                <label style={fieldLabel}>E-mail cím</label>
                <input value={form.email} onChange={set('email')} placeholder="info@egyseg.com" style={{ ...fieldInput, height: 38 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={fieldLabel}>Kapcsolattartó neve</label>
                <input value={form.contactName} onChange={set('contactName')} placeholder="Kovács Anna" style={{ ...fieldInput, height: 38 }} />
              </div>
              <div>
                <label style={fieldLabel}>Kapcsolattartó telefonszáma</label>
                <input value={form.contactPhone} onChange={set('contactPhone')} placeholder="+1 (954) 555-0101" style={{ ...fieldInput, height: 38 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={editingId ? saveEditPartner : addPartner}
                disabled={!form.name.trim()}
                style={{ ...btnPrimary, height: 40, marginTop: 4, opacity: form.name.trim() ? 1 : 0.4, cursor: form.name.trim() ? 'pointer' : 'not-allowed' }}
              >
                {editingId ? 'Módosítások mentése' : 'Egység hozzáadása'}
              </button>
              {editingId && (
                <button onClick={cancelForm} style={{ ...btnSecondary, height: 40, marginTop: 4 }}>
                  Mégsem
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <CsvImport
        expectedColumns={PARTNER_COLUMNS}
        exampleHeader="name,address,phone,email,contactname,contactphone"
        onImport={importPartners}
      />

      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Keresés név, cím, e-mail vagy kapcsolattartó szerint…"
        style={{ ...fieldInput, height: 36, marginBottom: 10, width: '100%' }}
      />

      <div style={{ overflowX: 'auto', background: C.paper, borderRadius: 12, border: `1px solid ${C.line}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 860 }}>
          <thead>
            <tr style={{ background: C.mist, textAlign: 'left' }}>
              <th style={th}>Egység ID</th>
              <th style={th}>Név</th>
              <th style={th}>Cím</th>
              <th style={th}>Telefon</th>
              <th style={th}>E-mail</th>
              <th style={th}>Kapcsolattartó</th>
              <th style={th}>Kapcsolattartó tel.</th>
              <th style={th}>Hozzáadva</th>
              <th style={th}>Legutóbb módosítva</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {partners.filter((p) => {
              if (!search.trim()) return true;
              const q = search.trim().toLowerCase();
              return [p.name, p.address, p.email, p.contactName, p.phone].filter(Boolean).join(' ').toLowerCase().includes(q);
            }).map((p) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ ...td, fontFamily: 'monospace', color: C.violet, fontWeight: 700 }}>{p.id}</td>
                <td style={{ ...td, fontWeight: 600, color: C.ink }}>
                  <button
                    onClick={() => onSelectPartner(p.name)}
                    style={{ background: 'none', border: 'none', padding: 0, color: C.ink, fontWeight: 600, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: C.line }}
                  >
                    {p.name}
                  </button>
                </td>
                <td style={{ ...td, color: C.slate, whiteSpace: 'normal', maxWidth: 220 }}>{p.address}</td>
                <td style={{ ...td, color: C.slate }}>{p.phone}</td>
                <td style={{ ...td, color: C.slate }}>{p.email}</td>
                <td style={{ ...td, color: C.slate }}>{p.contactName}</td>
                <td style={{ ...td, color: C.slate }}>{p.contactPhone}</td>
                <td style={{ ...td, color: C.slate }}>{p.addedAt}</td>
                <td style={{ ...td, color: C.slate }} title={p.lastModifiedAt ? fmtTs(p.lastModifiedAt) : ''}>
                  {p.lastModifiedAt ? relativeTime(p.lastModifiedAt) : '—'}
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                  <button
                    onClick={() => onSelectPartner(p.name)}
                    style={{ background: 'none', border: 'none', color: C.violet, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Napló →
                  </button>
                  <button
                    onClick={() => setQrModalFor(p)}
                    style={{ background: 'none', border: 'none', color: C.ink, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    QR-kód
                  </button>
                  <button
                    onClick={() => startEditPartner(p)}
                    style={{ background: 'none', border: 'none', color: C.ink, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Szerkesztés
                  </button>
                  {confirmDelete === p.id ? (
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => removePartner(p.id)}
                        style={{ background: C.magenta, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Törlés megerősítése
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', color: C.slate }}
                      >
                        Mégsem
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      style={{ background: 'none', border: 'none', color: C.slate, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Törlés
                    </button>
                  )}
                  </span>
                </td>
              </tr>
            ))}
            {partners.filter((p) => {
              if (!search.trim()) return true;
              const q = search.trim().toLowerCase();
              return [p.name, p.address, p.email, p.contactName, p.phone].filter(Boolean).join(' ').toLowerCase().includes(q);
            }).length === 0 && (
              <tr>
                <td colSpan={10} style={{ ...td, textAlign: 'center', color: C.slate, padding: 20 }}>
                  {partners.length === 0 ? 'Nincs még felvett egység.' : 'Nincs a keresésnek megfelelő egység.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      <div style={{ fontSize: 11, color: C.slate, marginTop: 10, lineHeight: 1.5 }}>
        Demó mód — a lista csak ebben a munkamenetben él, nem mentődik el.
      </div>

      {qrModalFor && <QRCodeModal partner={qrModalFor} onClose={() => setQrModalFor(null)} />}
    </div>
  );
}

// ---- QR code generation modal (demo): deterministic decorative glyph, not a scannable code ----
function seededGlyph(seedStr, size = 10) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 100000;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const cells = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const isFinder = (i < 3 && j < 3) || (i < 3 && j > size - 4) || (i > size - 4 && j < 3);
      cells.push(isFinder || rand() > 0.5);
    }
  }
  return cells;
}

function QRCodeModal({ partner, onClose }) {
  React.useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const url = `guestly.hu/ertekeles/${partner.id}`;
  const cells = seededGlyph(partner.id, 12);
  const cell = 14;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(21,19,28,0.55)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.paper, borderRadius: 16, padding: 28, maxWidth: 340, width: '100%', textAlign: 'center' }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.violet, fontWeight: 700, marginBottom: 6 }}>
          QR-kód
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{partner.name}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.slate, marginBottom: 18 }}>{partner.id}</div>

        <div style={{
          display: 'inline-grid', gridTemplateColumns: `repeat(12, ${cell}px)`, gridTemplateRows: `repeat(12, ${cell}px)`,
          gap: 1, padding: 16, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, marginBottom: 16,
        }}>
          {cells.map((on, i) => (
            <div key={i} style={{ width: cell, height: cell, background: on ? C.ink : 'transparent' }} />
          ))}
        </div>

        <div style={{ fontSize: 11, color: C.slate, marginBottom: 18, wordBreak: 'break-all' }}>{url}</div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            style={{ ...btnPrimary, height: 38, padding: '0 18px', fontSize: 12.5, opacity: 0.5, cursor: 'not-allowed' }}
            disabled
            title="Éles verzióban tényleges letöltést indítana"
          >
            Letöltés (PNG) — élesben
          </button>
          <button style={{ ...btnSecondary, height: 38, padding: '0 18px', fontSize: 12.5 }} onClick={onClose}>
            Bezárás
          </button>
        </div>

        <div style={{ fontSize: 10.5, color: C.slate, marginTop: 16, lineHeight: 1.5 }}>
          Demó — ez a kód vizuálisan mutatja a folyamatot, de nem valódi, beolvasható QR-kód.
          Élesben ez a gomb egy tényleges, a partner egyedi URL-jére mutató kódot generálna.
        </div>
      </div>
    </div>
  );
}

function DashHeatmap({ aspectKey, period = 'week', selectedDay, onSelectDay }) {
  if (period === 'day') {
    const dayIdx = DASH_DAYS.indexOf(selectedDay);
    const row = DASH_DATA[aspectKey][dayIdx >= 0 ? dayIdx : 0];
    const chartData = DASH_HOURS.map((h, hi) => ({ hour: `${h}h`, value: row[hi] }));
    return (
      <div>
        <select
          value={selectedDay}
          onChange={(e) => onSelectDay(e.target.value)}
          style={{ ...selectStyle, marginBottom: 14 }}
        >
          {DASH_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke={C.line} />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => v.toFixed(1)}
              contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }}
            />
            <ReferenceLine y={6.5} stroke={C.magenta} strokeDasharray="4 4" />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={heatColor(d.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (period === 'month') {
    const minDate = DASH_DAILY[aspectKey][0].date;
    const maxDate = DASH_TODAY;
    const defaultStart = new Date(maxDate.getTime() - 29 * 86400000);
    const rangeStart = selectedDay?.start ? new Date(selectedDay.start) : defaultStart;
    const rangeEnd = selectedDay?.end ? new Date(selectedDay.end) : maxDate;

    const filtered = DASH_DAILY[aspectKey].filter((d) => d.date >= rangeStart && d.date <= rangeEnd);
    const chartData = filtered.map((d) => ({ day: fmtShortDate(d.date), value: d.value }));
    const rangeAvg = filtered.length ? filtered.reduce((s, d) => s + d.value, 0) / filtered.length : null;

    const applyPreset = (days) => {
      const end = maxDate;
      const start = new Date(end.getTime() - (days - 1) * 86400000);
      onSelectDay({ start: isoDate(start), end: isoDate(end) });
    };

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {[[7, '7 nap'], [30, '30 nap'], [90, '90 nap']].map(([days, label]) => (
            <button
              key={days}
              onClick={() => applyPreset(days)}
              style={{
                border: `1px solid ${C.line}`, borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: 700,
                background: C.paper, color: C.slate, cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>Ettől:</label>
          <input
            type="date"
            value={isoDate(rangeStart)}
            min={isoDate(minDate)} max={isoDate(maxDate)}
            onChange={(e) => onSelectDay({ start: e.target.value, end: isoDate(rangeEnd) })}
            style={{ ...fieldInput, height: 32, fontSize: 12, width: 'auto' }}
          />
          <label style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>Eddig:</label>
          <input
            type="date"
            value={isoDate(rangeEnd)}
            min={isoDate(minDate)} max={isoDate(maxDate)}
            onChange={(e) => onSelectDay({ start: isoDate(rangeStart), end: e.target.value })}
            style={{ ...fieldInput, height: 32, fontSize: 12, width: 'auto' }}
          />
        </div>

        {chartData.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: C.slate, fontSize: 13 }}>
            Nincs adat a kiválasztott időszakra.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke={C.line} />
                <XAxis
                  dataKey="day" tick={{ fontSize: 10, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false}
                  interval={Math.max(0, Math.floor(chartData.length / 8))}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => v.toFixed(1)}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }}
                />
                <ReferenceLine y={6.5} stroke={C.magenta} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="value" stroke={C.violet} strokeWidth={2.5} dot={chartData.length <= 31} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: C.slate }}>
              <span>{chartData.length} nap átlaga: <strong style={{ color: C.ink }}>{rangeAvg.toFixed(1)}</strong></span>
              <span>A szaggatott vonal a 6.5-es figyelmeztetési küszöb</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // week (default)
  const grid = DASH_DATA[aspectKey];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${DASH_HOURS.length}, 1fr)`, gap: 3, marginBottom: 6 }}>
        <div />
        {DASH_HOURS.map((h) => (
          <div key={h} style={{ fontSize: 10, color: C.slate, textAlign: 'center' }}>{h}h</div>
        ))}
      </div>
      {DASH_DAYS.map((d, di) => (
        <div key={d} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${DASH_HOURS.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
          <div style={{ fontSize: 11, color: C.slate, display: 'flex', alignItems: 'center' }}>{d}</div>
          {grid[di].map((v, hi) => (
            <div key={hi} title={`${d} ${DASH_HOURS[hi]}h: ${v}`} style={{
              aspectRatio: '1', borderRadius: 5, background: heatColor(v),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: v < 5 ? '#fff' : C.ink,
            }}>
              {v.toFixed(1)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---- Admin portfolio overview: cross-venue stats, ranking, alerts, prize-entry counts ----
function getAspectsForVenue(venueName, questionSets, partnerAssignments) {
  const setId = partnerAssignments[venueName] || 'QS-ALAP';
  const set = questionSets.find((s) => s.id === setId) || questionSets[0];
  return set ? set.aspects : DEFAULT_ASPECTS;
}

function computeVenueStats(submissions, venues, questionSets, partnerAssignments) {
  return venues.map((venueName) => {
    const rows = submissions.filter((r) => r.venue === venueName);
    const allScores = rows.flatMap((r) => Object.values(r.scores));
    const avgScore = allScores.length ? allScores.reduce((s, v) => s + v, 0) / allScores.length : null;
    const prizeCount = rows.filter((r) => r.prizeId).length;
    const venueAspects = getAspectsForVenue(venueName, questionSets, partnerAssignments);
    const worstAspect = venueAspects
      .map((a) => {
        const vals = rows.map((r) => r.scores[a.key]).filter((v) => v != null);
        const avgV = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
        return { ...a, avg: avgV };
      })
      .filter((a) => a.avg != null)
      .sort((a, b) => a.avg - b.avg)[0];
    return { venue: venueName, reviewCount: rows.length, avgScore, prizeCount, worstAspect };
  });
}

function AdminOverview() {
  const { questionSets, partnerAssignments } = useQuestionSets();
  const [submissions] = useState(SUBMISSIONS);
  const [partners] = useState(SEED_PARTNERS);
  const [search, setSearch] = useState('');

  const now = new Date('2026-07-25T21:00:00');
  const last24h = submissions.filter((r) => (now - r.ts) / (1000 * 60 * 60) <= 24).length;
  const last7d = submissions.filter((r) => (now - r.ts) / (1000 * 60 * 60 * 24) <= 7).length;
  const totalPrizeEntries = submissions.filter((r) => r.prizeId).length;
  const responseRate = submissions.length ? Math.round((totalPrizeEntries / submissions.length) * 100) : 0;

  const venueStats = computeVenueStats(submissions, LOG_VENUES, questionSets, partnerAssignments).sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
  const visibleVenueStats = venueStats.filter((v) => !search.trim() || v.venue.toLowerCase().includes(search.trim().toLowerCase()));

  const alerts = venueStats
    .filter((v) => v.worstAspect && v.worstAspect.avg < 6.5)
    .sort((a, b) => a.worstAspect.avg - b.worstAspect.avg);

  return (
    <div>
      {/* Portfolio summary numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
          ['Aktív partnerek', partners.length],
          ['Értékelés (24 óra)', last24h],
          ['Értékelés (7 nap)', last7d],
          ['Sorsolásra jelentkezett', `${totalPrizeEntries} (${responseRate}%)`],
        ].map(([label, val]) => (
          <div key={label} style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, color: C.slate, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Figyelendő egységek</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {alerts.map((a) => (
              <div key={a.venue} style={{
                background: C.ink, color: '#fff', borderRadius: 10, padding: '12px 14px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16 }}>⚠</span>
                <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                  <strong>{a.venue}</strong> — <span style={{ color: C.cyan }}>{a.worstAspect.label}</span> gyenge
                  {' '}(átlag {a.worstAspect.avg.toFixed(1)})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Venue ranking */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Egységek rangsora</div>
          <div style={{ fontSize: 12, color: C.slate }}>
            Összes értékelés: <strong style={{ color: C.ink }}>{venueStats.reduce((s, v) => s + v.reviewCount, 0)}</strong>
          </div>
        </div>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés egység neve szerint…" style={{ ...fieldInput, height: 36, marginBottom: 10 }}
        />
        <div style={{ overflowX: 'auto', background: C.paper, borderRadius: 12, border: `1px solid ${C.line}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 620 }}>
            <thead>
              <tr style={{ background: C.mist, textAlign: 'left' }}>
                <th style={th}>#</th>
                <th style={th}>Egység</th>
                <th style={{ ...th, textAlign: 'center' }}>Átlag</th>
                <th style={{ ...th, textAlign: 'center' }}>Értékelés</th>
                <th style={{ ...th, textAlign: 'center' }}>Sorsolás</th>
                <th style={th}>Leggyengébb szempont</th>
              </tr>
            </thead>
            <tbody>
              {visibleVenueStats.map((v) => (
                <tr key={v.venue} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ ...td, color: C.slate }}>{venueStats.indexOf(v) + 1}</td>
                  <td style={{ ...td, fontWeight: 700, color: C.ink }}>{v.venue}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: v.avgScore < 6.5 ? C.magenta : C.ink }}>
                    {v.avgScore != null ? v.avgScore.toFixed(1) : '—'}
                  </td>
                  <td style={{ ...td, textAlign: 'center', color: C.slate }}>{v.reviewCount}</td>
                  <td style={{ ...td, textAlign: 'center', color: C.slate }}>{v.prizeCount}</td>
                  <td style={{ ...td, color: C.slate }}>
                    {v.worstAspect ? `${v.worstAspect.label} (${v.worstAspect.avg.toFixed(1)})` : '—'}
                  </td>
                </tr>
              ))}
              {visibleVenueStats.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: 'center', color: C.slate, padding: 20 }}>
                    Nincs a keresésnek megfelelő egység.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Question settings: admin-editable evaluation aspects (add/edit/remove) ----
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24) || `szempont${Math.random().toString(36).slice(2, 6)}`;
}

function genSetId() {
  return `QS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ---- Content settings: admin-editable landing page text (hero, CTAs, FAQ) ----
function ContentSettings() {
  const { content, setContent } = useContext(ContentContext);
  const [draft, setDraft] = useState(content);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => { setDraft({ ...draft, [k]: e.target.value }); setSaved(false); };

  const setFaq = (i, field, value) => {
    const next = draft.faqs.map((f, idx) => (idx === i ? { ...f, [field]: value } : f));
    setDraft({ ...draft, faqs: next });
    setSaved(false);
  };

  const addFaq = () => {
    setDraft({ ...draft, faqs: [...draft.faqs, { q: 'Új kérdés', a: 'Új válasz…' }] });
    setSaved(false);
  };

  const removeFaq = (i) => {
    setDraft({ ...draft, faqs: draft.faqs.filter((_, idx) => idx !== i) });
    setSaved(false);
  };

  const save = () => {
    setContent(draft);
    setSaved(true);
  };

  const resetToDefault = () => {
    setDraft(DEFAULT_CONTENT);
    setSaved(false);
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: C.slate, marginBottom: 16, lineHeight: 1.5 }}>
        Itt szerkesztheted a publikus landing page főbb szövegeit — a mentés után azonnal
        megjelenik a látogatóknak. Demó mód: a módosítás csak ebben a munkamenetben él.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={save} style={{ ...btnPrimary, height: 38, padding: '0 20px', fontSize: 12.5 }}>
          Mentés
        </button>
        <button onClick={resetToDefault} style={{ ...btnSecondary, height: 38, padding: '0 16px', fontSize: 12.5 }}>
          Visszaállítás alapértékre
        </button>
        {saved && (
          <span style={{ fontSize: 12.5, color: C.green, fontWeight: 700, alignSelf: 'center' }}>✓ Mentve</span>
        )}
      </div>

      <div style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 14 }}>Hero szekció</div>
        <label style={fieldLabel}>Kis felirat (eyebrow)</label>
        <input value={draft.heroEyebrow} onChange={set('heroEyebrow')} style={{ ...fieldInput, height: 38, marginBottom: 12 }} />
        <label style={fieldLabel}>Cím — első fele</label>
        <input value={draft.heroTitlePrefix} onChange={set('heroTitlePrefix')} style={{ ...fieldInput, height: 38, marginBottom: 12 }} />
        <label style={fieldLabel}>Cím — kiemelt vége (gradiens)</label>
        <input value={draft.heroTitleHighlight} onChange={set('heroTitleHighlight')} style={{ ...fieldInput, height: 38, marginBottom: 12 }} />
        <label style={fieldLabel}>Alszöveg</label>
        <textarea
          value={draft.heroBody} onChange={set('heroBody')}
          style={{ ...fieldInput, height: 70, padding: '10px 12px', resize: 'none', fontFamily: 'system-ui, sans-serif' }}
        />
      </div>

      <div style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 14 }}>Gombfeliratok</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={fieldLabel}>Elsődleges CTA</label>
            <input value={draft.ctaPrimary} onChange={set('ctaPrimary')} style={{ ...fieldInput, height: 38 }} />
          </div>
          <div>
            <label style={fieldLabel}>Másodlagos CTA</label>
            <input value={draft.ctaSecondary} onChange={set('ctaSecondary')} style={{ ...fieldInput, height: 38 }} />
          </div>
        </div>
      </div>

      <div style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 14 }}>Záró CTA szekció</div>
        <label style={fieldLabel}>Cím</label>
        <input value={draft.finalCtaTitle} onChange={set('finalCtaTitle')} style={{ ...fieldInput, height: 38, marginBottom: 12 }} />
        <label style={fieldLabel}>Alszöveg</label>
        <textarea
          value={draft.finalCtaBody} onChange={set('finalCtaBody')}
          style={{ ...fieldInput, height: 60, padding: '10px 12px', resize: 'none', fontFamily: 'system-ui, sans-serif' }}
        />
      </div>

      <div style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 14 }}>GYIK</div>
        <div style={{ display: 'grid', gap: 12 }}>
          {draft.faqs.map((f, i) => (
            <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, color: C.slate, fontWeight: 700 }}>#{i + 1}</span>
                <button
                  onClick={() => removeFaq(i)}
                  style={{ background: 'none', border: 'none', color: C.slate, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  Törlés
                </button>
              </div>
              <input
                value={f.q} onChange={(e) => setFaq(i, 'q', e.target.value)}
                style={{ ...fieldInput, height: 36, marginBottom: 8, fontWeight: 700 }}
              />
              <textarea
                value={f.a} onChange={(e) => setFaq(i, 'a', e.target.value)}
                style={{ ...fieldInput, height: 60, padding: '8px 12px', resize: 'none', fontFamily: 'system-ui, sans-serif', fontSize: 12.5 }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={addFaq}
          style={{ ...btnSecondary, height: 36, padding: '0 16px', fontSize: 12, marginTop: 12 }}
        >
          + Új kérdés hozzáadása
        </button>
      </div>
    </div>
  );
}

function QuestionSettings() {
  const { questionSets, setQuestionSets, partnerAssignments, setPartnerAssignments } = useQuestionSets();
  const [subview, setSubview] = useState('sets'); // sets | assign
  const [activeSetId, setActiveSetId] = useState(questionSets[0]?.id || null);
  const [editingKey, setEditingKey] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftIcon, setDraftIcon] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('✦');
  const [confirmRemoveAspect, setConfirmRemoveAspect] = useState(null);
  const [newSetName, setNewSetName] = useState('');
  const [confirmRemoveSet, setConfirmRemoveSet] = useState(null);

  const activeSet = questionSets.find((s) => s.id === activeSetId) || questionSets[0];

  const updateActiveSetAspects = (nextAspects) => {
    setQuestionSets(questionSets.map((s) => (s.id === activeSet.id ? { ...s, aspects: nextAspects } : s)));
  };

  const startEdit = (a) => {
    setEditingKey(a.key);
    setDraftLabel(a.label);
    setDraftIcon(a.icon);
  };

  const saveEdit = () => {
    if (!draftLabel.trim()) return;
    updateActiveSetAspects(activeSet.aspects.map((a) => (a.key === editingKey ? { ...a, label: draftLabel.trim(), icon: draftIcon.trim() || '✦' } : a)));
    setEditingKey(null);
  };

  const removeAspect = (key) => {
    updateActiveSetAspects(activeSet.aspects.filter((a) => a.key !== key));
    setConfirmRemoveAspect(null);
  };

  const addAspect = () => {
    if (!newLabel.trim()) return;
    const key = slugify(newLabel);
    if (activeSet.aspects.some((a) => a.key === key)) return;
    updateActiveSetAspects([...activeSet.aspects, { key, label: newLabel.trim(), icon: newIcon.trim() || '✦' }]);
    setNewLabel('');
    setNewIcon('✦');
  };

  const createSet = () => {
    if (!newSetName.trim()) return;
    const newSet = { id: genSetId(), name: newSetName.trim(), aspects: [...DEFAULT_ASPECTS] };
    setQuestionSets([...questionSets, newSet]);
    setActiveSetId(newSet.id);
    setNewSetName('');
  };

  const duplicateSet = () => {
    const copy = { id: genSetId(), name: `${activeSet.name} (másolat)`, aspects: activeSet.aspects.map((a) => ({ ...a })) };
    setQuestionSets([...questionSets, copy]);
    setActiveSetId(copy.id);
  };

  const removeSet = (setId) => {
    if (setId === 'QS-ALAP') return; // the base set can't be deleted
    const remaining = questionSets.filter((s) => s.id !== setId);
    setQuestionSets(remaining);
    setPartnerAssignments(
      Object.fromEntries(Object.entries(partnerAssignments).map(([venue, sid]) => [venue, sid === setId ? 'QS-ALAP' : sid]))
    );
    if (activeSetId === setId) setActiveSetId('QS-ALAP');
    setConfirmRemoveSet(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: C.line, borderRadius: 10, padding: 3, width: 'fit-content' }}>
        {[['sets', 'Kérdéscsoportok'], ['assign', 'Hozzárendelés partnerekhez'], ['content', 'Tartalom szerkesztése']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSubview(k)}
            style={{
              border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              background: subview === k ? C.paper : 'transparent', color: subview === k ? C.ink : C.slate,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {subview === 'sets' ? (
        <div>
          <div style={{ fontSize: 12.5, color: C.slate, marginBottom: 16, lineHeight: 1.5 }}>
            Egy kérdéscsoport egy újrafelhasználható kérdéslista, amit egy vagy több partnerhez hozzárendelhetsz
            a "Hozzárendelés partnerekhez" fülön. Az "Alap kérdések" minden új partnernek automatikusan jár.
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {questionSets.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSetId(s.id)}
                style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  border: activeSetId === s.id ? `1px solid ${C.ink}` : `1px solid ${C.line}`,
                  background: activeSetId === s.id ? C.ink : C.paper,
                  color: activeSetId === s.id ? '#fff' : C.ink,
                }}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              value={newSetName} onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Új kérdéscsoport neve, pl. Bár-specifikus" style={{ ...fieldInput, height: 38, flex: '1 1 220px' }}
            />
            <button
              onClick={createSet} disabled={!newSetName.trim()}
              style={{ ...btnSecondary, height: 38, padding: '0 16px', fontSize: 12.5, opacity: newSetName.trim() ? 1 : 0.4, cursor: newSetName.trim() ? 'pointer' : 'not-allowed' }}
            >
              + Új csoport (alapból indul)
            </button>
          </div>

          {activeSet && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{activeSet.name}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={duplicateSet} style={{ background: 'none', border: 'none', color: C.violet, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Másolat készítése
                  </button>
                  {activeSet.id !== 'QS-ALAP' && (
                    confirmRemoveSet === activeSet.id ? (
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <button onClick={() => removeSet(activeSet.id)} style={{ background: C.magenta, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Törlés megerősítése
                        </button>
                        <button onClick={() => setConfirmRemoveSet(null)} style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, cursor: 'pointer', color: C.slate }}>
                          Mégsem
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmRemoveSet(activeSet.id)} style={{ background: 'none', border: 'none', color: C.slate, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Csoport törlése
                      </button>
                    )
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                {activeSet.aspects.map((a) => (
                  <div key={a.key} style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: '14px 16px' }}>
                    {editingKey === a.key ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input value={draftIcon} onChange={(e) => setDraftIcon(e.target.value)} style={{ ...fieldInput, height: 38, width: 50, textAlign: 'center', flex: '0 0 auto' }} />
                        <input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} style={{ ...fieldInput, height: 38, flex: '1 1 160px' }} />
                        <button onClick={saveEdit} style={{ ...btnPrimary, height: 38, padding: '0 16px', fontSize: 12.5 }}>Mentés</button>
                        <button onClick={() => setEditingKey(null)} style={{ ...btnSecondary, height: 38, padding: '0 16px', fontSize: 12.5 }}>Mégsem</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{a.icon}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{a.label}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 10.5, color: C.slate }}>{a.key}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                          <button onClick={() => startEdit(a)} style={{ background: 'none', border: 'none', color: C.violet, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Szerkesztés
                          </button>
                          {confirmRemoveAspect === a.key ? (
                            <span style={{ display: 'inline-flex', gap: 6 }}>
                              <button onClick={() => removeAspect(a.key)} style={{ background: C.magenta, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                Törlés megerősítése
                              </button>
                              <button onClick={() => setConfirmRemoveAspect(null)} style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', color: C.slate }}>
                                Mégsem
                              </button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmRemoveAspect(a.key)} style={{ background: 'none', border: 'none', color: C.slate, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Törlés
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {activeSet.aspects.length === 0 && (
                  <div style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: 24, textAlign: 'center', color: C.slate, fontSize: 13 }}>
                    Ebben a csoportban nincs kérdés — a hozzárendelt partnerek nem tudnak értékelést leadni, amíg nincs legalább egy.
                  </div>
                )}
              </div>

              <div style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 12 }}>Kérdés hozzáadása ehhez a csoporthoz</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="✦" style={{ ...fieldInput, height: 38, width: 60, textAlign: 'center' }} />
                  <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Pl. Parkolás" style={{ ...fieldInput, height: 38, flex: '1 1 180px' }} />
                  <button
                    onClick={addAspect} disabled={!newLabel.trim()}
                    style={{ ...btnPrimary, height: 38, padding: '0 20px', opacity: newLabel.trim() ? 1 : 0.4, cursor: newLabel.trim() ? 'pointer' : 'not-allowed' }}
                  >
                    Hozzáadás
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : subview === 'assign' ? (
        <PartnerAssignment questionSets={questionSets} partnerAssignments={partnerAssignments} setPartnerAssignments={setPartnerAssignments} />
      ) : (
        <ContentSettings />
      )}
    </div>
  );
}

// ---- Partner assignment: pick one or more partners, assign a question set to all of them at once ----
function PartnerAssignment({ questionSets, partnerAssignments, setPartnerAssignments }) {
  const [partners] = useState(SEED_PARTNERS);
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [bulkSetId, setBulkSetId] = useState(questionSets[0]?.id || 'QS-ALAP');
  const [filterSetId, setFilterSetId] = useState('all');
  const [search, setSearch] = useState('');

  const visiblePartners = partners.filter((p) => {
    const currentSetId = partnerAssignments[p.name] || 'QS-ALAP';
    if (filterSetId !== 'all' && currentSetId !== filterSetId) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const toggleVenue = (venueName) => {
    setSelectedVenues((prev) => (prev.includes(venueName) ? prev.filter((v) => v !== venueName) : [...prev, venueName]));
  };

  const toggleAll = () => {
    const visibleNames = visiblePartners.map((p) => p.name);
    const allVisibleSelected = visibleNames.length > 0 && visibleNames.every((n) => selectedVenues.includes(n));
    setSelectedVenues(allVisibleSelected
      ? selectedVenues.filter((v) => !visibleNames.includes(v))
      : [...new Set([...selectedVenues, ...visibleNames])]);
  };

  const applyBulk = () => {
    if (selectedVenues.length === 0) return;
    setPartnerAssignments({
      ...partnerAssignments,
      ...Object.fromEntries(selectedVenues.map((v) => [v, bulkSetId])),
    });
    setSelectedVenues([]);
  };

  const setForVenue = (venueName, setId) => {
    setPartnerAssignments({ ...partnerAssignments, [venueName]: setId });
  };

  const visibleNames = visiblePartners.map((p) => p.name);
  const allVisibleSelected = visibleNames.length > 0 && visibleNames.every((n) => selectedVenues.includes(n));

  return (
    <div>
      <div style={{ fontSize: 12.5, color: C.slate, marginBottom: 16, lineHeight: 1.5 }}>
        Válassz ki egy vagy több partnert, majd rendelj hozzájuk egy kérdéscsoportot — egyesével is,
        vagy több partnert egyszerre kijelölve, csoportosan. Nagy listánál szűrhetsz kérdéscsoport vagy név szerint.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés egység neve szerint…" style={{ ...fieldInput, height: 36, flex: '1 1 200px' }}
        />
        <select value={filterSetId} onChange={(e) => setFilterSetId(e.target.value)} style={selectStyle}>
          <option value="all">Minden kérdéscsoport</option>
          {questionSets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(search.trim() || filterSetId !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterSetId('all'); }}
            style={{ ...btnSecondary, height: 36, padding: '0 14px', fontSize: 12 }}
          >
            Szűrők törlése
          </button>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14,
        background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 14px',
      }}>
        <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>
          {selectedVenues.length} partner kijelölve
        </span>
        <select
          value={bulkSetId} onChange={(e) => setBulkSetId(e.target.value)}
          style={selectStyle}
        >
          {questionSets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button
          onClick={applyBulk} disabled={selectedVenues.length === 0}
          style={{ ...btnPrimary, height: 34, padding: '0 16px', fontSize: 12, opacity: selectedVenues.length ? 1 : 0.4, cursor: selectedVenues.length ? 'pointer' : 'not-allowed' }}
        >
          Csoport hozzárendelése a kijelöltekhez
        </button>
      </div>

      <div style={{ fontSize: 11.5, color: C.slate, marginBottom: 8 }}>
        {visiblePartners.length} egység a szűrésnek megfelelően
      </div>

      <div style={{ overflowX: 'auto', background: C.paper, borderRadius: 12, border: `1px solid ${C.line}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 560 }}>
          <thead>
            <tr style={{ background: C.mist, textAlign: 'left' }}>
              <th style={th}>
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
              </th>
              <th style={th}>Egység</th>
              <th style={th}>Jelenlegi kérdéscsoport</th>
              <th style={th}>Gyors váltás</th>
            </tr>
          </thead>
          <tbody>
            {visiblePartners.map((p) => {
              const currentSetId = partnerAssignments[p.name] || 'QS-ALAP';
              const currentSet = questionSets.find((s) => s.id === currentSetId);
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={td}>
                    <input type="checkbox" checked={selectedVenues.includes(p.name)} onChange={() => toggleVenue(p.name)} />
                  </td>
                  <td style={{ ...td, fontWeight: 700, color: C.ink }}>{p.name}</td>
                  <td style={{ ...td, color: C.ink }}>{currentSet ? currentSet.name : '—'}</td>
                  <td style={td}>
                    <select
                      value={currentSetId}
                      onChange={(e) => setForVenue(p.name, e.target.value)}
                      style={selectStyle}
                    >
                      {questionSets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
            {visiblePartners.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign: 'center', color: C.slate, padding: 20 }}>
                  Nincs a szűrésnek megfelelő egység.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Help panel: guided FAQ for owners and admins ----
function HelpItem({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.paper, borderRadius: 12, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{q}</span>
        <span style={{ fontSize: 18, color: C.slate, flexShrink: 0, marginLeft: 12 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', fontSize: 13, color: C.slate, lineHeight: 1.6 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function HelpPanel({ role }) {
  const ownerFaqs = [
    ['Mit jelent az "Áttekintés" fülön a hőtérkép?', 'Minden cella egy adott nap egy adott óráját mutatja, 1-10 skálán. A minél zöldebb cellák jobb, a magenta/rózsaszín cellák gyengébb átlagot jeleznek — így pontosan látod, mikor csúszik el a kiszolgálás vagy más szempont.'],
    ['Miért mutat figyelmeztetést a rendszer?', 'Ha egy szempont átlaga egy adott időszakban 6.5 alá esik, a rendszer automatikusan kiemeli, hogy tudj rá időben reagálni — például extra személyzetet beosztani egy forgalmas időszakra.'],
    ['Mit látok a "Napló" fülön?', 'Minden egyes leadott értékelést, egyedi azonosítóval és pontos időbélyeggel. Ha egy vendég 1-3 pontot adott valamelyik szempontra, itt látod, ha írt is hozzá pár szavas indoklást.'],
    ['Miért nem látom a vendégek e-mail címét?', 'Adatvédelmi okból a vendégek e-mail címét és a sorsolási azonosítót csak a Guestly admin felülete mutatja — ez a partneri nézetben szándékosan nincs benne.'],
    ['Hogyan kapok visszajelzést?', 'Az asztalokon elhelyezett QR-kódot beolvasva a vendég 30 másodperc alatt tud értékelni — nincs szükség letöltendő alkalmazásra.'],
  ];

  const adminFaqs = [
    ['Mi a különbség az "Áttekintés" és a partnerek saját nézete között?', 'Az admin Áttekintés az összes partner portfólió-szintű összesítését mutatja: aktív partnerek száma, összesített értékelésszám, egységek rangsora, és automatikus riasztás azoknál, ahol valamelyik szempont gyenge.'],
    ['Hogyan adok hozzá új partnert?', 'A "Partnerek" fülön "Új vendéglátóegység hozzáadása" — vagy egyesével, vagy CSV-importtal, ha egyszerre több partnert szeretnél felvenni.'],
    ['Hogyan tudok QR-kódot generálni egy partnerhez?', 'A Partnerek táblázatban minden sornál található egy "QR-kód" gomb — ez megnyit egy előnézetet, amit letölthetsz és kinyomtathatsz kihelyezésre.'],
    ['Mire jók a kérdéscsoportok?', 'A "Beállítások" fülön kezelheted, mely kérdéseket kapják a vendégek. Az "Alap kérdések" minden új partnernek jár, de létrehozhatsz egyedi csoportokat (pl. bár-specifikus kérdésekkel), és egyszerre több partnerhez is hozzárendelheted őket.'],
    ['Hogyan találok meg egy adott partnert egy nagy listában?', 'A Partnerek, a Napló és a Hozzárendelés partnerekhez fülön is van keresőmező — kereshetsz név, cím, e-mail vagy kapcsolattartó szerint, illetve szűrhetsz kérdéscsoport szerint is.'],
    ['Mit jelent a "Csak sorsolásra jelentkezettek" szűrő?', 'Csak azokat az értékeléseket mutatja, ahol a vendég megadta az e-mail címét a nyereményjátékhoz — ez segít összegyűjteni a sorsolható jelentkezőket.'],
  ];

  const faqs = role === 'admin' ? adminFaqs : ownerFaqs;

  return (
    <div>
      <div style={{ fontSize: 12.5, color: C.slate, marginBottom: 16, lineHeight: 1.5 }}>
        {role === 'admin'
          ? 'Gyors útmutató az admin felület használatához.'
          : 'Gyors útmutató a dashboard használatához — ha bármi nem egyértelmű, itt a válasz.'}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {faqs.map(([q, a]) => <HelpItem key={q} q={q}>{a}</HelpItem>)}
      </div>
    </div>
  );
}

// ---- First-review celebration: shown once, the first time a venue's review count reaches 1 ----
function FirstReviewCelebration({ venueName, onContinue }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.ink, color: '#fff', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.cyan, fontWeight: 700, marginBottom: 10 }}>
        Első mérföldkő
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px', maxWidth: 360 }}>
        Megérkezett az első értékelésed!
      </h1>
      <p style={{ opacity: 0.75, fontSize: 15, maxWidth: 340, lineHeight: 1.6, margin: '0 0 32px' }}>
        Egy vendég most osztotta meg először a véleményét a <strong style={{ color: '#fff' }}>{venueName}</strong> egységről.
        Innentől minden újabb értékelés valós időben, óránkénti pontossággal jelenik meg a dashboardon.
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: '18px 20px', maxWidth: 340, marginBottom: 28, textAlign: 'left',
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.cyan, marginBottom: 8 }}>Mit érdemes most csinálni?</div>
        <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>
          Nézd meg a "Napló" fület, hogy pontosan mit írt a vendég — és ha van hozzá pár mondatos indoklás,
          az segít eldönteni, mit érdemes elsőként javítani.
        </div>
      </div>
      <button onClick={onContinue} style={btnPrimary}>
        Tovább a dashboardra →
      </button>
    </div>
  );
}

function Dashboard({ onLogout, role = 'owner' }) {
  const [view, setView] = useState('overview'); // overview | log | partners | settings | help
  const [previousView, setPreviousView] = useState('overview');
  const [selected, setSelected] = useState('gyorsasag');
  const [focusVenue, setFocusVenue] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [heatmapPeriod, setHeatmapPeriod] = useState('week'); // day | week | month
  const [heatmapDay, setHeatmapDay] = useState('Pén');
  const ownVenue = 'Kávézó Aroma';
  const ASPECTS = useAspects(role === 'owner' ? ownVenue : null);
  const overallByAspect = ASPECTS.map((a) => ({ ...a, avg: avg(DASH_DATA[a.key]) }));
  const worst = [...overallByAspect].sort((a, b) => a.avg - b.avg)[0];

  const openVenueLog = (venueName) => {
    setFocusVenue(venueName);
    setView('log');
  };

  // Demo-only: in production this would trigger automatically the first time reviewCount reaches 1 for a venue.
  if (role === 'owner' && showCelebration) {
    return <FirstReviewCelebration venueName={ownVenue} onContinue={() => setShowCelebration(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: C.mist, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', background: C.paper, borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wordmark size={18} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: role === 'admin' ? '#fff' : C.violet, background: role === 'admin' ? C.ink : C.mist,
            padding: '3px 8px', borderRadius: 999,
          }}>
            {role === 'admin' ? 'Admin' : 'Partner'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {role === 'owner' && (
            <button
              onClick={() => setShowCelebration(true)}
              style={{ ...navGhost, color: C.violet, fontSize: 11 }}
              title="Demó: első értékelés ünneplő képernyő megtekintése"
            >
              🎉 Demó: első értékelés
            </button>
          )}
          <button onClick={onLogout} style={{ ...navGhost, color: C.slate }}>Kijelentkezés</button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.violet, fontWeight: 700, marginBottom: 8 }}>
          {role === 'admin' ? 'Admin nézet · összes egység' : 'Partneri nézet'}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 4px' }}>
          {role === 'admin' ? 'Guestly — minden partner' : ownVenue}
        </h1>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 20 }}>
          {role === 'admin' ? `${SEED_PARTNERS.length} aktív partner` : 'Elmúlt 7 nap · 342 értékelés'}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: C.line, borderRadius: 10, padding: 3, width: 'fit-content', flexWrap: 'wrap' }}>
          {[
            ['overview', 'Áttekintés'],
            ['log', 'Napló'],
            ...(role === 'admin' ? [['partners', 'Partnerek'], ['settings', 'Beállítások']] : []),
            ['help', 'Súgó'],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => { if (k === 'help' && view !== 'help') setPreviousView(view); setView(k); if (k !== 'log') setFocusVenue(null); }}
              style={{
                border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                background: view === k ? C.paper : 'transparent', color: view === k ? C.ink : C.slate,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {view === 'log' ? (
          <AdminLog role={role} ownVenue={ownVenue} focusVenue={focusVenue} onClearFocus={() => setFocusVenue(null)} />
        ) : view === 'partners' ? (
          <PartnerManager onSelectPartner={openVenueLog} />
        ) : view === 'settings' ? (
          <QuestionSettings />
        ) : view === 'help' ? (
          <div>
            <button
              onClick={() => setView(previousView)}
              style={{ background: 'none', border: 'none', color: C.slate, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginBottom: 14, padding: 0 }}
            >
              ← Vissza
            </button>
            <HelpPanel role={role} />
          </div>
        ) : role === 'admin' ? (
          <AdminOverview />
        ) : (
          <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
          {overallByAspect.map((a) => (
            <button
              key={a.key}
              onClick={() => setSelected(a.key)}
              style={{
                textAlign: 'left', border: selected === a.key ? `2px solid ${C.violet}` : `2px solid transparent`,
                background: C.paper, borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                boxShadow: selected === a.key ? '0 4px 16px rgba(91,33,182,0.12)' : 'none',
              }}
            >
              <div style={{ fontSize: 12, color: C.slate, marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: a.avg < 6.5 ? C.magenta : C.ink }}>
                {a.avg.toFixed(1)}
              </div>
            </button>
          ))}
        </div>

        <div style={{ background: C.ink, color: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ color: C.cyan }}>{worst.label}</strong> gyengébb péntek–szombat 18–20h között — érdemes ilyenkor erősíteni a személyzetet.
          </div>
        </div>

        <div style={{ background: C.paper, borderRadius: 14, padding: 20, border: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: C.ink }}>
              {ASPECTS.find((a) => a.key === selected).label}
              {heatmapPeriod === 'day' ? ' — óránkénti bontás' : heatmapPeriod === 'month' ? ' — napi átlag, egyéni időszak' : ' — heti bontás'}
            </div>
            <div style={{ display: 'flex', gap: 4, background: C.mist, borderRadius: 8, padding: 3 }}>
              {[['day', 'Napi'], ['week', 'Heti'], ['month', 'Egyéni']].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setHeatmapPeriod(k)}
                  style={{
                    border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    background: heatmapPeriod === k ? C.paper : 'transparent', color: heatmapPeriod === k ? C.ink : C.slate,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <DashHeatmap aspectKey={selected} period={heatmapPeriod} selectedDay={heatmapDay} onSelectDay={setHeatmapDay} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 10, color: C.slate }}>
            <span>Figyelendő</span>
            <div style={{ flex: 1, height: 6, margin: '0 8px', borderRadius: 3, background: `linear-gradient(90deg, ${C.magenta}, ${C.mist}, ${C.green})` }} />
            <span>Erős</span>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- App: routes between marketing site, demo request, login, and dashboard ----
export default function App() {
  const [screen, setScreen] = useState('marketing'); // marketing | demo | login | adminLogin | dashboard
  const [role, setRole] = useState('owner');
  const [questionSets, setQuestionSets] = useState(DEFAULT_QUESTION_SETS);
  const [partnerAssignments, setPartnerAssignments] = useState({});
  const [content, setContent] = useState(DEFAULT_CONTENT);

  return (
    <ContentContext.Provider value={{ content, setContent }}>
    <AspectsContext.Provider value={{ questionSets, setQuestionSets, partnerAssignments, setPartnerAssignments }}>
      {screen === 'marketing' && (
        <MarketingPage
          onLogin={() => setScreen('login')}
          onDemo={() => setScreen('demo')}
          onAdminLogin={() => setScreen('adminLogin')}
        />
      )}
      {screen === 'demo' && (
        <DemoRequest onBack={() => setScreen('marketing')} />
      )}
      {screen === 'login' && (
        <Login
          onBack={() => setScreen('marketing')}
          onSuccess={(chosenRole) => { setRole(chosenRole); setScreen('dashboard'); }}
        />
      )}
      {screen === 'adminLogin' && (
        <AdminLogin
          onBack={() => setScreen('marketing')}
          onSuccess={(chosenRole) => { setRole(chosenRole); setScreen('dashboard'); }}
        />
      )}
      {screen === 'dashboard' && (
        <Dashboard onLogout={() => setScreen('marketing')} role={role} />
      )}
    </AspectsContext.Provider>
    </ContentContext.Provider>
  );
}
