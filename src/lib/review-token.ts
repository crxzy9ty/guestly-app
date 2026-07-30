import "server-only";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

// Proof that a guest actually loaded a venue's review page before submitting.
//
// The page mints one of these server-side and hands it to the client; the
// submit action refuses anything else. On its own that is not a wall — an
// attacker can still fetch the page to get a token — but it turns "POST a row
// as fast as you like" into "fetch a page, then post one row", which is the
// difference between trivially stuffing a partner's ballot and having to work
// at it. The single-use nonce below is what stops one fetched token being
// replayed thousands of times.
//
// This is one half of the defence. The other half, and the more important one,
// is that `anon` no longer holds INSERT on submissions at all (see
// supabase/migrations/..._route_review_submission_through_rpc.sql) — so the
// PostgREST endpoint is closed and this action is the only way in.

const TOKEN_TTL_MS = 3 * 60 * 60 * 1000; // 3h: a long meal, not an open door.

// A dedicated secret is cleaner, but falling back to the service-role key means
// this works with no extra Vercel configuration. Both are server-only and
// stable across deploys, which is all the HMAC needs; the fallback is never
// transmitted anywhere, only used as key material.
function secret(): string {
  const key = process.env.REVIEW_TOKEN_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("REVIEW_TOKEN_SECRET / SUPABASE_SECRET_KEY missing — cannot sign review tokens");
  return key;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export type ReviewToken = { token: string };

/** Mints a token bound to one partner, valid for TOKEN_TTL_MS. */
export function mintReviewToken(partnerId: string): string {
  const nonce = randomUUID();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${partnerId}.${expiresAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export type VerifiedToken = { ok: true; nonce: string } | { ok: false; reason: "malformed" | "bad-signature" | "expired" | "wrong-partner" };

/**
 * Verifies a token against the partner it is being used for. Returns the nonce
 * so the caller can persist it — the database's unique constraint on that
 * column is what makes the token single-use.
 */
export function verifyReviewToken(token: string, partnerId: string): VerifiedToken {
  const parts = token.split(".");
  if (parts.length !== 4) return { ok: false, reason: "malformed" };

  const [tokenPartnerId, expiresAtRaw, nonce, signature] = parts;
  const payload = `${tokenPartnerId}.${expiresAtRaw}.${nonce}`;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  // Compare before anything else, and in constant time: length-varying or
  // early-exit comparison of an HMAC is the classic way to leak it byte by byte.
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, reason: "bad-signature" };
  }

  // Only trust these AFTER the signature checks out — until then they are
  // attacker-supplied strings, not values.
  if (tokenPartnerId !== partnerId) return { ok: false, reason: "wrong-partner" };

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return { ok: false, reason: "expired" };

  return { ok: true, nonce };
}
