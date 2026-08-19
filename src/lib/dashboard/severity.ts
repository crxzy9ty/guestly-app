// A fixed, absolute 1-10 severity scale for the Javaslat box's badge —
// deliberately NOT relative to a partner's own alert_threshold, so the same
// score always reads the same way regardless of how strict a given partner's
// threshold is set. The threshold still decides WHETHER the box appears at
// all (see dashboard/page.tsx); this only labels how bad/good the number is
// once it's already showing.
export function scoreTierLabel(avg: number): string {
  if (avg >= 9) return "Kiváló";
  if (avg >= 8) return "Nagyon jó";
  if (avg >= 7.5) return "Jó, de lehetne jobb";
  if (avg >= 6.5) return "Odafigyelést igényel";
  if (avg >= 5) return "Gyenge";
  return "Kritikus";
}
