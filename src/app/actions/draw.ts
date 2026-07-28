"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, escapeHtml } from "@/lib/email";
import { budapestDateKey } from "@/lib/timezone";

export type DrawResult =
  | { ok: true; winner: { id: string; email: string | null; winnerId: string }; alreadyDrawn: boolean }
  | { ok: true; winner: null; alreadyDrawn: false } // no eligible entrants today
  | { ok: false; error: string };

// Draws strictly among TODAY's (Budapest calendar day, not a rolling 24h
// window) prize-entrants for ONE partner — the partnerId comes from
// server-checked state (the admin's own filter selection), and RLS on
// prize_draws independently restricts writes to admins regardless.
export async function drawTodayWinner(adminSlug: string, partnerId: string): Promise<DrawResult> {
  const supabase = await createClient();
  const todayKey = budapestDateKey();

  // Idempotency: unique(partner_id, draw_date) means only one draw per venue
  // per Budapest calendar day can ever exist. Check first so a re-click (or
  // a second admin tab) reports the existing winner instead of drawing again.
  const { data: existingDraw } = await supabase
    .from("prize_draws")
    .select("winner_id, submission_id")
    .eq("partner_id", partnerId)
    .eq("draw_date", todayKey)
    .maybeSingle();

  if (existingDraw) {
    const { data: submission } = await supabase
      .from("submissions")
      .select("id, email")
      .eq("id", existingDraw.submission_id)
      .single();
    return {
      ok: true,
      alreadyDrawn: true,
      winner: { id: submission?.id ?? existingDraw.submission_id, email: submission?.email ?? null, winnerId: existingDraw.winner_id },
    };
  }

  // Coarse 48h pre-filter (keeps the query small/indexed), then narrow to
  // "created_at falls on today's Budapest calendar date" in JS — exact UTC
  // day-boundary math is DST-fragile, and the eligible set here is small.
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: candidates, error: fetchError } = await supabase
    .from("submissions")
    .select("id, email, created_at")
    .eq("partner_id", partnerId)
    .not("prize_id", "is", null)
    .is("winner_id", null)
    .gte("created_at", since);

  if (fetchError) {
    return { ok: false, error: "fetch-failed" };
  }

  const eligible = (candidates ?? []).filter((c) => budapestDateKey(c.created_at) === todayKey);
  if (eligible.length === 0) {
    return { ok: true, winner: null, alreadyDrawn: false };
  }

  const chosen = eligible[Math.floor(Math.random() * eligible.length)];
  const winnerId = `WIN-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

  // The unique(partner_id, draw_date) constraint is the real race guard: if
  // another request already inserted today's draw between our SELECT above
  // and this INSERT, this fails with 23505 and we report "already drawn"
  // instead of silently creating a second winner.
  const { error: insertDrawError } = await supabase.from("prize_draws").insert({
    partner_id: partnerId,
    draw_date: todayKey,
    submission_id: chosen.id,
    winner_id: winnerId,
  });

  if (insertDrawError) {
    if (insertDrawError.code === "23505") {
      return drawTodayWinner(adminSlug, partnerId); // someone else just drew — re-fetch and return it
    }
    return { ok: false, error: "draw-failed" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("submissions")
    .update({ winner_id: winnerId })
    .eq("id", chosen.id)
    .select("id, email, winner_id")
    .single();

  if (updateError || !updated) {
    return { ok: false, error: "winner-flag-failed" };
  }

  if (updated.email) {
    const { data: partner } = await supabase.from("partners").select("name").eq("id", partnerId).single();
    // Best-effort: a failed email doesn't undo the draw — the winner_id is
    // already recorded, and the admin can always relay the code manually.
    await sendEmail({
      to: updated.email,
      subject: "Gratulálunk, nyertél! 🎉",
      html: `
        <p>Szia!</p>
        <p>Ma téged sorsoltunk ki a(z) <strong>${escapeHtml(partner?.name ?? "egységünk")}</strong> napi nyereményjátékában.</p>
        <p>A kupon-kódod: <strong style="font-size:18px">${updated.winner_id}</strong></p>
        <p>Legközelebbi látogatásodkor csak mutasd meg ezt a kódot a pultnál — nincs szükség appra vagy regisztrációra.</p>
      `,
    });
  }

  revalidatePath(`/${adminSlug}/log`);
  return { ok: true, alreadyDrawn: false, winner: { id: updated.id, email: updated.email, winnerId: updated.winner_id! } };
}
