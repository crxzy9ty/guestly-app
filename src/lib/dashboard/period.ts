// The date windows the per-venue Áttekintés can be narrowed to.
//
// Before these existed the panel aggregated all history, which reproduced the
// exact cumulative-average flaw the landing page holds against Google Review:
// a problem fixed months ago still weighed on the numbers, and a recent
// decline stayed invisible under years of good scores.

export const PERIODS = [
  { value: "7", label: "Elmúlt 7 nap", days: 7 },
  { value: "30", label: "Elmúlt 30 nap", days: 30 },
  { value: "90", label: "Elmúlt 90 nap", days: 90 },
  { value: "365", label: "Elmúlt 1 év", days: 365 },
  { value: "all", label: "Összes", days: null },
] as const;

export type PeriodValue = (typeof PERIODS)[number]["value"];

// 30 days: long enough that a normal venue has a usable sample in every
// weekday/hour cell, short enough that the heatmap still describes how things
// are RIGHT NOW rather than how they have been on average forever.
export const DEFAULT_PERIOD: PeriodValue = "30";

// Anything unrecognised (hand-edited URL, stale bookmark) falls back to the
// default rather than erroring — this only selects a window, and a wrong one
// is not worth a broken page.
export function parsePeriod(raw: string | undefined): PeriodValue {
  const match = PERIODS.find((p) => p.value === raw);
  return match ? match.value : DEFAULT_PERIOD;
}

/** Days to pass to the *_range SQL functions. null = all time. */
export function periodDays(value: PeriodValue): number | null {
  return PERIODS.find((p) => p.value === value)?.days ?? null;
}

export function periodLabel(value: PeriodValue): string {
  return PERIODS.find((p) => p.value === value)?.label ?? "";
}
