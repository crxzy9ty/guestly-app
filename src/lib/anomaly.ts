// Flags venues whose review volume has jumped well past their own normal.
//
// Nothing else in the app watches VOLUME. The alert_threshold feature reacts to
// low scores, which is a different question entirely — a venue could receive
// five hundred fabricated reviews in an afternoon and no screen would say
// anything. Ballot stuffing is possible (see the note on the token defence in
// reference/audit-2026-07-30.md: it raises the cost of scripted submission, it
// does not prevent it), so the least we can do is notice.
//
// Deliberately compares a venue to ITSELF rather than to a fixed number: a
// hundred reviews a day is unremarkable for a busy restaurant and very odd for
// a small café, and any single global threshold would be wrong for one of them.
//
// This is a heuristic and it is presented as one. A genuinely busy Friday can
// trip it. It exists to make someone look, never to block a submission.

/** Minimum reviews in the last 24h before a spike is worth mentioning at all.
 *  Below this, ordinary day-to-day variation on small numbers — two reviews
 *  yesterday, seven today — would fire constantly and train you to ignore it. */
const MIN_ABSOLUTE = 20;

/** How many times the baseline counts as a spike. */
const SPIKE_FACTOR = 3;

/** Lifetime reviews needed before a venue has a baseline worth comparing to.
 *  Without this, a partner's first busy day always looks like an anomaly —
 *  the worst possible moment for a false alarm, since that is exactly when
 *  you want to be celebrating with them. */
const MIN_HISTORY = 30;

export type VolumeAnomaly = {
  reviews24h: number;
  /** Mean daily reviews over the preceding six days. */
  baseline: number;
  /** How many times the baseline the last 24h represents. Infinity if the
   *  venue had no reviews at all in the preceding six days. */
  ratio: number;
};

/**
 * Returns anomaly detail when the last 24h stands out, otherwise null.
 *
 * Derived from the counters partner_summary_stats already exposes, so this
 * needs no extra query and no migration: reviews_7d covers the last seven days
 * INCLUDING the last 24h, so subtracting gives the six days before it.
 */
export function detectVolumeAnomaly(stats: {
  review_count: number;
  reviews_24h: number;
  reviews_7d: number;
}): VolumeAnomaly | null {
  const reviews24h = Number(stats.reviews_24h ?? 0);
  const reviews7d = Number(stats.reviews_7d ?? 0);
  const lifetime = Number(stats.review_count ?? 0);

  if (lifetime < MIN_HISTORY) return null;
  if (reviews24h < MIN_ABSOLUTE) return null;

  // max(0, …) because the two counters are read in the same query but describe
  // overlapping windows; a submission landing between them could otherwise
  // produce a small negative and a nonsensical baseline.
  const baseline = Math.max(0, reviews7d - reviews24h) / 6;
  const ratio = baseline === 0 ? Infinity : reviews24h / baseline;

  if (ratio < SPIKE_FACTOR) return null;

  return { reviews24h, baseline, ratio };
}

export function describeAnomaly(a: VolumeAnomaly): string {
  if (!Number.isFinite(a.ratio)) {
    return `${a.reviews24h} értékelés az elmúlt 24 órában, miközben az azt megelőző hat napban egy sem érkezett.`;
  }
  return `${a.reviews24h} értékelés az elmúlt 24 órában — a szokásos napi ${a.baseline.toFixed(1)} helyett (${a.ratio.toFixed(1)}×).`;
}
