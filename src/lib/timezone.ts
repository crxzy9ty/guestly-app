// Shared with src/lib/dashboard/heatmap.ts (TIMEZONE constant there is
// duplicated intentionally — that file predates this one and changing its
// import would be an unrelated diff; both must stay "Europe/Budapest").
export const TIMEZONE = "Europe/Budapest";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "en-CA" formats as YYYY-MM-DD, which doubles as a sortable/comparable
// calendar-day key — used instead of `now - 24h` so a Monday 23:50 entrant
// and a Tuesday 00:10 entrant are unambiguously in different daily draws,
// and so "today" means the same thing regardless of server TZ.
export function budapestDateKey(date: Date | string = new Date()): string {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}
