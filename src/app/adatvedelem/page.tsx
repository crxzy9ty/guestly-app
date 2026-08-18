import Link from "next/link";

export const metadata = { title: "Adatkezelési tájékoztató — Fydback" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-ink">{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export default function AdatvedelemPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="mb-8 inline-block text-sm font-semibold text-slate hover:text-ink">
        ← Vissza a főoldalra
      </Link>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Adatkezelési tájékoztató</h1>
      <p className="mb-8 text-xs text-slate">Utolsó frissítés: [dátum kitöltendő]</p>

      <div className="mb-8 rounded-lg bg-mist p-3 text-[12.5px] leading-relaxed text-slate">
        Ez a tájékoztató sablon jelenleg kitöltésre/ellenőrzésre vár — az üzemeltető cégadatait és a
        pontos adatmegőrzési időket egy adatvédelmi szakértővel egyeztetve érdemes véglegesíteni,
        mielőtt valódi, fizető ügyfelek adatai kerülnek a rendszerbe.
      </div>

      <div className="flex flex-col gap-7">
        <Section title="1. Ki kezeli az adataidat?">
          <p>
            Az adatkezelő a Fydback szolgáltatást üzemeltető{" "}
            <strong>[cégnév / egyéni vállalkozó neve — kitöltendő]</strong> (lásd az{" "}
            <Link href="/impresszum" className="font-semibold text-violet">
              Impresszumot
            </Link>{" "}
            a pontos adatokért).
          </p>
        </Section>

        <Section title="2. Milyen adatokat kezelünk, és miért?">
          <p>
            <strong>Vendégek (akik egy QR-kódon keresztül értékelést adnak le):</strong>
          </p>
          <ul className="list-disc pl-5">
            <li>A leadott pontszámok és az opcionális, szövegesen beírt indoklás.</li>
            <li>
              Ha a napi nyereményjátékban részt veszel: az e-mail címed, kizárólag a sorsolás
              lebonyolítására és a nyertes értesítésére — ezt az adatot csak akkor kezeljük, ha
              kifejezetten hozzájárulsz (a jelölőnégyzet bepipálásával).
            </li>
            <li>
              Egy technikai, nem személyhez köthető azonosító (süti) az egy eszközről érkező
              ismételt szavazások kiszűrésére.
            </li>
          </ul>
          <p>
            <strong>Vendéglátós partnerek / tulajdonosok:</strong>
          </p>
          <ul className="list-disc pl-5">
            <li>Név, e-mail cím, telefonszám, üzlet címe, kapcsolattartó adatai — a szolgáltatás
              nyújtásához és a kapcsolattartáshoz.</li>
          </ul>
          <p>
            <strong>Demót kérő érdeklődők:</strong>
          </p>
          <ul className="list-disc pl-5">
            <li>Név, e-mail cím, vállalkozás neve, opcionális üzenet — a demó egyeztetéséhez.</li>
          </ul>
        </Section>

        <Section title="3. Milyen jogalapon kezeljük az adatokat?">
          <ul className="list-disc pl-5">
            <li>
              Az értékelés (pontszám, indoklás) kezelése a partnerünkkel fennálló szerződés
              teljesítéséhez és jogos üzleti érdekünkhöz kapcsolódik (a szolgáltatás lényege a
              vendégelégedettség mérése).
            </li>
            <li>A nyereményjáték e-mail cím kezelése kizárólag a te előzetes hozzájárulásoddal történik.</li>
            <li>A duplikáció-szűrő süti a visszaélések megelőzéséhez fűződő jogos érdekünkön alapul.</li>
          </ul>
        </Section>

        <Section title="4. Meddig tároljuk az adatokat?">
          <p>
            [Kitöltendő a végleges adatmegőrzési politikával — például: az értékeléseket a
            partnerkapcsolat fennállása alatt és utána még X évig tároljuk; a nyereményjáték
            e-mail címét a sorsolás lezárását követő X napon belül eltávolítjuk.]
          </p>
        </Section>

        <Section title="5. Ki fér hozzá az adatokhoz?">
          <ul className="list-disc pl-5">
            <li>
              A partner (tulajdonos) csak a saját üzletéhez tartozó értékeléseket látja — a vendég
              e-mail címét és a sorsolási azonosítót nem.
            </li>
            <li>A Fydback üzemeltetője (admin) minden adathoz hozzáfér, a szolgáltatás fenntartásához szükséges mértékben.</li>
          </ul>
        </Section>

        <Section title="6. Kik dolgozzák fel az adatokat a nevünkben?">
          <ul className="list-disc pl-5">
            <li><strong>Supabase, Inc.</strong> — adatbázis, tárolás, hitelesítés (EU-s szerveren).</li>
            <li><strong>Vercel Inc.</strong> — az alkalmazás futtatása (hosting).</li>
            <li><strong>Resend</strong> — a rendszer által küldött e-mailek (pl. nyeremény-értesítés, demó-visszaigazolás) kézbesítése.</li>
          </ul>
        </Section>

        <Section title="7. Milyen jogaid vannak?">
          <p>
            Kérheted a rólad tárolt adatokhoz való hozzáférést, azok helyesbítését vagy törlését, illetve
            tiltakozhatsz a kezelésük ellen. A hozzájáruláson alapuló adatkezelést (pl. nyereményjáték
            e-mail) bármikor, indoklás nélkül visszavonhatod. Panasszal a Nemzeti Adatvédelmi és
            Információszabadság Hatósághoz (NAIH, naih.hu) fordulhatsz.
          </p>
        </Section>

        <Section title="8. Kapcsolat">
          <p>
            Adatkezeléssel kapcsolatos kérdéseiddel keresd az üzemeltetőt az{" "}
            <Link href="/impresszum" className="font-semibold text-violet">
              Impresszumban
            </Link>{" "}
            megadott elérhetőségen.
          </p>
        </Section>
      </div>
    </div>
  );
}
