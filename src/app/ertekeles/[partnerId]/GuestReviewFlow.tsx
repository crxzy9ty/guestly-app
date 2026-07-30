"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { submitReview } from "@/app/actions/reviews";

type Aspect = { key: string; label: string; icon: string | null };

const GRAD = "linear-gradient(135deg, #22E5EA 0%, #5B21B6 55%, #E619C8 100%)";

// All rating state lives here, client-side, across the whole flow. The
// actual DB write (submitReview) only fires once, at the very end — see the
// comment in src/app/actions/reviews.ts for why.
export function GuestReviewFlow({
  partnerId,
  partnerName,
  aspects,
  token,
}: {
  partnerId: string;
  partnerName: string;
  aspects: Aspect[];
  // Minted server-side per page load and single-use — see
  // src/lib/review-token.ts. Passed straight back with the submission.
  token: string;
}) {
  const [screen, setScreen] = useState<
    | "welcome"
    | "form"
    | "askReason"
    | "thanks"
    | "prizeEmail"
    | "prizeConfirmed"
    | "prizeCapped"
    | "done"
    | "error"
  >("welcome");
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reasonDraft, setReasonDraft] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const aspect = aspects[step];

  const overall = useMemo(() => {
    const vals = Object.values(ratings);
    if (vals.length === 0) return null;
    return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  }, [ratings]);

  const pick = (val: number) => {
    const next = { ...ratings, [aspect.key]: val };
    setRatings(next);
    if (val <= 3) {
      setReasonDraft("");
      setScreen("askReason");
    } else {
      advance();
    }
  };

  const advance = () => {
    if (step < aspects.length - 1) {
      setStep(step + 1);
      setScreen("form");
    } else {
      setScreen("thanks");
    }
  };

  const submitReasonAndAdvance = () => {
    setReasons({ ...reasons, [aspect.key]: reasonDraft.trim() });
    advance();
  };

  const finish = (withPrize: boolean) => {
    startTransition(async () => {
      const result = await submitReview({
        partnerId,
        token,
        ratings,
        reasons,
        email: withPrize ? email : undefined,
        prizeConsent: withPrize ? consent : undefined,
      });
      if (!result.ok) {
        setScreen("error");
        return;
      }
      // Asking to enter the draw and actually being entered are different
      // things: an address that has already entered this venue's draw twice
      // today is capped. The review is still saved, so say that rather than
      // congratulating them on an entry they did not get.
      if (withPrize && !result.enteredPrizeDraw) {
        setScreen("prizeCapped");
        return;
      }
      setScreen(withPrize ? "prizeConfirmed" : "done");
    });
  };

  if (screen === "welcome") {
    return (
      <Centered>
        <div className="mb-6 text-4xl">☕</div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-ink">Milyen volt ma nálunk?</h1>
        <p className="mb-8 text-sm leading-relaxed text-slate">
          Ha valami nem stimmelt, nem kell odahívnod senkit — csak írd meg itt, 30 másodperc alatt.
        </p>
        <button onClick={() => setScreen("form")} style={{ background: "var(--color-ink)" }} className="h-12 w-full rounded-lg text-sm font-bold text-white">
          Kezdjük
        </button>
        <div className="mt-8 text-xs font-semibold text-slate">{partnerName}</div>
      </Centered>
    );
  }

  if (screen === "error") {
    return (
      <Centered>
        <h1 className="mb-2 text-xl font-bold text-ink">Hiba történt</h1>
        <p className="text-sm text-slate">
          Nem sikerült elküldeni az értékelést. Kérjük, próbáld újra egy perc múlva.
        </p>
      </Centered>
    );
  }

  if (screen === "askReason") {
    return (
      <FormShell partnerName={partnerName} step={step} total={aspects.length}>
        <div className="mb-2 text-center text-3xl">💬</div>
        <h1 className="mb-2 text-center text-xl font-bold text-ink">Mi ment rosszul?</h1>
        <p className="mb-5 text-center text-sm text-slate">Pár szó sokat segít — teljesen opcionális.</p>
        <textarea
          value={reasonDraft}
          onChange={(e) => setReasonDraft(e.target.value)}
          maxLength={200}
          placeholder="Pl. sokáig kellett várni, hideg volt az étel…"
          className="h-24 w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none"
        />
        <button
          onClick={submitReasonAndAdvance}
          className="mt-4 h-12 w-full rounded-lg bg-ink text-sm font-bold text-white"
        >
          Tovább
        </button>
        <button
          onClick={advance}
          className="mt-3 w-full text-center text-sm font-semibold text-slate"
        >
          Kihagyom
        </button>
      </FormShell>
    );
  }

  if (screen === "form") {
    return (
      <FormShell partnerName={partnerName} step={step} total={aspects.length}>
        <div className="mb-2 text-center text-3xl">{aspect.icon}</div>
        <h1 className="mb-7 text-center text-xl font-bold text-ink">{aspect.label}</h1>
        <ScalePicker value={ratings[aspect.key]} onChange={pick} />
        {step > 0 && (
          <button
            onClick={() => {
              setStep(step - 1);
            }}
            className="mt-6 w-full text-center text-sm font-semibold text-slate"
          >
            ← Előző kérdés
          </button>
        )}
      </FormShell>
    );
  }

  if (screen === "thanks") {
    return (
      <Centered dark>
        <div className="mb-2 text-4xl">☕</div>
        <h1 className="mb-2 text-xl font-bold text-white">Köszönjük!</h1>
        {overall && (
          <p className="mb-6 text-sm text-white/80">
            Átlagos értékelésed:{" "}
            <strong
              style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
            >
              {overall} / 10
            </strong>
          </p>
        )}
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
          <div className="mb-1.5 text-2xl">🎁</div>
          <div className="mb-1.5 text-sm font-bold text-white">Szeretnél nyerni egy ingyen kávét?</div>
          <p className="mb-4 text-xs leading-relaxed text-white/60">
            Add meg az e-mail címed a sorsoláshoz. Ez teljesen opcionális — az értékelésed enélkül is
            beérkezett.
          </p>
          <button
            onClick={() => setScreen("prizeEmail")}
            className="h-11 w-full rounded-lg bg-ink text-sm font-bold text-white"
            style={{ background: GRAD }}
          >
            Részt veszek
          </button>
        </div>
        <button
          onClick={() => finish(false)}
          disabled={isPending}
          className="text-sm font-semibold text-white/60 disabled:opacity-50"
        >
          {isPending ? "Küldés…" : "Kihagyom, köszönöm"}
        </button>
      </Centered>
    );
  }

  if (screen === "prizeEmail") {
    const canSubmit = email.includes("@") && consent;
    return (
      <Centered>
        <div className="mb-3 text-3xl">🎁</div>
        <h1 className="mb-2 text-lg font-bold text-ink">Add meg az e-mail címed</h1>
        <p className="mb-4 text-xs leading-relaxed text-slate">
          Minden nap egy vendég nyer egy ingyen kávét az aznap értékelők között, a sorsolás másnap
          reggel történik — csak ehhez használjuk az e-mail címed, máshova nem kerül, nem küldünk
          hírlevelet.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nev@email.hu"
          className="mb-3 h-11 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none"
        />
        <label className="mb-5 flex items-start gap-2 text-left text-xs leading-relaxed text-slate">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Hozzájárulok, hogy az e-mail címemet a napi nyereményjáték lebonyolításához (a nyertes
            értesítéséhez) felhasználjátok. Részletek az{" "}
            <Link href="/adatvedelem" target="_blank" className="font-semibold text-ink underline">
              adatkezelési tájékoztatóban
            </Link>
            .
          </span>
        </label>
        <button
          onClick={() => finish(true)}
          disabled={!canSubmit || isPending}
          className="h-11 w-full rounded-lg bg-ink text-sm font-bold text-white disabled:opacity-40"
        >
          {isPending ? "Küldés…" : "Jelentkezés a sorsolásra"}
        </button>
        <button
          onClick={() => setScreen("thanks")}
          disabled={isPending}
          className="mt-3 text-sm font-semibold text-slate"
        >
          ← Mégsem
        </button>
      </Centered>
    );
  }

  if (screen === "prizeCapped") {
    return (
      <Centered dark>
        <div className="mb-2 text-4xl">✓</div>
        <h1 className="mb-2 text-xl font-bold text-white">Köszönjük az értékelést!</h1>
        <p className="text-sm leading-relaxed text-white/70">
          Ezzel az e-mail címmel ma már kétszer jelentkeztél itt a sorsolásra, ezért ez a beküldés a
          mai sorsolásba nem számít bele — az értékelésed viszont megérkezett, és holnap újra
          játszhatsz.
        </p>
      </Centered>
    );
  }

  if (screen === "prizeConfirmed") {
    return (
      <Centered dark>
        <div className="mb-2 text-4xl">✓</div>
        <h1 className="mb-2 text-xl font-bold text-white">Sikeres jelentkezés!</h1>
        {/* "Másnap reggel", not "a mai nap végén": the draw runs in the small
            hours for the completed previous day, so that nobody who rates late
            in the evening is left out of it. */}
        <p className="mb-3 text-sm leading-relaxed text-white/70">
          A mai nap összes értékelője között másnap reggel sorsolunk. Ha nyersz, e-mailben kapsz egy
          egyedi kupon-kódot.
        </p>
        {/* Worth saying out loud: a first message from an unfamiliar sender
            lands in spam often enough that a winner who never thinks to look
            there simply doesn't get their prize. */}
        <p className="text-xs leading-relaxed text-white/50">
          Ha nem találod a levelet, nézd meg a spam mappát is.
        </p>
      </Centered>
    );
  }

  // done
  return (
    <Centered dark>
      <div className="mb-2 text-4xl">☕</div>
      <h1 className="mb-2 text-xl font-bold text-white">Köszönjük az időt!</h1>
      <p className="text-sm text-white/70">Az értékelésed megérkezett.</p>
    </Centered>
  );
}

function ScalePicker({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-2.5 flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`h-11 flex-1 rounded-lg border text-sm font-bold transition-colors ${
                active ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-slate">
        <span>😞 Rossz</span>
        <span>😍 Kiváló</span>
      </div>
    </div>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="mb-6 flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full"
          style={{
            background: i < current ? "var(--color-line)" : i === current ? "var(--color-ink)" : "var(--color-line)",
            opacity: i < current ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}

function FormShell({
  partnerName,
  step,
  total,
  children,
}: {
  partnerName: string;
  step: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet">
          {partnerName}
        </div>
        <div className="mb-4 text-xs text-slate">
          {step + 1}. kérdés a {total}-ból
        </div>
        <ProgressDots total={total} current={step} />
        {children}
      </div>
    </div>
  );
}

function Centered({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`flex min-h-full flex-1 flex-col items-center justify-center px-8 py-16 text-center ${
        dark ? "bg-ink" : "bg-paper"
      }`}
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
