import { formatBudapestTimestamp } from "./timezone";

// "3 napja" reads faster than a timestamp when the question is "is this partner
// still engaged?" — you want the gap, not the date. The exact timestamp stays
// available as a tooltip, because once something looks wrong the precise moment
// is what you need.

export type Staleness = "fresh" | "aging" | "stale" | "never";

export function relativeDays(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const diff = now - new Date(iso).getTime();
  return Math.floor(diff / 86_400_000);
}

export function formatRelative(iso: string | null, now = Date.now()): string {
  const days = relativeDays(iso, now);
  if (days === null) return "még soha";
  if (days <= 0) return "ma";
  if (days === 1) return "tegnap";
  if (days < 30) return `${days} napja`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 hónapja" : `${months} hónapja`;
}

/**
 * Thresholds are per-signal because the two mean different things.
 *
 * A partner not opening their dashboard for a week is normal — the product
 * gives a weekly-rhythm view, not something to check hourly. Three weeks of
 * silence is a churn warning.
 *
 * No reviews for three days is already odd for an active venue: it usually
 * means the QR card came off the table, got covered, or was never put out.
 */
export function staleness(iso: string | null, kind: "login" | "review", now = Date.now()): Staleness {
  const days = relativeDays(iso, now);
  if (days === null) return "never";
  const limits = kind === "login" ? { aging: 7, stale: 21 } : { aging: 3, stale: 10 };
  if (days >= limits.stale) return "stale";
  if (days >= limits.aging) return "aging";
  return "fresh";
}

export function stalenessColor(s: Staleness): { bg: string; fg: string } {
  switch (s) {
    case "stale":
      return { bg: "#FBE0DC", fg: "#A32C15" };
    case "aging":
      return { bg: "#FDF0DA", fg: "#8A5A00" };
    case "never":
      return { bg: "var(--color-line)", fg: "var(--color-slate)" };
    default:
      return { bg: "#E8F5EE", fg: "#0F6E48" };
  }
}

export function exactTooltip(iso: string | null): string {
  return iso ? formatBudapestTimestamp(iso) : "Nincs adat";
}
