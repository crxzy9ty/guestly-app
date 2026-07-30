import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { drawWinnerForPartner } from "@/lib/draw-core";
import { budapestDateKey } from "@/lib/timezone";

// Nightly prize draw for every partner.
//
// Why this exists: the draw was manual, one click per partner per day. At
// 20-30 partners that is 20-30 clicks every single day, and a day missed means
// guests who gave their email for a draw that never happened — which
// undermines the exact promise the landing page makes.
//
// WHY IT DRAWS YESTERDAY, NOT TODAY: Vercel schedules crons in UTC, while
// eligibility is a Budapest calendar day. Budapest is UTC+1 or UTC+2 depending
// on DST, so any "late evening" UTC slot lands on a different Budapest date in
// summer than in winter — and an end-of-day draw would permanently exclude
// anyone who rated after it ran. Drawing the PREVIOUS complete day from the
// small hours removes both problems: the day is definitely over, every entrant
// is included, and no DST edge case can shift which day is meant.
//
// Idempotent by construction: unique(partner_id, draw_date) means a re-run (a
// retry, a manual trigger, two overlapping invocations) reports the existing
// winner instead of issuing a second coupon.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function yesterdayBudapestKey() {
  return budapestDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Without this the
  // route is a public URL that issues real coupons and sends real email to
  // guests, so a missing secret fails closed rather than running unprotected.
  if (!secret) {
    console.error("[cron/daily-draw] CRON_SECRET is not configured — refusing to run");
    return NextResponse.json({ error: "not-configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dateKey = yesterdayBudapestKey();
  const supabase = createAdminClient();

  const { data: partners, error } = await supabase.from("partners").select("id, name");
  if (error) {
    console.error("[cron/daily-draw] could not list partners:", error.message);
    return NextResponse.json({ error: "partner-list-failed" }, { status: 500 });
  }

  const results: { partner: string; outcome: string; winnerId?: string }[] = [];

  // Sequential rather than Promise.all: each draw sends an email, and a burst
  // of parallel sends is the fastest way to trip Resend's rate limit and lose
  // winner notifications. A handful of partners takes a second or two.
  for (const partner of partners ?? []) {
    try {
      const outcome = await drawWinnerForPartner(supabase, partner.id, dateKey, budapestDateKey);
      if (!outcome.ok) {
        results.push({ partner: partner.name, outcome: `error:${outcome.error}` });
      } else if (!outcome.winner) {
        results.push({ partner: partner.name, outcome: "no-entrants" });
      } else {
        results.push({
          partner: partner.name,
          outcome: outcome.alreadyDrawn ? "already-drawn" : "drawn",
          winnerId: outcome.winner.winnerId,
        });
      }
    } catch (err) {
      // One partner's failure must not abort the rest — a bad row for one
      // venue should not cost every other venue its draw.
      console.error(`[cron/daily-draw] ${partner.name} failed:`, err);
      results.push({ partner: partner.name, outcome: "exception" });
    }
  }

  console.log(`[cron/daily-draw] ${dateKey}:`, JSON.stringify(results));
  return NextResponse.json({ date: dateKey, partners: results.length, results });
}
