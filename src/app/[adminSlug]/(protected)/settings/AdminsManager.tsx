"use client";

import { useEffect, useState, useTransition } from "react";
import { inviteAdmin } from "@/app/actions/invite-admin";
import { formatRelative, staleness, stalenessColor, exactTooltip } from "@/lib/relative-time";

export type AdminRow = { id: string; email: string | null; last_seen_at: string | null };

function InviteAdminModal({ adminSlug, onClose }: { adminSlug: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [skipEmail, setSkipEmail] = useState(false);
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
      const res = await inviteAdmin(adminSlug, email, skipEmail);
      if (res.ok) {
        setError(null);
        setSuccess({
          message: res.alreadyExisted
            ? "Ez a fiók már admin — nincs teendő."
            : res.tempPassword && res.emailSkipped
              ? "Fiók létrehozva, e-mail nélkül. Add át az alábbi belépési adatokat, biztonságos csatornán."
              : res.tempPassword
                ? "Az e-mail küldése most nem sikerült, ezért közvetlenül létrehoztuk a fiókot ideiglenes jelszóval."
                : "Meghívó elküldve — a linkre kattintva állíthatja be a jelszavát.",
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
          Admin meghívása
        </div>
        <div className="mb-4 text-base font-bold text-ink">Teljes hozzáférés minden partnerhez</div>

        {success ? (
          <>
            <p className="mb-4 text-sm leading-relaxed text-ink">✓ {success.message}</p>
            {success.tempPassword && (
              <div className="mb-5 rounded-lg border border-line bg-mist p-3">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate">
                  Add át ezt az új adminnak (biztonságos csatornán):
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
            <p className="mb-3 text-[11.5px] leading-relaxed text-slate">
              Az admin fiók minden partner minden adatához hozzáfér, beleértve a vendégek e-mail
              címét és a sorsolási adatokat is — csak olyan embernek küldd, akiben megbízol.
            </p>
            <label className="mb-1 block text-xs font-bold text-ink">E-mail cím</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="masikadmin@fydback.hu"
              className="mb-3 h-10 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none"
            />

            <label className="mb-3 flex items-start gap-2 rounded-lg border border-line bg-mist p-2.5 text-left text-[11px] leading-relaxed text-ink">
              <input
                type="checkbox"
                checked={skipEmail}
                onChange={(e) => setSkipEmail(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span>
                <strong>Jelszó generálása e-mail helyett.</strong> Nem küldünk levelet — a fiók azonnal
                elkészül, és itt megjelenik egy ideiglenes jelszó, amit átadhatsz.
              </span>
            </label>

            {error && <p className="mb-3 text-sm font-medium text-magenta">{error}</p>}
            <div className="flex gap-2">
              <button
                disabled={!email.includes("@") || isPending}
                onClick={submit}
                className="h-10 flex-1 rounded-lg bg-ink text-sm font-bold text-white disabled:opacity-40"
              >
                {isPending ? (skipEmail ? "Létrehozás…" : "Küldés…") : skipEmail ? "Fiók létrehozása" : "Meghívás"}
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

export function AdminsManager({ adminSlug, admins, currentUserId }: { adminSlug: string; admins: AdminRow[]; currentUserId: string }) {
  const [inviting, setInviting] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="max-w-md text-[12.5px] leading-relaxed text-slate">
          Egyszerre több admin fiók is bejelentkezhet, egymástól függetlenül — nincs korlátozva a
          szám. Mindegyik ugyanazt a teljes hozzáférést kapja.
        </p>
        <button
          onClick={() => setInviting(true)}
          className="h-10 shrink-0 rounded-lg bg-ink px-4 text-xs font-bold text-white"
        >
          + Admin meghívása
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[420px] border-collapse text-xs">
          <thead>
            <tr className="bg-mist text-left">
              <th className="px-3 py-2 font-bold text-slate">E-mail</th>
              <th className="px-3 py-2 font-bold text-slate">Utolsó belépés</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const state = staleness(a.last_seen_at, "login");
              const color = stalenessColor(state);
              return (
                <tr key={a.id} className="border-t border-line">
                  <td className="px-3 py-2 font-bold text-ink">
                    {a.email ?? "—"}
                    {a.id === currentUserId && (
                      <span className="ml-1.5 rounded-full bg-line px-1.5 py-0.5 text-[10px] font-bold text-slate">
                        te
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      title={exactTooltip(a.last_seen_at)}
                      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                      style={{ background: color.bg, color: color.fg }}
                    >
                      {formatRelative(a.last_seen_at)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inviting && <InviteAdminModal adminSlug={adminSlug} onClose={() => setInviting(false)} />}
    </div>
  );
}
