const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/** "Just now", "5m ago", "3h ago", "Yesterday", "4d ago", then a short date. */
export function relativeTime(iso: string, nowMs = Date.now()): string {
  const diffMs = nowMs - new Date(iso).getTime();
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
