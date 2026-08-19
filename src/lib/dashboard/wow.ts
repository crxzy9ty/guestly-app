// Week-over-week change per aspect — always the last 7 days vs. the 7 days
// before that, independent of whatever window the period picker is set to.
// The aggregation happens in SQL (partner_aspect_stats_wow); this only joins
// the result into a lookup keyed by aspect and applies the same
// not-enough-data floor the heatmap's weakestBucket() uses, so a single
// review from last week can't produce a confident-looking "+3.0".

const MIN_SAMPLE_SIZE = 3;

export type AspectWowRow = {
  aspect_key: string;
  current_avg: number | null;
  previous_avg: number | null;
  current_count: number;
  previous_count: number;
};

export function wowDeltas(rows: AspectWowRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (
      r.current_avg !== null &&
      r.previous_avg !== null &&
      Number(r.current_count) >= MIN_SAMPLE_SIZE &&
      Number(r.previous_count) >= MIN_SAMPLE_SIZE
    ) {
      out[r.aspect_key] = r.current_avg - r.previous_avg;
    }
  }
  return out;
}
