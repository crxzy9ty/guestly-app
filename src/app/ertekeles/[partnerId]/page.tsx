import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { mintReviewToken } from "@/lib/review-token";
import { GuestReviewFlow } from "./GuestReviewFlow";

// Rendered per request so every visitor gets a fresh, single-use token; a
// cached page would hand the same spent token to everyone after the first.
export const dynamic = "force-dynamic";

export default async function GuestReviewPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = await params;
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id, name, question_set_id, alert_threshold")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partner) {
    return (
      <Centered>
        <h1 className="mb-2 text-xl font-bold text-ink">Ez a link nem érvényes</h1>
        <p className="text-sm text-slate">
          Ez a QR-kód vagy link nem tartozik aktív egységhez. Kérdezd meg a pultosnál a helyes kódot.
        </p>
      </Centered>
    );
  }

  const { data: aspects } = await supabase
    .from("question_aspects")
    .select("key, label, icon")
    .eq("question_set_id", partner.question_set_id ?? "")
    .order("sort_order");

  if (!aspects || aspects.length === 0) {
    return (
      <Centered>
        <h1 className="mb-2 text-xl font-bold text-ink">Egy pillanat…</h1>
        <p className="text-sm text-slate">
          Ehhez az egységhez még nincs beállítva kérdéssor — szólj a pultosnak.
        </p>
      </Centered>
    );
  }

  const cookieStore = await cookies();
  const alreadySubmitted = Boolean(cookieStore.get(`gst_rev_${partnerId}`));

  if (alreadySubmitted) {
    return (
      <Centered dark>
        <div className="mb-3 text-4xl">☕</div>
        <h1 className="mb-2 text-xl font-bold text-white">Már értékeltél ma</h1>
        <p className="text-sm text-white/70">
          Köszönjük, hogy megosztottad velünk a véleményed — legközelebbi látogatásodkor újra
          várjuk az értékelésed.
        </p>
      </Centered>
    );
  }

  return (
    <GuestReviewFlow
      partnerId={partner.id}
      partnerName={partner.name}
      aspects={aspects}
      token={mintReviewToken(partner.id)}
    />
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
