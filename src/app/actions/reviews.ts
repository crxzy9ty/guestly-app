"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReviewToken } from "@/lib/review-token";

export type SubmitReviewInput = {
  partnerId: string;
  token: string;
  ratings: Record<string, number>;
  reasons: Record<string, string>;
  email?: string;
  prizeConsent?: boolean;
};

export type SubmitReviewResult = { ok: true; enteredPrizeDraw: boolean } | { ok: false; error: string };

// Mirrors the textarea's maxLength. The database also caps reason at 500 —
// this is the friendly limit, that one is the guarantee.
const MAX_REASON_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function dedupCookieName(partnerId: string) {
  return `gst_rev_${partnerId}`;
}

function generatePrizeId() {
  return `PRZ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

// The only way a guest review reaches the database. `anon` no longer holds
// INSERT on submissions or submission_scores (see
// supabase/migrations/..._route_review_submission_through_rpc.sql), so the
// PostgREST endpoint that previously accepted unlimited direct POSTs is closed
// and this action is the sole entry point.
//
// Three layers, in order of strength:
//   1. The signed token proves the caller loaded this venue's review page, and
//      its nonce is stored with a unique index so it cannot be replayed.
//   2. The dedup cookie stops an honest guest re-rating the same visit. It is
//      NOT a security control — clearing cookies defeats it, which is fine
//      because that is not the threat it exists for.
//   3. The RPC writes submission and scores in one transaction, so a rejected
//      score can no longer leave a scoreless submission counting toward totals.
export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const verified = verifyReviewToken(input.token ?? "", input.partnerId);
  if (!verified.ok) {
    // Deliberately one message for every failure reason: distinguishing
    // "expired" from "bad signature" tells a forger which half to fix.
    return { ok: false, error: "invalid-token" };
  }

  const cookieStore = await cookies();
  const cookieName = dedupCookieName(input.partnerId);
  if (cookieStore.get(cookieName)) {
    return { ok: false, error: "already-submitted" };
  }

  const aspectKeys = Object.keys(input.ratings ?? {});
  if (aspectKeys.length === 0) {
    return { ok: false, error: "empty-submission" };
  }

  // Values arrive from the client, so every one is checked here rather than
  // trusted because the UI only ever produces valid ones.
  const scores: { aspect_key: string; score: number; reason: string | null }[] = [];
  for (const aspectKey of aspectKeys) {
    const score = input.ratings[aspectKey];
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      return { ok: false, error: "invalid-score" };
    }
    const reason = (input.reasons?.[aspectKey] ?? "").trim().slice(0, MAX_REASON_LENGTH);
    scores.push({ aspect_key: aspectKey, score, reason: reason || null });
  }

  const email = input.email?.trim().toLowerCase() ?? "";
  const wantsPrize = Boolean(input.email && input.prizeConsent);
  if (wantsPrize && (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email))) {
    return { ok: false, error: "invalid-email" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("submit_guest_review", {
    p_partner_id: input.partnerId,
    p_request_nonce: verified.nonce,
    p_email: wantsPrize ? email : null,
    p_prize_id: wantsPrize ? generatePrizeId() : null,
    p_prize_consent_at: wantsPrize ? new Date().toISOString() : null,
    p_scores: scores,
  });

  if (error) {
    // 23505 on the nonce index means this exact token was already spent —
    // a replay, or a double-submit from a flaky connection. Either way the
    // guest's review is already recorded, so report success rather than
    // alarming them into submitting a third time.
    if (error.code === "23505") {
      return { ok: true, enteredPrizeDraw: wantsPrize };
    }
    console.error("[submitReview] rpc failed:", error.message);
    return { ok: false, error: "insert-failed" };
  }

  // Value carries WHAT was submitted and WHEN, not just "yes".
  //
  // Setting a cookie in a Server Action makes Next.js re-render the route, so
  // the review page's own server-side "already submitted?" check fires
  // immediately and replaced the client's success screen with "Már értékeltél
  // ma" — the guest never saw the confirmation they had just given their email
  // address for. The page uses these two fields to show the right screen for a
  // few minutes before falling back to the returning-visitor message.
  cookieStore.set(cookieName, `${wantsPrize ? "prize" : "plain"}.${Date.now()}`, {
    maxAge: 60 * 60 * 12,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { ok: true, enteredPrizeDraw: wantsPrize };
}
