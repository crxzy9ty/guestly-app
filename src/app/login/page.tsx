"use client";

import { Suspense, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInOwner, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-11 w-full rounded-lg bg-ink text-sm font-bold text-white transition-opacity disabled:opacity-60"
    >
      {pending ? "Bejelentkezés…" : "Bejelentkezés"}
    </button>
  );
}

// /auth/callback redirects here with ?error=auth when exchangeCodeForSession
// fails — most often because the reset/invite link was opened in a different
// browser than the one that requested it (the PKCE code verifier lives in a
// cookie on that first browser), or because the link was already used or has
// expired. Previously this page ignored the query param entirely, so the
// guest landed on an ordinary-looking login screen with zero indication
// anything had gone wrong — indistinguishable from just navigating here.
function CallbackErrorNotice() {
  const params = useSearchParams();
  if (params.get("error") !== "auth") return null;
  return (
    <p className="mb-4 rounded-lg border border-line bg-mist p-3 text-xs leading-relaxed text-ink">
      A link nem működött — lehet, hogy már lejárt, korábban felhasználták, vagy nem ugyanabban a
      böngészőben nyílt meg, mint amiben a kérést indítottad. Kérj egy{" "}
      <Link href="/forgot-password" className="font-semibold underline">
        új linket
      </Link>
      , és ugyanabban a böngészőben nyisd meg, mint ahol igényelted.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(signInOwner, initialState);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-mist px-6 py-16">
      <div className="mb-7 flex items-center gap-2">
        <div className="h-5 w-5 rounded-md bg-gradient-to-br from-cyan via-violet to-magenta" />
        <span className="text-lg font-bold tracking-tight text-ink">Fydback</span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-8 shadow-[0_20px_50px_rgba(21,19,28,0.08)]">
        <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Üdvözlünk újra</h1>
        <p className="mb-6 text-sm text-slate">Jelentkezz be az üzleted statisztikáinak megtekintéséhez.</p>

        {/* useSearchParams needs a Suspense boundary, or the page can't be
            statically rendered at build time. */}
        <Suspense fallback={null}>
          <CallbackErrorNotice />
        </Suspense>

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
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-ink">
              Jelszó
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none"
            />
          </div>

          {state.error && <p className="text-sm font-medium text-magenta">{state.error}</p>}

          <SubmitButton />
        </form>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-xs font-semibold text-slate hover:text-ink">
            Elfelejtett jelszó
          </Link>
        </div>
      </div>

      <Link href="/" className="mt-5 text-sm font-semibold text-slate hover:text-ink">
        ← Vissza a főoldalra
      </Link>
    </div>
  );
}
