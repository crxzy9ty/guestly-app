"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitDemoRequest, type DemoRequestState } from "@/app/actions/demo-requests";

const initialState: DemoRequestState = { ok: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1.5 h-11 w-full rounded-lg bg-ink text-sm font-bold text-white disabled:opacity-50"
    >
      {pending ? "Küldés…" : "Demó kérése"}
    </button>
  );
}

const inputClass = "h-11 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none";
const labelClass = "mb-1.5 block text-xs font-bold text-ink";

export default function DemoRequestPage() {
  const [state, formAction] = useActionState(submitDemoRequest, initialState);

  if (state.ok) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-mist px-6 py-16 text-center">
        <div className="mb-3 text-4xl">✓</div>
        <h1 className="mb-2 text-xl font-bold tracking-tight text-ink">Köszönjük a jelentkezést!</h1>
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate">
          Hamarosan felvesszük veled a kapcsolatot, hogy egyeztessünk egy 15 perces bemutatót.
        </p>
        <Link href="/" className="text-sm font-semibold text-slate hover:text-ink">
          ← Vissza a főoldalra
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-mist px-6 py-16">
      <div className="mb-7 flex items-center gap-2">
        <div className="h-5 w-5 rounded-md bg-gradient-to-br from-cyan via-violet to-magenta" />
        <span className="text-lg font-bold tracking-tight text-ink">Fydback</span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-8 shadow-[0_20px_50px_rgba(21,19,28,0.08)]">
        <h1 className="mb-1.5 text-xl font-bold tracking-tight text-ink">Kérj demót</h1>
        <p className="mb-6 text-[13.5px] leading-relaxed text-slate">
          15 perces, kötelezettség nélküli bemutató a saját vendéglátóhelyedre szabva.
        </p>

        <form action={formAction} className="flex flex-col gap-3.5">
          <div>
            <label className={labelClass}>Neved</label>
            <input name="name" required placeholder="Kovács Anna" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>E-mail cím</label>
            <input name="email" type="email" required placeholder="anna@aroma.hu" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Vendéglátóhely neve</label>
            <input name="business" required placeholder="Aroma" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Üzenet (opcionális)</label>
            <textarea
              name="message"
              placeholder="Pár szó a vendéglátóhelyedről…"
              className="h-20 w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none"
            />
          </div>

          {/* The guest prize-entry form has asked for explicit consent and
              linked the privacy notice since it was built; this form collects
              name, email and business name with neither, which is the same
              category of personal data on the same legal footing. */}
          <label className="flex items-start gap-2 text-left text-[11.5px] leading-relaxed text-slate">
            <input type="checkbox" name="consent" required className="mt-0.5 shrink-0" />
            <span>
              Hozzájárulok, hogy a megadott adataimat a Fydback a demó egyeztetése és a kapcsolatfelvétel
              céljából kezelje. Részletek az{" "}
              <Link href="/adatvedelem" target="_blank" className="font-semibold text-ink underline">
                adatkezelési tájékoztatóban
              </Link>
              .
            </span>
          </label>

          {state.error && <p className="text-sm font-medium text-magenta">{state.error}</p>}

          <SubmitButton />
        </form>
      </div>

      <Link href="/" className="mt-5 text-sm font-semibold text-slate hover:text-ink">
        ← Vissza a főoldalra
      </Link>
    </div>
  );
}
