"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { sendPartnerMessage, type SendPartnerMessageState } from "@/app/actions/partner-messages";

export type PartnerMessageRow = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const initialState: SendPartnerMessageState = { ok: false, error: null };

function fmtTs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-lg bg-ink px-4 text-sm font-bold text-white disabled:opacity-50"
    >
      {pending ? "Küldés…" : "Üzenet küldése"}
    </button>
  );
}

// Sends a note straight to the Fydback admin — for anything that doesn't fit
// the review data itself (a billing question, a request to change something
// on the account, …). One-way: the admin reads it in Beállítások → Üzenetek,
// there's no reply thread here.
export function MessageAdmin({ partnerId, messages }: { partnerId: string; messages: PartnerMessageRow[] }) {
  const boundAction = sendPartnerMessage.bind(null, partnerId);
  const [state, formAction] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-slate">
        Írj a Fydback csapatának — például számlázási kérdés vagy egy kérés a fiókoddal kapcsolatban. Nincs
        élő chat, a csapat itt olvassa az üzeneteket és e-mailben vagy telefonon veszi fel veled a kapcsolatot.
      </p>

      <form ref={formRef} action={formAction} className="mb-6 rounded-xl border border-line bg-paper p-4">
        <textarea
          name="message"
          required
          maxLength={2000}
          rows={4}
          placeholder="Írd ide az üzeneted…"
          className="mb-3 w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none"
        />
        <div className="flex items-center justify-between gap-3">
          {state.error ? (
            <p className="text-xs font-semibold text-magenta">{state.error}</p>
          ) : state.ok ? (
            <p className="text-xs font-semibold text-green">Elküldve!</p>
          ) : (
            <span />
          )}
          <SubmitButton />
        </div>
      </form>

      {messages.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-slate">Korábbi üzeneteid</div>
          <div className="grid gap-2">
            {messages.map((m) => (
              <div key={m.id} className="rounded-xl border border-line bg-paper p-3.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate">{fmtTs(m.created_at)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      m.is_read ? "bg-mist text-slate" : "bg-violet/10 text-violet"
                    }`}
                  >
                    {m.is_read ? "Olvasva" : "Elküldve"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{m.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
