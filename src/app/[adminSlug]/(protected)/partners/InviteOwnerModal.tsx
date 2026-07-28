"use client";

import { useEffect, useState, useTransition } from "react";
import { inviteOwnerToPartner } from "@/app/actions/invite-owner";

export function InviteOwnerModal({
  adminSlug,
  partner,
  onClose,
}: {
  adminSlug: string;
  partner: { id: string; name: string };
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const submit = () => {
    startTransition(async () => {
      const res = await inviteOwnerToPartner(adminSlug, partner.id, email);
      setResult(
        res.ok
          ? {
              ok: true,
              message: res.alreadyExisted
                ? "A meglévő fiók hozzárendelve ehhez az egységhez."
                : "Meghívó elküldve — a tulajdonos e-mailben kap linket a jelszó beállításához.",
            }
          : { ok: false, message: res.error },
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-paper p-7">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-violet">
          Tulajdonos meghívása
        </div>
        <div className="mb-4 text-base font-bold text-ink">{partner.name}</div>

        {result?.ok ? (
          <>
            <p className="mb-5 text-sm leading-relaxed text-ink">✓ {result.message}</p>
            <button onClick={onClose} className="h-10 w-full rounded-lg bg-ink text-sm font-bold text-white">
              Bezárás
            </button>
          </>
        ) : (
          <>
            <label className="mb-1 block text-xs font-bold text-ink">Tulajdonos e-mail címe</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tulajdonos@email.hu"
              className="mb-2 h-10 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none"
            />
            <p className="mb-4 text-[11px] leading-relaxed text-slate">
              Ha ez egy új e-mail cím, meghívó levelet kap jelszó-beállító linkkel. Ha már van fiókja (mert
              másik egységet is kezel), csak hozzárendeljük ehhez az egységhez is.
            </p>
            {result && !result.ok && <p className="mb-3 text-sm font-medium text-magenta">{result.message}</p>}
            <div className="flex gap-2">
              <button
                disabled={!email.includes("@") || isPending}
                onClick={submit}
                className="h-10 flex-1 rounded-lg bg-ink text-sm font-bold text-white disabled:opacity-40"
              >
                {isPending ? "Küldés…" : "Meghívás"}
              </button>
              <button onClick={onClose} className="h-10 rounded-lg border border-line px-4 text-sm font-bold text-ink">
                Mégsem
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
