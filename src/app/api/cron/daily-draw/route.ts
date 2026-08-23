import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { drawWinnerForPartner } from "@/lib/draw-core";
import { budapestDateKey, budapestWeekday, budapestWeekStartKey, budapestMonthStartKey } from "@/lib/timezone";
import { resolveContent } from "@/lib/content";
import { resolvePrizeText } from "@/lib/prize-copy";

// Nightly check for every partner — draws only for whichever partners'
// period (week or month, per partners.prize_frequency) just closed.
//
// Why nightly rather than only-on-reset-days: a single cron schedule that
// runs every night and internally decides who's due today is simpler and
// more robust than juggling separate weekly/monthly Vercel cron entries, and
// it's the exact same "did yesterday complete a period" question either way.
//
// WHY IT DRAWS FOR YESTERDAY, NOT TODAY: Vercel schedules crons in UTC, while
// eligibility is Budapest calendar time. Budapest is UTC+1 or UTC+2 depending
// on DST, so any "late evening" UTC slot lands on a different Budapest date in
// summer than in winter — and drawing for the day/period still in progress
// would permanently exclude anyone who rated after it ran. Drawing the
// PREVIOUS complete period from the small hours removes both problems.
//
// Idempotent by construction: unique(partner_id, draw_date) means a re-run (a
// retry, a manual trigger, two overlapping invocations) reports the existing
// winner instead of issuing a second coupon.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function yesterday() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
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

  const supabase = createAdminClient();

  const [{ data: partners, error: partnersError }, { data: contentRow }] = await Promise.all([
    supabase.from("partners").select("id, name, prize_frequency, prize_description"),
    supabase.from("content_settings").select("content").eq("id", 1).maybeSingle(),
  ]);

  if (partnersError) {
    console.error("[cron/daily-draw] could not list partners:", partnersError.message);
    return NextResponse.json({ error: "partner-list-failed" }, { status: 500 });
  }

  const defaultPrizeDescription = resolveContent(contentRow?.content).defaultPrizeDescription;
  const today = new Date();
  const isMonday = budapestWeekday(today) === 1;
  const isFirstOfMonth = budapestDateKey(today).endsWith("-01");

  const results: { partner: string; outcome: string; winnerId?: string }[] = [];

  // Sequential rather than Promise.all: each draw sends an email, and a burst
  // of parallel sends is the fastest way to trip Resend's rate limit and lose
  // winner notifications. A handful of partners takes a second or two.
  for (const partner of partners ?? []) {
    const frequency = partner.prize_frequency === "monthly" ? "monthly" : "weekly";
    const dueToday = frequency === "weekly" ? isMonday : isFirstOfMonth;
    if (!dueToday) continue;

    const periodKeyFn = frequency === "weekly" ? budapestWeekStartKey : budapestMonthStartKey;
    const periodKey = periodKeyFn(yesterday());
    const prizeText = resolvePrizeText(partner.prize_description, defaultPrizeDescription);

    try {
      const outcome = await drawWinnerForPartner(supabase, partner.id, periodKey, frequency, periodKeyFn, prizeText);
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

  console.log(`[cron/daily-draw] ${budapestDateKey(today)}:`, JSON.stringify(results));
  return NextResponse.json({ date: budapestDateKey(today), partners: results.length, results });
}
