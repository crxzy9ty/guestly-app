"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { drawWinnerForPartner } from "@/lib/draw-core";
import { budapestWeekStartKey, budapestMonthStartKey } from "@/lib/timezone";
import { resolveContent } from "@/lib/content";
import { resolvePrizeText } from "@/lib/prize-copy";

export type DrawResult =
  | { ok: true; winner: { id: string; email: string | null; winnerId: string }; alreadyDrawn: boolean }
  | { ok: true; winner: null; alreadyDrawn: false }
  | { ok: false; error: string };

// Manual draw from the admin Napló, for the partner's CURRENT (still
// in-progress) Budapest week or month. The nightly cron
// (src/app/api/cron/daily-draw/route.ts) covers every partner automatically
// once their period completes; this stays for closing a period early, or
// re-checking who won.
//
// `partnerId` arrives from the client, so the admin check below is not
// optional: RLS on prize_draws would also reject a non-admin, but relying on
// that alone leaves the action's own contract undefined — the same reasoning
// as the explicit check in inviteOwnerToPartner.
export async function drawTodayWinner(adminSlug: string, partnerId: string): Promise<DrawResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not-authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "not-authorized" };

  const [{ data: partner }, { data: contentRow }] = await Promise.all([
    supabase.from("partners").select("prize_frequency, prize_description").eq("id", partnerId).maybeSingle(),
    supabase.from("content_settings").select("content").eq("id", 1).maybeSingle(),
  ]);
  if (!partner) return { ok: false, error: "unknown-partner" };

  const frequency = partner.prize_frequency === "monthly" ? "monthly" : "weekly";
  const periodKeyFn = frequency === "weekly" ? budapestWeekStartKey : budapestMonthStartKey;
  const prizeText = resolvePrizeText(partner.prize_description, resolveContent(contentRow?.content).defaultPrizeDescription);

  const outcome = await drawWinnerForPartner(supabase, partnerId, periodKeyFn(), frequency, periodKeyFn, prizeText);

  if (!outcome.ok) return outcome;

  revalidatePath(`/${adminSlug}/log`);

  if (!outcome.winner) return { ok: true, winner: null, alreadyDrawn: false };
  return {
    ok: true,
    alreadyDrawn: outcome.alreadyDrawn,
    winner: {
      id: outcome.winner.submissionId,
      email: outcome.winner.email,
      winnerId: outcome.winner.winnerId,
    },
  };
}
