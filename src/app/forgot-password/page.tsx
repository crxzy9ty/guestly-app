"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { requestPasswordReset, type AuthActionState } from "@/app/actions/auth";
import { Logo } from "@/app/Logo";

const initialState: AuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-11 w-full rounded-lg bg-ink text-sm font-bold text-white transition-opacity disabled:opacity-60"
    >
      {pending ? "Küldés…" : "Visszaállító link kérése"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-mist px-6 py-16">
      <div className="mb-7 flex items-center gap-2">
        <Logo size={18} />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-8 shadow-[0_20px_50px_rgba(21,19,28,0.08)]">
        <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Elfelejtett jelszó</h1>
        <p className="mb-6 text-sm text-slate">
          Add meg a fiókodhoz tartozó e-mail címet, küldünk egy linket az új jelszó beállításához.
        </p>

        {state.success ? (
          <p className="text-sm leading-relaxed text-ink">
            Ha létezik fiók ezzel az e-mail címmel, hamarosan kapsz egy linket a jelszó
            beállításához.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-ink">
                E-mail cím
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="partner@kavezoaroma.hu"
                className="h-11 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none"
              />
            </div>

            {state.error && <p className="text-sm font-medium text-magenta">{state.error}</p>}

            <SubmitButton />
          </form>
        )}
      </div>

      <Link href="/login" className="mt-5 text-sm font-semibold text-slate hover:text-ink">
        ← Vissza a bejelentkezéshez
      </Link>
    </div>
  );
}
