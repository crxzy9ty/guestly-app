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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; tempPassword?: string } | null>(null);

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
      if (res.ok) {
        setError(null);
        setSuccess({
          message: res.alreadyExisted
            ? "A meglévő fiók hozzárendelve ehhez az egységhez."
            : res.tempPassword
              ? "Az e-mail küldése most nem sikerült (a rendszer napi/órai e-mail-korlátjába ütköztünk), ezért közvetlenül létrehoztuk a fiókot ideiglenes jelszóval."
              : "Meghívó elküldve — a partner e-mailben kap linket a jelszó beállításához.",
          tempPassword: res.tempPassword,
        });
      } else {
        setSuccess(null);
        setError(res.error);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-paper p-7">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-violet">
          Tulajdonos meghívása
        </div>
        <div className="mb-4 text-base font-bold text-ink">{partner.name}</div>

        {success ? (
          <>
            <p className="mb-4 text-sm leading-relaxed text-ink">✓ {success.message}</p>
            {success.tempPassword && (
              <div className="mb-5 rounded-lg border border-line bg-mist p-3">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate">
                  Add át ezt a partnernek (biztonságos csatornán):
                </div>
                <div className="mb-1 text-xs text-ink">
                  E-mail: <span className="font-mono font-bold">{email.trim().toLowerCase()}</span>
                </div>
                <div className="text-xs text-ink">
                  Jelszó: <span className="font-mono font-bold">{success.tempPassword}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate">
                  Javasold neki, hogy bejelentkezés után változtassa meg a jelszavát.
                </p>
              </div>
            )}
            <button onClick={onClose} className="h-10 w-full rounded-lg bg-ink text-sm font-bold text-white">
              Bezárás
            </button>
          </>
        ) : (
          <>
            <label className="mb-1 block text-xs font-bold text-ink">Partner e-mail címe</label>
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
            {error && <p className="mb-3 text-sm font-medium text-magenta">{error}</p>}
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
