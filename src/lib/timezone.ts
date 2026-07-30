// The single definition of the app's operating timezone. Everything that
// buckets or formats a timestamp must agree on it: the heatmap grid, the Napló
// timestamps and the daily prize draw all derive "which day/hour is this" from
// here, and any disagreement shows up as reviews landing in the wrong cell or
// a draw covering the wrong day.
//
// Note that SQL has its own copy of this string, in the aggregate functions
// added by supabase/migrations/..._partner_stats_date_range.sql. That one is
// unavoidable — Postgres cannot import a TypeScript constant — so if this ever
// changes, those functions must change with it.
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

const timestampFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// The Napló tables previously formatted timestamps with Date.getHours() etc,
// i.e. the VIEWER's browser timezone — which silently disagreed with the
// heatmap (built from the same created_at values, bucketed in Budapest time)
// for anyone not on CET/CEST. This is the one formatter both should use.
export function formatBudapestTimestamp(iso: string): string {
  const parts = timestampFormatter.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}.${get("month")}.${get("day")}. ${hour}:${get("minute")}`;
}
