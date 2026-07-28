export type MarketingContent = {
  heroEyebrow: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  finalCtaTitle: string;
  finalCtaBody: string;
  faqs: { q: string; a: string }[];
};

// Mirrors the row seeded by supabase/migrations/..._demo_requests_and_content_settings.sql.
// Used as a fallback only if that row is ever missing.
export const DEFAULT_CONTENT: MarketingContent = {
  heroEyebrow: "Vendégelégedettség · valós időben",
  heroTitlePrefix: "Tudd meg, mit gondolnak a vendégeid — ",
  heroTitleHighlight: "mielőtt elmennek.",
  heroBody:
    "Egy QR-kód az asztalon. Öt kérdés a vendégnek. Neked pedig egy óránkénti kimutatás arról, hol csúszik el a kiszolgálás — mielőtt egy rossz Google-értékelésből tudod meg.",
  ctaPrimary: "Demó kérése",
  ctaSecondary: "Bejelentkezés →",
  finalCtaTitle: "Nézzük meg együtt a saját asztalaidon",
  finalCtaBody: "15 perces beszélgetés, valódi példákkal a te vendégkörödre szabva. Kötelezettség nélkül.",
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
};
