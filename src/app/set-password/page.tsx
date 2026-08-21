"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword, type AuthActionState } from "@/app/actions/auth";
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
      {pending ? "Mentés…" : "Jelszó beállítása"}
    </button>
  );
}

// Reached only via the /auth/callback code-exchange redirect after clicking
// an invite or password-reset link — the user already has a valid session
// at this point, just no password of their choosing yet.
export default function SetPasswordPage() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-mist px-6 py-16">
      <div className="mb-7 flex items-center gap-2">
        <Logo size={18} />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-8 shadow-[0_20px_50px_rgba(21,19,28,0.08)]">
        <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Jelszó beállítása</h1>
        <p className="mb-6 text-sm text-slate">Add meg az új jelszavadat a fiókodhoz.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-ink">
              Új jelszó
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-bold text-ink">
              Új jelszó megerősítése
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none"
            />
          </div>

          {state.error && <p className="text-sm font-medium text-magenta">{state.error}</p>}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
