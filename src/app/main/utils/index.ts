import { MOCK_NOW } from "@/mocks";

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currency.format(value);
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

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
  return shortDate.format(new Date(iso));
}
