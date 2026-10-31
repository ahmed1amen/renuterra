import { StatusPill, type StatusTone } from "@/components/shared";
import type {
  RouteInstanceStatus,
  RouteStatus,
  SchedulePattern,
  StaffingSource,
  TimeWindow,
} from "@/mocks";

export const ROUTE_STATUS: Record<
  RouteStatus,
  { label: string; tone: StatusTone }
> = {
  draft: { label: "Draft", tone: "neutral" },
  active: { label: "Active", tone: "success" },
  suspended: { label: "Suspended", tone: "warning" },
  retired: { label: "Retired", tone: "neutral" },
};

export function RouteStatusPill({ status }: { status: RouteStatus }) {
  const s = ROUTE_STATUS[status];
  return (
    <StatusPill tone={s.tone} dot>
      {s.label}
    </StatusPill>
  );
}

export const INSTANCE_STATUS: Record<
  RouteInstanceStatus,
  { label: string; tone: StatusTone }
> = {
  planned: { label: "Planned", tone: "neutral" },
  unstaffed: { label: "Unstaffed", tone: "destructive" },
  confirmed: { label: "Confirmed", tone: "info" },
  "in-progress": { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  partial: { label: "Partially completed", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function InstanceStatusPill({
  status,
}: {
  status: RouteInstanceStatus;
}) {
  const s = INSTANCE_STATUS[status];
  return (
    <StatusPill tone={s.tone} dot>
      {s.label}
    </StatusPill>
  );
}

export const STAFFING_SOURCE: Record<StaffingSource, string> = {
  primary: "Primary",
  backup: "Backup",
  pool: "Pool",
  manual: "Manual",
};

export const SCHEDULE_PATTERN: Record<SchedulePattern, string> = {
  daily: "Daily",
  weekdays: "Mon–Sat",
  weekly: "Weekly",
  alternate: "Alternate days",
  custom: "Custom days",
};

/** "Before 08:00", "After 22:00", "07:00–09:00", "Any time". */
export function formatTimeWindow(w: TimeWindow) {
  if (w.kind === "before") return `Before ${w.to}`;
  if (w.kind === "after") return `After ${w.from}`;
  if (w.kind === "range") return `${w.from}–${w.to}`;
  return "Any time";
}
