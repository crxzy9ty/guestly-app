import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import { sendEmail, escapeHtml } from "./email";

// The prize-draw mechanics, shared by the admin's manual "Mai nyertes
// sorsolása" button and the nightly cron that draws for every partner.
//
// Takes the Supabase client as a parameter rather than creating one: the
// button runs as the signed-in admin (RLS applies, plus an explicit role check
// at the call site), while the cron has no session at all and must use the
// service-role client. Same logic either way — a second implementation for the
// automated path is exactly how the two would drift into disagreeing about who
// is eligible.

export type DrawOutcome =
  | { ok: true; winner: { submissionId: string; email: string | null; winnerId: string }; alreadyDrawn: boolean }
  | { ok: true; winner: null; alreadyDrawn: false } // no eligible entrants that day
  | { ok: false; error: string };

// 10 hex characters (~1.1e12 codes). The original 5 gave ~1.05M, where the
// birthday bound put a collision near 38% by the 1000th coupon. Unique indexes
// on submissions.winner_id / prize_draws.winner_id enforce this too, so a
// collision is a failed insert we retry rather than two valid coupons.
function generateWinnerId() {
  return `WIN-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

async function existingDraw(
  supabase: SupabaseClient<Database>,
  partnerId: string,
  dateKey: string,
): Promise<DrawOutcome | null> {
  const { data } = await supabase
    .from("prize_draws")
    .select("winner_id, submission_id")
    .eq("partner_id", partnerId)
    .eq("draw_date", dateKey)
    .maybeSingle();

  if (!data) return null;

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, email")
    .eq("id", data.submission_id)
    .maybeSingle();

  return {
    ok: true,
    alreadyDrawn: true,
    winner: {
      submissionId: submission?.id ?? data.submission_id,
      email: submission?.email ?? null,
      winnerId: data.winner_id,
    },
  };
}

/**
 * Draws one winner for `partnerId` among entrants whose submission falls on
 * the Budapest calendar day `dateKey` (YYYY-MM-DD). Idempotent: the
 * unique(partner_id, draw_date) constraint means a second call returns the
 * winner already drawn instead of issuing a second coupon.
 */
export async function drawWinnerForPartner(
  supabase: SupabaseClient<Database>,
  partnerId: string,
  dateKey: string,
  budapestDateKey: (d?: Date | string) => string,
): Promise<DrawOutcome> {
  const already = await existingDraw(supabase, partnerId, dateKey);
  if (already) return already;

  // Coarse 72h pre-filter keeps the scan small and indexed; the exact
  // "falls on this Budapest calendar date" test happens in JS, because UTC
  // day-boundary arithmetic is DST-fragile and the candidate set is tiny.
  // 72h rather than 48h so the nightly cron, which draws for the PREVIOUS
  // day, still has the whole of that day comfortably inside the window.
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data: candidates, error: fetchError } = await supabase
    .from("submissions")
    .select("id, email, created_at")
    .eq("partner_id", partnerId)
    .not("prize_id", "is", null)
    .is("winner_id", null)
    .gte("created_at", since);

  if (fetchError) return { ok: false, error: "fetch-failed" };

  const eligible = (candidates ?? []).filter((c) => budapestDateKey(c.created_at) === dateKey);
  if (eligible.length === 0) return { ok: true, winner: null, alreadyDrawn: false };

  const chosen = eligible[Math.floor(Math.random() * eligible.length)];

  // Two different unique constraints can reject this insert, and they mean
  // opposite things: (partner_id, draw_date) means someone else just drew and
  // we should report THEIR winner, while winner_id means we generated a
  // duplicate code and should simply try another. Distinguished by re-reading
  // the draw rather than assuming.
  let winnerId = generateWinnerId();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from("prize_draws").insert({
      partner_id: partnerId,
      draw_date: dateKey,
      submission_id: chosen.id,
      winner_id: winnerId,
    });

    if (!error) break;
    if (error.code !== "23505") return { ok: false, error: "draw-failed" };

    const raced = await existingDraw(supabase, partnerId, dateKey);
    if (raced) return raced;

    winnerId = generateWinnerId();
    if (attempt === 2) return { ok: false, error: "draw-failed" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("submissions")
    .update({ winner_id: winnerId })
    .eq("id", chosen.id)
    .select("id, email, winner_id")
    .single();

  if (updateError || !updated) return { ok: false, error: "winner-flag-failed" };

  // Best-effort: a failed email does not undo the draw. But the outcome is
  // RECORDED, because an invisible failure means the guest never hears they
  // won and nobody finds out — the Napló flags it so the code can be handed
  // over at the counter instead.
  let emailStatus: "sent" | "failed" | "not-configured" | "no-email" = "no-email";

  if (updated.email) {
    const { data: partner } = await supabase.from("partners").select("name").eq("id", partnerId).maybeSingle();
    emailStatus = await sendEmail({
      to: updated.email,
      subject: "Gratulálunk, nyertél! 🎉",
      html: `
        <p>Szia!</p>
        <p>Kisorsoltunk téged a(z) <strong>${escapeHtml(partner?.name ?? "egységünk")}</strong> napi nyereményjátékában.</p>
        <p>A kupon-kódod: <strong style="font-size:18px">${updated.winner_id}</strong></p>
        <p>Legközelebbi látogatásodkor csak mutasd meg ezt a kódot a pultnál — nincs szükség appra vagy regisztrációra.</p>
      `,
    });
  }

  await supabase.from("submissions").update({ winner_email_status: emailStatus }).eq("id", chosen.id);

  return {
    ok: true,
    alreadyDrawn: false,
    winner: { submissionId: updated.id, email: updated.email, winnerId: updated.winner_id! },
  };
}
