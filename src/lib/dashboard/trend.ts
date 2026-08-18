// Time-series helpers for the Trend view (VenueInsights) and the admin
// portfolio heartbeat chart. Presentation-only — the aggregation and the
// day/week/month bucketing choice both happen in SQL (see
// supabase/migrations/..._trend_charts.sql), matching how heatmap.ts already
// only formats pre-aggregated rows rather than computing averages itself.

import { budapestDateKey } from "../timezone";

const HU_MONTHS = ["jan", "febr", "márc", "ápr", "máj", "jún", "júl", "aug", "szept", "okt", "nov", "dec"];

// Parses a Postgres `date` string ("YYYY-MM-DD") into a Date built from its
// numeric parts alone. This is already a Budapest-local calendar date
// computed server-side — reinterpreting it through any timezone conversion
// here would be meaningless (and could shift it a day in either direction).
function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export type TrendGranularity = "day" | "week" | "month";

export function formatBucketLabel(dateStr: string, granularity: TrendGranularity): string {
  const d = parseDateOnly(dateStr);
  const month = HU_MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();

  if (granularity === "month") return `${d.getUTCFullYear()} ${month}`;

  if (granularity === "week") {
    // date_trunc('week', …) returns the Monday of that ISO week; label the
    // full span so "the week of Aug 10" reads as the range it covers.
    const end = new Date(d);
    end.setUTCDate(end.getUTCDate() + 6);
    const endMonth = HU_MONTHS[end.getUTCMonth()];
    return endMonth === month ? `${month} ${day}–${end.getUTCDate()}.` : `${month} ${day}. – ${endMonth} ${end.getUTCDate()}.`;
  }

  return `${month} ${day}.`;
}

export type TrendBucketRow = {
  bucket_date: string;
  granularity: TrendGranularity;
  aspect_key: string;
  avg_score: number;
  score_count: number;
};

export type TrendPoint = { date: string; label: string; avg: number; count: number };

// Groups partner_aspect_trend_range()'s flat row list into one ordered series
// per aspect. Rows arrive pre-sorted by bucket_date from the SQL query, so no
// re-sort is needed here.
export function trendSeriesByAspect(aspectKeys: string[], rows: TrendBucketRow[]): Record<string, TrendPoint[]> {
  return Object.fromEntries(
    aspectKeys.map((key) => [
      key,
      rows
        .filter((r) => r.aspect_key === key)
        .map((r) => ({
          date: r.bucket_date,
          label: formatBucketLabel(r.bucket_date, r.granularity),
          avg: r.avg_score,
          count: Number(r.score_count),
        })),
    ]),
  );
}

export type PortfolioDayPoint = { date: string; label: string; count: number };

// portfolio_daily_review_counts() only returns rows for days that actually
// had a submission — a day with zero reviews is simply absent, not a zero
// row. For a heartbeat chart that gap is the important signal (e.g. every QR
// code silently breaking after a deploy), so it has to render as a visible
// zero rather than vanish as if no data point existed for that day at all.
export function fillDailyGaps(rows: { bucket_date: string; review_count: number }[], days: number): PortfolioDayPoint[] {
  const byDate = new Map(rows.map((r) => [r.bucket_date, Number(r.review_count)]));
  const today = parseDateOnly(budapestDateKey());

  const points: PortfolioDayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    points.push({ date: key, label: formatBucketLabel(key, "day"), count: byDate.get(key) ?? 0 });
  }
  return points;
}
