import { MOCK_NOW } from "@/mocks";

const time = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dubai",
});

/** "12:30" in the service region's clock. */
export function formatTime(iso: string) {
  return time.format(new Date(iso));
}

/** "45m", "1h", "1h 30m". */
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Minutes from the fixed mock "now" — negative once the slot has passed. */
export function minutesFromNow(iso: string, now = MOCK_NOW) {
  return Math.round(
    (new Date(iso).getTime() - new Date(now).getTime()) / 60_000,
  );
}

/** "in 45m", "in 2h", "20m ago", "now". */
export function formatEta(iso: string, now = MOCK_NOW) {
  const mins = minutesFromNow(iso, now);
  if (Math.abs(mins) < 5) return "now";
  const abs = Math.abs(mins);
  const label = abs < 60 ? `${abs}m` : formatDuration(abs);
  return mins > 0 ? `in ${label}` : `${label} ago`;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

/** ISO calendar day (`2026-09-04`) — the key the dispatch board is scoped by. */
export function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseDayKey(key: string) {
  return new Date(`${key}T00:00:00Z`);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Sunday-first, matching the week strip in the top bar. */
export function startOfWeek(date: Date) {
  return addDays(date, -date.getUTCDay());
}

const weekday = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});
const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const longDate = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "SUN", "MON" … */
export function formatWeekday(date: Date) {
  return weekday.format(date).toUpperCase();
}

/** "Sep 2026" */
export function formatMonthYear(date: Date) {
  return monthYear.format(date);
}

/** "Friday, September 18, 2026" — the accessible label for a day button. */
export function formatLongDate(date: Date) {
  return longDate.format(date);
}

export function isSameDay(a: Date, b: Date) {
  return toDayKey(a) === toDayKey(b);
}

export function startOfMonth(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0),
  );
}

export function addMonths(date: Date, months: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 0, 0, 0),
  );
}

export function isSameMonth(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth()
  );
}

/**
 * "Today" for the prototype is the fixed mock clock, not the wall clock — the
 * fixtures are all dated to it, and a constant keeps the server and client
 * renders identical.
 */
export const TODAY = new Date(`${MOCK_NOW.slice(0, 10)}T00:00:00Z`);

const monthLong = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "September 2026" — the calendar popover's heading. */
export function formatMonthLong(date: Date) {
  return monthLong.format(date);
}

/** Sun–Sat initials for the calendar's column headers. */
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The 6×7 grid a month is drawn on, including leading and trailing days. */
export function monthGrid(month: Date) {
  const first = startOfWeek(startOfMonth(month));
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

const hourMinute = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Dubai",
});

/**
 * Minutes since midnight in the service region's clock — what the timeline
 * positions appointment blocks by.
 */
export function minutesOfDay(iso: string) {
  const [hours, minutes] = hourMinute.format(new Date(iso)).split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** "5 AM", "12 PM", "5 PM" — the timeline's hour ruler. */
export function formatHour(hour: number) {
  const h = hour % 24;
  const suffix = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${suffix}`;
}
