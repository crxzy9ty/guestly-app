// Shared by src/app/dashboard/page.tsx (server-side aggregation) and
// src/app/dashboard/Heatmap.tsx (rendering). Bucketing is done in a fixed
// timezone (not the host machine's local time) so "péntek este" means the
// same thing regardless of where the app happens to be deployed.

export const TIMEZONE = "Europe/Budapest";
export const HOURS = [8, 10, 12, 14, 16, 18, 20] as const;
export const DAYS = ["Hét", "Ked", "Sze", "Csüt", "Pén", "Szo", "Vas"] as const;

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  hour: "numeric",
  hour12: false,
  weekday: "short",
});

export function localDayHour(isoTimestamp: string): { dayIndex: number; hour: number } {
  const parts = partsFormatter.formatToParts(new Date(isoTimestamp));
  let hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  if (hour === 24) hour = 0;
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  return { dayIndex: WEEKDAY_INDEX[weekday] ?? 0, hour };
}

// Snaps an actual hour (0-23) to the nearest entry in HOURS, so a 19:xx
// submission lands in the same bucket as the 18:00 column.
export function nearestHourBucket(hour: number): number {
  let best: (typeof HOURS)[number] = HOURS[0];
  let bestDiff = Infinity;
  for (const h of HOURS) {
    const diff = Math.min(Math.abs(hour - h), 24 - Math.abs(hour - h));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = h;
    }
  }
  return best;
}

export type HeatmapCell = { avg: number; count: number } | null;
export type HeatmapGrid = HeatmapCell[][]; // [dayIndex][hourIndex]

export function buildHeatmapGrid(
  points: { createdAt: string; score: number }[],
): HeatmapGrid {
  const sums: number[][] = DAYS.map(() => HOURS.map(() => 0));
  const counts: number[][] = DAYS.map(() => HOURS.map(() => 0));

  for (const point of points) {
    const { dayIndex, hour } = localDayHour(point.createdAt);
    const bucketedHour = nearestHourBucket(hour);
    const hourIndex = HOURS.indexOf(bucketedHour as (typeof HOURS)[number]);
    sums[dayIndex][hourIndex] += point.score;
    counts[dayIndex][hourIndex] += 1;
  }

  return DAYS.map((_, di) =>
    HOURS.map((_, hi) => (counts[di][hi] > 0 ? { avg: sums[di][hi] / counts[di][hi], count: counts[di][hi] } : null)),
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

export function computeAspectAverages(
  aspects: { key: string; label: string; icon: string | null }[],
  scores: { aspect_key: string; score: number }[],
): AspectAverage[] {
  return aspects.map((a) => {
    const vals = scores.filter((s) => s.aspect_key === a.key).map((s) => s.score);
    return {
      key: a.key,
      label: a.label,
      icon: a.icon,
      avg: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null,
      count: vals.length,
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
