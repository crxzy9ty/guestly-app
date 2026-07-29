"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type SubmitReviewInput = {
  partnerId: string;
  ratings: Record<string, number>;
  reasons: Record<string, string>;
  email?: string;
  prizeConsent?: boolean;
};

export type SubmitReviewResult = { ok: true; enteredPrizeDraw: boolean } | { ok: false; error: string };

function dedupCookieName(partnerId: string) {
  return `gst_rev_${partnerId}`;
}

function generatePrizeId() {
  return `PRZ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

// The one and only DB write for the whole guest flow — deliberately atomic
// and deferred until the guest reaches the very end (skip or prize-entry),
// so anon never needs UPDATE privileges on submissions (it only ever
// INSERTs). The submission id is generated here rather than left to the DB
// default, specifically so we can insert submission_scores rows that
// reference it without ever reading the row back (anon has no SELECT grant
// on submissions — see supabase/migrations/..._rls_policies_and_grants.sql).
export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const cookieStore = await cookies();
  const cookieName = dedupCookieName(input.partnerId);

  if (cookieStore.get(cookieName)) {
    return { ok: false, error: "already-submitted" };
  }

  const aspectKeys = Object.keys(input.ratings);
  if (aspectKeys.length === 0) {
    return { ok: false, error: "empty-submission" };
  }

  const supabase = await createClient();
  const submissionId = crypto.randomUUID();
  const hasPrizeEntry = Boolean(input.email && input.prizeConsent);

  const { error: submissionError } = await supabase.from("submissions").insert({
    id: submissionId,
    partner_id: input.partnerId,
    email: hasPrizeEntry ? input.email : null,
    prize_id: hasPrizeEntry ? generatePrizeId() : null,
    prize_consent_at: hasPrizeEntry ? new Date().toISOString() : null,
  });

  if (submissionError) {
    return { ok: false, error: "insert-failed" };
  }

  const scoreRows = aspectKeys.map((aspectKey) => ({
    submission_id: submissionId,
    aspect_key: aspectKey,
    score: input.ratings[aspectKey],
    reason: input.reasons[aspectKey]?.trim() || null,
  }));

  const { error: scoresError } = await supabase.from("submission_scores").insert(scoreRows);
  if (scoresError) {
    return { ok: false, error: "insert-failed" };
  }

  // 12 hours: enough to stop the same device re-rating the same visit, short
  // enough that a genuine return visit the next day isn't blocked. IP-based
  // matching is a possible future hardening layer, deliberately not built yet.
  cookieStore.set(cookieName, "1", {
    maxAge: 60 * 60 * 12,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { ok: true, enteredPrizeDraw: hasPrizeEntry };
}
