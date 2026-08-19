// Presentation helpers for the owner/admin dashboards. The aggregation itself
// (averages, weekday/hour bucketing, Budapest-local time conversion) now lives
// in SQL — see supabase/migrations/..._aggregate_stats_views.sql. Doing it here
// meant fetching every score row first, which PostgREST silently truncates at
// max_rows = 1000; this file deliberately no longer knows how to bucket a
// timestamp, so there is only one implementation of that rule.

export const DAYS = ["Hét", "Ked", "Sze", "Csüt", "Pén", "Szo", "Vas"] as const;

// A partner with no opening hours set renders exactly this — matches the
// fixed range every partner had before opening hours existed.
export const DEFAULT_OPEN_HOUR = 8;
export const DEFAULT_CLOSE_HOUR = 20;

// Which hour columns to render for a partner, given their own opening hours
// (or the defaults above if unset). This has to generate the EXACT same list
// public.partner_hour_bucket() buckets reviews into
// (supabase/migrations/20260819120000_partner_opening_hours.sql) — 2-hour
// steps from open_hour up to and including close_hour, wrapping past
// midnight when close_hour <= open_hour (the overnight case, e.g. 18 -> 2).
// This function only decides which columns exist; it does no timestamp math,
// so it stays fine to run client-side unlike the actual per-review bucketing.
export function hourBucketsFor(openHour: number | null, closeHour: number | null): number[] {
  const open = openHour ?? DEFAULT_OPEN_HOUR;
  const close = closeHour ?? DEFAULT_CLOSE_HOUR;
  const span = close > open ? close - open : 24 - open + close;
  const steps = Math.floor(span / 2);
  return Array.from({ length: steps + 1 }, (_, i) => (open + i * 2) % 24);
}

export type HeatmapCell = { avg: number; count: number } | null;
export type HeatmapGrid = HeatmapCell[][]; // [dayIndex][hourIndex]

// One row of public.partner_heatmap_stats_range. day_index is 0-6 (Mon-Sun)
// and hour_bucket is already snapped to one of this partner's own hours
// (hourBucketsFor) by the database.
export type HeatmapBucketRow = {
  aspect_key: string;
  day_index: number;
  hour_bucket: number;
  avg_score: number;
  score_count: number;
};

// Scatters pre-aggregated buckets into a DAYS x hours matrix the Heatmap
// component renders. Rows outside the grid (a day_index or hour_bucket the
// database somehow produced that isn't in `hours`) are skipped rather than
// crashing on an out-of-range index.
export function gridFromBuckets(rows: HeatmapBucketRow[], hours: number[]): HeatmapGrid {
  const grid: HeatmapGrid = DAYS.map(() => hours.map(() => null));

  for (const row of rows) {
    const hourIndex = hours.indexOf(row.hour_bucket);
    if (hourIndex === -1) continue;
    if (row.day_index < 0 || row.day_index >= DAYS.length) continue;
    grid[row.day_index][hourIndex] = { avg: row.avg_score, count: Number(row.score_count) };
  }

  return grid;
}

// Groups bucket rows by aspect and builds one grid per aspect key, so the
// dashboard can hand the selected aspect's grid straight to <Heatmap>.
export function gridsByAspect(
  aspectKeys: string[],
  rows: HeatmapBucketRow[],
  hours: number[],
): Record<string, HeatmapGrid> {
  return Object.fromEntries(
    aspectKeys.map((key) => [key, gridFromBuckets(rows.filter((r) => r.aspect_key === key), hours)]),
  );
}

export function heatColor(avg: number): string {
  const t = (avg - 1) / 9;
  const from = [230, 25, 200]; // needs attention
  const mid = [246, 245, 250]; // neutral
  const good = [110, 201, 141];
  const great = [15, 110, 72];
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const k = t / 0.5;
    r = from[0] + (mid[0] - from[0]) * k;
    g = from[1] + (mid[1] - from[1]) * k;
    b = from[2] + (mid[2] - from[2]) * k;
  } else if (t < 0.78) {
    const k = (t - 0.5) / 0.28;
    r = mid[0] + (good[0] - mid[0]) * k;
    g = mid[1] + (good[1] - mid[1]) * k;
    b = mid[2] + (good[2] - mid[2]) * k;
  } else {
    const k = (t - 0.78) / 0.22;
    r = good[0] + (great[0] - good[0]) * k;
    g = good[1] + (great[1] - good[1]) * k;
    b = good[2] + (great[2] - good[2]) * k;
  }
  return `rgb(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`;
}

export type AspectAverage = {
  key: string;
  label: string;
  icon: string | null;
  avg: number | null;
  count: number;
};

// Joins the question set's aspect definitions (which give order, label and
// icon) to the per-aspect averages from public.partner_aspect_stats. Aspects
// with no reviews yet stay in the list with avg = null, so the dashboard shows
// them as "—" instead of dropping the tile.
export function joinAspectAverages(
  aspects: { key: string; label: string; icon: string | null }[],
  stats: { aspect_key: string; avg_score: number; score_count: number }[],
): AspectAverage[] {
  const byKey = new Map(stats.map((s) => [s.aspect_key, s]));
  return aspects.map((a) => {
    const stat = byKey.get(a.key);
    return {
      key: a.key,
      label: a.label,
      icon: a.icon,
      avg: stat ? stat.avg_score : null,
      count: stat ? Number(stat.score_count) : 0,
    };
  });
}

// Finds the single weakest (day, hour) bucket for one aspect's grid, used to
// phrase the alert card with a real, data-backed claim instead of a
// hardcoded "péntek 18-20h" guess.
// Requires at least MIN_SAMPLE_SIZE reviews in a bucket before it's eligible
// to be cited as "the" weak spot — otherwise a single 2/10 review in an
// otherwise-empty cell reads as a confident, data-backed pattern ("gyengébb
// Ked 14h körül") when it's really one data point.
const MIN_SAMPLE_SIZE = 3;

export function weakestBucket(grid: HeatmapGrid, hours: number[]): { day: string; hour: number; avg: number } | null {
  let best: { day: string; hour: number; avg: number } | null = null;
  grid.forEach((row, di) => {
    row.forEach((cell, hi) => {
      if (cell && cell.count >= MIN_SAMPLE_SIZE && (!best || cell.avg < best.avg)) {
        best = { day: DAYS[di], hour: hours[hi], avg: cell.avg };
      }
    });
  });
  return best;
}
