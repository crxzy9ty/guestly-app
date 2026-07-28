import Link from "next/link";

export const metadata = { title: "Impresszum — Guestly" };

export default function ImpresszumPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="mb-8 inline-block text-sm font-semibold text-slate hover:text-ink">
        ← Vissza a főoldalra
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Impresszum</h1>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-ink">
        <p className="rounded-lg bg-mist p-3 text-[12.5px] text-slate">
          Ez az oldal jelenleg kitöltésre vár — az alábbi mezőket a szolgáltató (Guestly) tényleges cég-
          vagy egyéni vállalkozói adataival kell helyettesíteni, mielőtt az oldal éles, fizető
          ügyfelekkel működne.
        </p>

        <section>
          <h2 className="mb-1.5 font-bold">A szolgáltatás üzemeltetője</h2>
          <p>
            Név: <strong>[Cégnév / egyéni vállalkozó neve — kitöltendő]</strong>
            <br />
            Székhely: <strong>[Székhely / levelezési cím — kitöltendő]</strong>
            <br />
            Adószám: <strong>[Adószám — kitöltendő]</strong>
            <br />
            Nyilvántartási szám (ha releváns): <strong>[kitöltendő]</strong>
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-bold">Elérhetőség</h2>
          <p>
            E-mail: <strong>[kapcsolattartási e-mail cím — kitöltendő]</strong>
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-bold">Tárhelyszolgáltató</h2>
          <p>
            Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) — az alkalmazás futtatása.
            <br />
            Supabase, Inc. — adatbázis és felhasználó-hitelesítés.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-bold">Jogérvényesítési lehetőségek</h2>
          <p>
            Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH) élhetsz.
            <br />
            Cím: 1055 Budapest, Falk Miksa utca 9-11. · Web: naih.hu
          </p>
        </section>

        <p className="text-xs text-slate">
          Lásd még az{" "}
          <Link href="/adatvedelem" className="font-semibold text-violet">
            Adatkezelési tájékoztatót
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
