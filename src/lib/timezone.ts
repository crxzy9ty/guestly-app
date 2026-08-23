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

// Shared by the week/month/weekday helpers below: goes through
// budapestDateKey first (DST-correct by construction, since it resolves the
// real Budapest offset for the given instant), then does all further
// arithmetic on a fake UTC-anchored Date used purely as a Y/M/D container —
// never on real elapsed milliseconds, which is what would make this
// DST-fragile.
function budapestParts(date: Date | string = new Date()) {
  const [y, m, d] = budapestDateKey(date).split("-").map(Number);
  return { y, m, d };
}

// The Monday (Budapest-local) of the ISO week containing `date`, as the same
// sortable YYYY-MM-DD key shape as budapestDateKey — used as the prize-draw
// period key for partners on a weekly draw.
export function budapestWeekStartKey(date: Date | string = new Date()): string {
  const { y, m, d } = budapestParts(date);
  const anchor = new Date(Date.UTC(y, m - 1, d));
  const isoWeekday = anchor.getUTCDay() === 0 ? 7 : anchor.getUTCDay(); // 1=Mon..7=Sun
  anchor.setUTCDate(anchor.getUTCDate() - (isoWeekday - 1));
  return anchor.toISOString().slice(0, 10);
}

// The 1st of the Budapest-local month containing `date` — the period key for
// partners on a monthly draw.
export function budapestMonthStartKey(date: Date | string = new Date()): string {
  const { y, m } = budapestParts(date);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

// 1=Monday..7=Sunday, Budapest-local. Used by the nightly cron to decide
// whether a partner's period just closed (weekly: today is Monday; monthly:
// today is the 1st, checked directly off budapestDateKey instead).
export function budapestWeekday(date: Date | string = new Date()): number {
  const { y, m, d } = budapestParts(date);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}
