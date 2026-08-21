export type MarketingContent = {
  heroEyebrow: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  navLogin: string;

  // Hero signal strip — 3 fixed cells (small -> clear signal narrative).
  signal: { tag: string; title: string; body: string }[];

  problemEyebrow: string;
  problemTitle: string;
  problems: { title: string; body: string }[];

  compareEyebrow: string;
  compareTitle: string;
  compareBody: string;
  compareColGoogle: string;
  compareColOurs: string;
  compareRows: { label: string; google: string; ours: string }[];

  stepsEyebrow: string;
  stepsTitle: string;
  steps: { title: string; body: string }[];

  stats: { number: string; label: string }[];

  faqEyebrow: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];

  finalCtaEyebrow: string;
  finalCtaTitle: string;
  finalCtaBody: string;

  footerPrivacy: string;
  footerImprint: string;
  footerCopyright: string;
};

// Mirrors the row seeded by supabase/migrations/..._demo_requests_and_content_settings.sql.
// Used as a fallback only if that row is ever missing, and per-field
// (see resolveContent below) whenever a stored row predates a field added
// here later — so this always has to be a COMPLETE, valid content object.
export const DEFAULT_CONTENT: MarketingContent = {
  heroEyebrow: "Vendégelégedettség · valós időben",
  heroTitlePrefix: "Tudd meg, mit gondolnak a vendégeid — ",
  heroTitleHighlight: "mielőtt elmennek.",
  heroBody:
    "Egy QR-kód az asztalon. Öt kérdés a vendégnek. Neked pedig egy óránkénti kimutatás arról, hol csúszik el a kiszolgálás — mielőtt egy rossz Google-értékelésből tudod meg.",
  ctaPrimary: "Demó kérése",
  ctaSecondary: "Bejelentkezés →",
  navLogin: "Bejelentkezés",

  signal: [
    { tag: "19:04", title: "Beérkezik egy értékelés", body: "Egy apró jel — még csak egyetlen pont az estén." },
    { tag: "19:24", title: "Kirajzolódik egy mintázat", body: "Öt hasonló válasz ugyanarra a szempontra, ugyanabból az időszakból." },
    { tag: "Záráskor", title: "Tiszta kép, cselekvésre kész", body: "Tudod, mi történt, mikor, és min érdemes változtatni holnaptól." },
  ],

  problemEyebrow: "A probléma",
  problemTitle: "A legtöbb visszajelzés túl későn, túl homályosan érkezik",
  problems: [
    { title: "Havi átlagok", body: "Egy negyedéves felmérés nem mondja meg, hogy péntek este mi ment rosszul." },
    {
      title: "Néma vendégek",
      body: "A legtöbben nem szólnak, mert kellemetlen odahívni a felszolgálót — inkább csendben legközelebb máshova mennek.",
    },
    { title: "Nyilvános kritika", body: "Amit megosztanak, az gyakran egyenesen Google-re kerül, mire te megtudod." },
  ],

  compareEyebrow: "Miért nem elég a Google Review",
  compareTitle: "Nem egy plusz csatorna vagyunk — egy korábbi lépcsőfok",
  compareBody:
    "A Google Review akkor derít fényt a problémára, amikor már nyilvános, és a vendég már döntött. A Fydback ezt a pillanat előtt hozza el hozzád — belsőleg, cselekvésre alkalmas formában.",
  compareColGoogle: "Google Review",
  compareColOurs: "Fydback",
  compareRows: [
    { label: "Mikor tudod meg", google: "Napokkal-hetekkel később, ha egyáltalán", ours: "Aznap, akár óránkénti bontásban" },
    { label: "Ki látja", google: "Bárki, nyilvánosan", ours: "Csak te és a csapatod" },
    { label: "Mit mond", google: "Egy összesített csillagszám", ours: "Konkrét szempont, időpont, gyakran ok is" },
    {
      label: "Mit takar az átlag",
      google: "Egy 5 éves múlt átlaga — egy rossz hónap alig mozgatja",
      ours: "Az elmúlt napok/hetek valós állapota",
    },
    { label: "Cselekvésre alkalmas?", google: "Csak utólagos reagálás", ours: "Beavatkozhatsz, mielőtt gond lesz belőle" },
  ],

  stepsEyebrow: "Hogyan működik",
  stepsTitle: "Három lépés az asztaltól a döntésig",
  steps: [
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
  ],

  stats: [
    { number: "30 mp", label: "egy vendég átlagos kitöltési ideje" },
    { number: "1 nap", label: "a bevezetéstől az első adatokig" },
    { number: "0", label: "letöltendő alkalmazás a vendégnek" },
  ],

  faqEyebrow: "Kérdések",
  faqTitle: "Amit tudni érdemes indulás előtt",
  faqs: [
    {
      q: "Kell hozzá saját applikáció a vendégnek?",
      a: "Nem. A QR-kód a telefon natív kameráján keresztül nyílik meg egy böngészőben — nincs letöltés, nincs regisztráció a vendég oldalán.",
    },
    { q: "Mennyi idő alatt indul el nálam?", a: "A QR-kártyák kihelyezése és a fiókod beállítása jellemzően egy napon belül elkészül." },
    {
      q: "Ki látja az értékeléseket?",
      a: "Csak te és az általad megadott üzletvezetők — az értékelések nem nyilvánosak, nem kerülnek fel Google-re vagy más felületre.",
    },
    {
      q: "Mennyibe kerül?",
      a: "Az árazást jelenleg alakítjuk ki induló partnereinkkel közösen. Kérj demót, és személyesen egyeztetünk egy a vállalkozásodhoz illő csomagról.",
    },
  ],

  finalCtaEyebrow: "Kezdjük el",
  finalCtaTitle: "Nézzük meg együtt a saját asztalaidon",
  finalCtaBody: "15 perces beszélgetés, valódi példákkal a te vendégkörödre szabva. Kötelezettség nélkül.",

  footerPrivacy: "Adatkezelési tájékoztató",
  footerImprint: "Impresszum",
  footerCopyright: "© 2026 Fydback",
};

// A stored content_settings row can predate fields added to MarketingContent
// later — merge per top-level key against DEFAULT_CONTENT rather than
// falling back to it wholesale, so an old row still renders every new
// section (with its default copy) instead of crashing on a missing field.
export function resolveContent(raw: unknown): MarketingContent {
  return { ...DEFAULT_CONTENT, ...((raw as Partial<MarketingContent> | null | undefined) ?? {}) };
}
