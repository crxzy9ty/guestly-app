// Presentation helpers for the owner/admin dashboards. The aggregation itself
// (averages, weekday/hour bucketing, Budapest-local time conversion) now lives
// in SQL — see supabase/migrations/..._aggregate_stats_views.sql. Doing it here
// meant fetching every score row first, which PostgREST silently truncates at
// max_rows = 1000; this file deliberately no longer knows how to bucket a
// timestamp, so there is only one implementation of that rule.

export const HOURS = [8, 10, 12, 14, 16, 18, 20] as const;
export const DAYS = ["Hét", "Ked", "Sze", "Csüt", "Pén", "Szo", "Vas"] as const;

export type HeatmapCell = { avg: number; count: number } | null;
export type HeatmapGrid = HeatmapCell[][]; // [dayIndex][hourIndex]

// One row of public.partner_heatmap_stats. day_index is 0-6 (Mon-Sun) and
// hour_bucket is already snapped to one of HOURS by the database.
export type HeatmapBucketRow = {
  aspect_key: string;
  day_index: number;
  hour_bucket: number;
  avg_score: number;
  score_count: number;
};

// Scatters pre-aggregated buckets into the fixed DAYS x HOURS matrix the
// Heatmap component renders. Rows outside the grid (a day_index or hour_bucket
// the view somehow produced that this build doesn't display) are skipped rather
// than crashing on an out-of-range index.
export function gridFromBuckets(rows: HeatmapBucketRow[]): HeatmapGrid {
  const grid: HeatmapGrid = DAYS.map(() => HOURS.map(() => null));

  for (const row of rows) {
    const hourIndex = HOURS.indexOf(row.hour_bucket as (typeof HOURS)[number]);
    if (hourIndex === -1) continue;
    if (row.day_index < 0 || row.day_index >= DAYS.length) continue;
    grid[row.day_index][hourIndex] = { avg: row.avg_score, count: Number(row.score_count) };
  }

  return grid;
}

// Groups bucket rows by aspect and builds one grid per aspect key, so the
// dashboard can hand the selected aspect's grid straight to <Heatmap>.
export function gridsByAspect(aspectKeys: string[], rows: HeatmapBucketRow[]): Record<string, HeatmapGrid> {
  return Object.fromEntries(
    aspectKeys.map((key) => [key, gridFromBuckets(rows.filter((r) => r.aspect_key === key))]),
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

export function weakestBucket(grid: HeatmapGrid): { day: string; hour: number; avg: number } | null {
  let best: { day: string; hour: number; avg: number } | null = null;
  grid.forEach((row, di) => {
    row.forEach((cell, hi) => {
      if (cell && cell.count >= MIN_SAMPLE_SIZE && (!best || cell.avg < best.avg)) {
        best = { day: DAYS[di], hour: HOURS[hi], avg: cell.avg };
      }
    });
  });
  return best;
}
