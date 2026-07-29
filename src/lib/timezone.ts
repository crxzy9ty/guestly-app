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
