import { budapestDateKey } from "./timezone";

// Subscription status is DERIVED from the two dates on partners, never stored.
// See supabase/migrations/..._partner_subscription_period.sql for why.

export type SubscriptionState =
  | "none" // no dates recorded — a prospect, or billing not agreed yet
  | "scheduled" // paid period starts in the future
  | "active"
  | "expiring" // active, but the end date is close
  | "expired";

export type SubscriptionStatus = {
  state: SubscriptionState;
  label: string;
  /** Days until the end date. Negative once past, null when there is no end date. */
  daysLeft: number | null;
  /** Background/foreground pair for the pill in the partners table. */
  color: { bg: string; fg: string };
};

// Below this many days remaining, an active subscription is worth flagging so
// there is time to have the renewal conversation before it lapses.
const EXPIRING_SOON_DAYS = 30;
// And below this, it's urgent rather than a heads-up.
const EXPIRING_URGENT_DAYS = 7;

// Comparing YYYY-MM-DD strings: `date` columns come back in exactly that form,
// and budapestDateKey() produces it too, so lexicographic order IS chronological
// order. This avoids constructing Date objects, which would reintroduce the
// UTC-vs-local drift the `date` column type was chosen to avoid.
function daysBetween(fromKey: string, toKey: string): number {
  const ms = Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function getSubscriptionStatus(
  start: string | null,
  end: string | null,
  today = budapestDateKey(),
): SubscriptionStatus {
  if (!start && !end) {
    return {
      state: "none",
      label: "Nincs előfizetés",
      daysLeft: null,
      color: { bg: "var(--color-line)", fg: "var(--color-slate)" },
    };
  }

  if (start && today < start) {
    return {
      state: "scheduled",
      label: `Indul ${start}`,
      daysLeft: end ? daysBetween(today, end) : null,
      color: { bg: "#E8EEFB", fg: "#2A4B8D" },
    };
  }

  if (end && today > end) {
    return {
      state: "expired",
      label: `Lejárt ${end}`,
      daysLeft: daysBetween(today, end),
      color: { bg: "#FBE4F5", fg: "#8E1070" },
    };
  }

  // No end date but started: an open-ended subscription, nothing to count down.
  if (!end) {
    return {
      state: "active",
      label: "Aktív",
      daysLeft: null,
      color: { bg: "#E8F5EE", fg: "#0F6E48" },
    };
  }

  const daysLeft = daysBetween(today, end);

  if (daysLeft <= EXPIRING_URGENT_DAYS) {
    return {
      state: "expiring",
      label: daysLeft === 0 ? "Ma jár le" : `${daysLeft} nap`,
      daysLeft,
      color: { bg: "#FBE0DC", fg: "#A32C15" },
    };
  }

  if (daysLeft <= EXPIRING_SOON_DAYS) {
    return {
      state: "expiring",
      label: `${daysLeft} nap`,
      daysLeft,
      color: { bg: "#FDF0DA", fg: "#8A5A00" },
    };
  }

  return {
    state: "active",
    label: `${daysLeft} nap`,
    daysLeft,
    color: { bg: "#E8F5EE", fg: "#0F6E48" },
  };
}

// Sort helper: expired first, then soonest-to-expire, then open-ended/none.
// Used where the admin wants the attention-needing partners at the top.
export function subscriptionSortKey(status: SubscriptionStatus): number {
  if (status.state === "none") return Number.MAX_SAFE_INTEGER;
  if (status.daysLeft === null) return Number.MAX_SAFE_INTEGER - 1;
  return status.daysLeft;
}
