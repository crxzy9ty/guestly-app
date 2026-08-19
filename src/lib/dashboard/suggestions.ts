// Rule-based "what to do about it" text for the weak-spot alert — deliberately
// NOT an AI call. A small fixed set of pre-written, generic action templates,
// picked deterministically per (aspect, day, hour) so the exact same weak
// cell always shows the exact same suggestion across reloads, while
// different weak cells (a different aspect, or the same aspect on a
// different day/hour) don't all show the same one.
//
// Templates are generic on purpose rather than keyed by aspect content:
// question sets are admin-defined (Beállítások → Kérdéscsoportok) with
// arbitrary aspect keys and labels, so there is no fixed list of "real"
// aspects (tisztaság, kiszolgálás, ...) this could safely hardcode advice
// for — a custom aspect an admin invents tomorrow has to get a sensible
// suggestion too.

const TEMPLATES: ((ctx: { aspect: string; day: string; hour: number }) => string)[] = [
  ({ aspect, day, hour }) =>
    `Érdemes ${day} ${hour}h körül külön figyelmet fordítani a(z) "${aspect}" szempontra — egy rövid emlékeztető a műszak elején sokat segíthet.`,
  ({ aspect, day, hour }) =>
    `Ha rendszeresen visszatér a gyengébb eredmény ${day} ${hour}h körül, érdemes ezen az időszakon több figyelmet vagy kapacitást biztosítani a(z) "${aspect}" területén.`,
  ({ aspect, day, hour }) =>
    `${day} ${hour}h körül egy rövid, célzott átnézés segíthet időben észrevenni, ha a(z) "${aspect}" szempont csúszni kezd.`,
];

// A simple deterministic string hash (no crypto needed — this only has to be
// stable, not secure). Same algorithm shape as Java's String.hashCode.
function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function actionSuggestion(aspectKey: string, aspectLabel: string, day: string, hour: number): string {
  const idx = hashKey(`${aspectKey}|${day}|${hour}`) % TEMPLATES.length;
  return TEMPLATES[idx]({ aspect: aspectLabel, day, hour });
}
