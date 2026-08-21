// One-off script: creates (or reuses) a single persistent "DEMO – " partner
// with exactly 50 realistic-looking reviews, for the public no-login demo
// page at /demo/elonezet (src/app/demo/elonezet/page.tsx). Not part of the
// app runtime — run manually, once, from a machine with .env.local.
//
// Usage:
//   npx tsx scripts/seed-demo-partner.ts
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
// Prints the partner id at the end — paste it into DEMO_PARTNER_ID in
// src/app/demo/elonezet/page.tsx.
//
// Re-running this script is safe: if a partner named "DEMO – Kávézó Aroma"
// already exists, it's reused rather than duplicated (its old submissions
// are left alone — this only tops it up, it never deletes).

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

const PARTNER_NAME = "DEMO – Kávézó Aroma";
const QUESTION_SET_ID = "00000000-0000-0000-0000-000000000001";
const REVIEW_COUNT = 50;
const BASELINE = 7.6;

const REASONS_LOW = [
  "Sokat kellett várni.",
  "Nem voltak elég figyelmesek.",
  "Hidegen érkezett az étel.",
  "Zsúfolt volt, kevés a személyzet.",
  "Nem volt tiszta az asztal.",
  "Kicsit rendetlen volt a mosdó.",
];
const REASONS_HIGH = [
  "Nagyon kedvesek voltak!",
  "Gyors és profi kiszolgálás.",
  "Isteni volt minden.",
  "Tökéletes hangulat.",
  "Mindig szívesen jövünk vissza.",
  "Kifogástalan volt az egész élmény.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clampScore(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let partnerId: string;
  const { data: existing } = await supabase.from("partners").select("id").eq("name", PARTNER_NAME).maybeSingle();

  if (existing) {
    partnerId = existing.id;
    console.log(`Reusing existing partner ${PARTNER_NAME} (${partnerId})`);
  } else {
    const { data: created, error } = await supabase
      .from("partners")
      .insert({
        name: PARTNER_NAME,
        address: "Váci utca 12, Budapest",
        question_set_id: QUESTION_SET_ID,
        alert_threshold: 6.5,
      })
      .select("id")
      .single();

    if (error || !created) {
      console.error("Failed to create demo partner:", error?.message);
      process.exit(1);
    }
    partnerId = created.id;
    console.log(`Created partner ${PARTNER_NAME} (${partnerId})`);
  }

  const { data: aspects, error: aspectsError } = await supabase
    .from("question_aspects")
    .select("key")
    .eq("question_set_id", QUESTION_SET_ID);

  if (aspectsError || !aspects || aspects.length === 0) {
    console.error("Failed to load question_aspects for the default question set:", aspectsError?.message);
    process.exit(1);
  }

  for (let i = 0; i < REVIEW_COUNT; i++) {
    const daysBack = Math.floor(Math.random() * 60);
    const hour = 8 + Math.floor(Math.random() * 13); // 8-20
    const minute = Math.floor(Math.random() * 60);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysBack);
    createdAt.setHours(hour, minute, 0, 0);

    const hasEmail = Math.random() < 0.35;
    const email = hasEmail ? `vendeg${Math.floor(Math.random() * 100000)}@example.com` : null;
    const hasPrize = hasEmail && Math.random() < 0.5;

    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .insert({
        partner_id: partnerId,
        created_at: createdAt.toISOString(),
        email,
        prize_id: hasPrize ? crypto.randomUUID() : null,
        prize_consent_at: hasPrize ? createdAt.toISOString() : null,
      })
      .select("id")
      .single();

    if (subError || !submission) {
      console.error(`Submission ${i + 1}/${REVIEW_COUNT} failed:`, subError?.message);
      continue;
    }

    const scoreRows = aspects.map((a) => {
      const score = clampScore(BASELINE + (Math.random() * 4 - 2));
      let reason: string | null = null;
      if (score <= 4 && Math.random() < 0.3) reason = pick(REASONS_LOW);
      else if (score >= 9 && Math.random() < 0.3) reason = pick(REASONS_HIGH);
      return { submission_id: submission.id, aspect_key: a.key, score, reason };
    });

    const { error: scoresError } = await supabase.from("submission_scores").insert(scoreRows);
    if (scoresError) {
      console.error(`Scores for submission ${i + 1}/${REVIEW_COUNT} failed:`, scoresError.message);
    }
  }

  console.log(`Done. ${REVIEW_COUNT} reviews seeded for partner id: ${partnerId}`);
  console.log(`Paste this into DEMO_PARTNER_ID in src/app/demo/elonezet/page.tsx: "${partnerId}"`);
}

main();
