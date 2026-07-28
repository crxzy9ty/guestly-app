-- demo_requests: the public "Demó kérése" contact form.
-- content_settings: single-row JSONB singleton holding the editable marketing
-- page copy (hero text, CTAs, FAQs) — mirrors the shape of DEFAULT_CONTENT in
-- guestly-landing.jsx so the admin "content editor" (later phase) can read/write
-- the whole blob at once.

create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  business text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index idx_demo_requests_created_at on public.demo_requests (created_at desc);

create table public.content_settings (
  id smallint primary key default 1 check (id = 1),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

insert into public.content_settings (id, content) values (
  1,
  '{
    "heroEyebrow": "Vendégelégedettség · valós időben",
    "heroTitlePrefix": "Tudd meg, mit gondolnak a vendégeid — ",
    "heroTitleHighlight": "mielőtt elmennek.",
    "heroBody": "Egy QR-kód az asztalon. Öt kérdés a vendégnek. Neked pedig egy óránkénti kimutatás arról, hol csúszik el a kiszolgálás — mielőtt egy rossz Google-értékelésből tudod meg.",
    "ctaPrimary": "Demó kérése",
    "ctaSecondary": "Bejelentkezés →",
    "finalCtaTitle": "Nézzük meg együtt a saját asztalaidon",
    "finalCtaBody": "15 perces beszélgetés, valódi példákkal a te vendégkörödre szabva. Kötelezettség nélkül.",
    "faqs": [
      { "q": "Kell hozzá saját applikáció a vendégnek?", "a": "Nem. A QR-kód a telefon natív kameráján keresztül nyílik meg egy böngészőben — nincs letöltés, nincs regisztráció a vendég oldalán." },
      { "q": "Mennyi idő alatt indul el nálam?", "a": "A QR-kártyák kihelyezése és a fiókod beállítása jellemzően egy napon belül elkészül." },
      { "q": "Ki látja az értékeléseket?", "a": "Csak te és az általad megadott üzletvezetők — az értékelések nem nyilvánosak, nem kerülnek fel Google-re vagy más felületre." },
      { "q": "Mennyibe kerül?", "a": "Az árazást jelenleg alakítjuk ki induló partnereinkkel közösen. Kérj demót, és személyesen egyeztetünk egy a vállalkozásodhoz illő csomagról." },
      { "q": "Mibe kerül a napi nyereményjáték?", "a": "Egyetlen ingyen kávé alapanyagköltsége naponta — havi szinten jellemzően pár ezer forint, miközben a nyertes gyakran kísérővel tér vissza, aki fizető vendégként fogyaszt." },
      { "q": "Hogyan kapja meg a vendég a nyereményt?", "a": "A napi nyertes e-mailben kap egy egyedi kupon-kódot, amit legközelebbi látogatásakor a pultnál megmutat — nincs szükség appra vagy plusz eszközre a pultosnál." },
      { "q": "Kötelező részt vennem a nyereményjátékban?", "a": "Nem, ez opcionális kiegészítő — a vendégelégedettség-mérés önmagában is működik nélküle, de sokat segít a válaszadási hajlandóságban." }
    ]
  }'::jsonb
);
