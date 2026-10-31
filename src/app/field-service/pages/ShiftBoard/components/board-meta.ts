import type { StatusTone } from "@/components/shared";
import type { RouteCrewRole, RouteInstance, Technician } from "@/mocks";

/** Cell tint per shift tone: the badge palette, as a block. */
export const TONE_BLOCK: Record<StatusTone, string> = {
  info: "bg-info-bg text-info",
  neutral: "bg-muted text-foreground",
  warning: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  destructive: "bg-destructive-bg text-destructive",
};

export type RoleFilter = "all" | "driver" | "loader";

export const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "driver", label: "Drivers" },
  { id: "loader", label: "Helpers & trainees" },
];

/** Drivers can own a route; everyone else rides along as crew. */
export const isDriver = (pro: Technician) => pro.role !== "loader";

export type RouteSeat = {
  route: RouteInstance;
  role: RouteCrewRole | "primary";
};

/** Every route a pro sits on, keyed by `proId|date`. */
export function seatsByProDay(routes: RouteInstance[]) {
  const map = new Map<string, RouteSeat[]>();
  const push = (proId: string, seat: RouteSeat) => {
    const key = `${proId}|${seat.route.date}`;
    map.set(key, [...(map.get(key) ?? []), seat]);
  };
  for (const route of routes) {
    if (route.primaryServiceProId)
      push(route.primaryServiceProId, { route, role: "primary" });
    for (const member of route.crew)
      push(member.serviceProId, { route, role: member.role });
  }
  return map;
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/** "30 Aug": spelled out by hand; en-GB would say "Sept". */
const dayMonth = {
  format: (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
};
const dayMonthYear = {
  format: (d: Date) => `${dayMonth.format(d)} ${d.getUTCFullYear()}`,
};

/** "30 Aug – 5 Sep 2026", or "27 Dec 2026 – 2 Jan 2027" across a year. */
export function formatWeekRange(start: Date, end: Date) {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return `${(sameYear ? dayMonth : dayMonthYear).format(start)} – ${dayMonthYear.format(end)}`;
}

/** "Sun 30 Aug" for a `2026-08-30` day key: the dialog's heading. */
export function formatDayKey(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
  return `${weekday} ${dayMonth.format(date)}`;
}

export const firstName = (pro: Technician) => pro.name.split(" ")[0];

/** "Overtime" is a marker on the block; any other note shows as a hint. */
export const isOvertime = (note?: string) =>
  Boolean(note && /overtime/i.test(note));
