import { MOCK_NOW } from "@/mocks";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const time = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatCurrency(value: number) {
  return currency.format(value);
}

export function formatShortDate(iso: string) {
  return shortDate.format(new Date(iso));
}

export function formatTime(iso: string) {
  return time.format(new Date(iso));
}

/** "Just now", "5m ago", "3h ago", "Yesterday", "4d ago", then a short date. */
export function formatRelative(iso: string, now = MOCK_NOW) {
  const diffMs = new Date(now).getTime() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatShortDate(iso);
}

/** "Today", "Yesterday", or a short date — used for grouping feeds by day. */
export function formatDayLabel(iso: string, now = MOCK_NOW) {
  const day = iso.slice(0, 10);
  const today = now.slice(0, 10);
  if (day === today) return "Today";
  const yesterday = new Date(new Date(now).getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (day === yesterday) return "Yesterday";
  return formatShortDate(iso);
}

export function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}
