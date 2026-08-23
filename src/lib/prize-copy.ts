// Shared prize-draw wording, used both server-side (src/lib/draw-core.ts,
// src/app/ertekeles/[partnerId]/page.tsx) and client-side
// (GuestReviewFlow.tsx) — deliberately NOT "server-only", unlike
// draw-core.ts, since a client component needs it too.
//
// Hungarian case-inflects "hét" (week) and "hónap" (month) differently, and
// "hét" is irregular (inessive is "héten", not the expected "hétben") — so
// every phrase that needs one of these words is fully pre-composed here,
// rather than handing callers a bare noun to stick a suffix on themselves.

export type PrizeFrequency = "weekly" | "monthly";

type PrizePhrases = {
  adjective: string; // "heti" / "havi" — a bare adjective never needs inflection, safe to reuse anywhere
  everyPeriod: string; // "minden héten" / "minden hónapban"
  periodClose: string; // "a hét zárása" / "a hónap zárása" — possessive, so the noun itself stays uninflected
  allEntrants: string; // "A hét összes értékelője" / "A hónap összes értékelője"
};

const PHRASES: Record<PrizeFrequency, PrizePhrases> = {
  weekly: {
    adjective: "heti",
    everyPeriod: "minden héten",
    periodClose: "a hét zárása",
    allEntrants: "A hét összes értékelője",
  },
  monthly: {
    adjective: "havi",
    everyPeriod: "minden hónapban",
    periodClose: "a hónap zárása",
    allEntrants: "A hónap összes értékelője",
  },
};

export function frequencyWords(frequency: PrizeFrequency): PrizePhrases {
  return PHRASES[frequency];
}

// A partner's own prize_description (null/empty = they didn't set one) falls
// back to content_settings' defaultPrizeDescription — the one place this
// resolution happens, so the draw email, the guest flow, and the dedup-cookie
// "just submitted" page can't drift into disagreeing about what a partner's
// prize actually is.
export function resolvePrizeText(
  partnerPrizeDescription: string | null | undefined,
  defaultPrizeDescription: string,
): string {
  return partnerPrizeDescription?.trim() || defaultPrizeDescription;
}

// The guest-facing "you're entered" confirmation — identical wording needed
// in GuestReviewFlow.tsx's own screen and in ertekeles/[partnerId]/page.tsx's
// dedup-cookie branch (a server-rendered re-display of the same moment after
// a page refresh), which previously had two copies of this text that could
// only ever be kept in sync by hand.
export function prizeConfirmedBody(frequency: PrizeFrequency): string {
  const { allEntrants, periodClose } = frequencyWords(frequency);
  return `${allEntrants} között ${periodClose} után sorsolunk. Ha nyersz, e-mailben kapsz egy egyedi kupon-kódot.`;
}
