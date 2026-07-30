"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { drawWinnerForPartner } from "@/lib/draw-core";
import { budapestDateKey } from "@/lib/timezone";

export type DrawResult =
  | { ok: true; winner: { id: string; email: string | null; winnerId: string }; alreadyDrawn: boolean }
  | { ok: true; winner: null; alreadyDrawn: false }
  | { ok: false; error: string };

// Manual draw from the admin Napló, for today's Budapest calendar day. The
// nightly cron (src/app/api/cron/daily-draw/route.ts) covers every partner
// automatically; this stays for drawing early, or re-checking who won.
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

  const outcome = await drawWinnerForPartner(supabase, partnerId, budapestDateKey(), budapestDateKey);

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
