"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export type DrawResult =
  | { ok: true; winner: { id: string; email: string | null; winnerId: string } }
  | { ok: true; winner: null } // no eligible entrants today
  | { ok: false; error: string };

// Draws strictly among today's (last 24h) prize-entrants for ONE partner —
// the partnerId comes from server-checked state (the admin's own filter
// selection, re-validated here, not a client-supplied "trust me" value), so
// there is no way to accidentally draw across venues.
export async function drawTodayWinner(adminSlug: string, partnerId: string): Promise<DrawResult> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: eligible, error: fetchError } = await supabase
    .from("submissions")
    .select("id, email")
    .eq("partner_id", partnerId)
    .not("prize_id", "is", null)
    .is("winner_id", null)
    .gte("created_at", since);

  if (fetchError) {
    return { ok: false, error: "fetch-failed" };
  }
  if (!eligible || eligible.length === 0) {
    return { ok: true, winner: null };
  }

  const chosen = eligible[Math.floor(Math.random() * eligible.length)];
  const winnerId = `WIN-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

  // .is("winner_id", null) here doubles as a race guard: if another admin
  // click already claimed this row between the SELECT above and this UPDATE,
  // this affects zero rows and .single() throws, so we report a miss instead
  // of silently double-declaring a winner.
  const { data: updated, error: updateError } = await supabase
    .from("submissions")
    .update({ winner_id: winnerId })
    .eq("id", chosen.id)
    .is("winner_id", null)
    .select("id, email, winner_id")
    .single();

  if (updateError || !updated) {
    return { ok: false, error: "race-lost" };
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
        <p>Ma téged sorsoltunk ki a(z) <strong>${partner?.name ?? "egységünk"}</strong> napi nyereményjátékában.</p>
        <p>A kupon-kódod: <strong style="font-size:18px">${updated.winner_id}</strong></p>
        <p>Legközelebbi látogatásodkor csak mutasd meg ezt a kódot a pultnál — nincs szükség appra vagy regisztrációra.</p>
      `,
    });
  }

  revalidatePath(`/${adminSlug}/log`);
  return { ok: true, winner: { id: updated.id, email: updated.email, winnerId: updated.winner_id! } };
}
