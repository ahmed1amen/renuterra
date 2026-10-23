import {
  Ban,
  CalendarCheck,
  CircleCheck,
  Clock,
  type LucideIcon,
  Navigation,
  OctagonAlert,
  Truck,
} from "lucide-react";
import { StatusPill, type StatusTone } from "@/components/shared";
import type {
  AppointmentServiceType,
  AppointmentSource,
  AppointmentStatus,
  AppointmentType,
  ArrivalWindow,
  CancelReason,
  FailedReason,
} from "@/mocks";

/** One tone per meaning, shared by every appointment UI. */
export const APPOINTMENT_STATUS: Record<
  AppointmentStatus,
  { label: string; tone: StatusTone; icon: LucideIcon }
> = {
  scheduled: { label: "Scheduled", tone: "neutral", icon: Clock },
  confirmed: { label: "Confirmed", tone: "neutral", icon: CalendarCheck },
  "en-route": { label: "En route", tone: "info", icon: Navigation },
  "in-progress": { label: "In progress", tone: "info", icon: Truck },
  completed: { label: "Completed", tone: "success", icon: CircleCheck },
  failed: { label: "Failed visit", tone: "destructive", icon: OctagonAlert },
  cancelled: { label: "Cancelled", tone: "neutral", icon: Ban },
};

/** Lifecycle order used by filters and the progress stepper. */
export const APPOINTMENT_STATUS_ORDER: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "en-route",
  "in-progress",
  "completed",
  "failed",
  "cancelled",
];

/** Statuses that close an appointment — no further field actions. */
export const CLOSED_STATUSES: AppointmentStatus[] = [
  "completed",
  "failed",
  "cancelled",
];

export function AppointmentStatusPill({
  status,
}: {
  status: AppointmentStatus;
}) {
  const s = APPOINTMENT_STATUS[status];
  return (
    <StatusPill tone={s.tone} dot>
      {s.label}
    </StatusPill>
  );
}

export const APPOINTMENT_TYPE: Record<AppointmentType, { label: string }> = {
  initial: { label: "Initial" },
  standard: { label: "Standard" },
  reservice: { label: "Reservice" },
};

export const SERVICE_TYPE_LABEL: Record<AppointmentServiceType, string> = {
  collection: "Collection",
  delivery: "Container delivery",
  swap: "Container swap",
  removal: "Container removal",
  inspection: "Inspection",
};

export const SOURCE_LABEL: Record<AppointmentSource, string> = {
  recurring: "Recurring service",
  "customer-request": "Customer request",
};

export const WINDOW_LABEL: Record<ArrivalWindow, string> = {
  AM: "Morning",
  PM: "Afternoon",
  night: "Night",
  AT: "Anytime",
};

/** Local Dubai hours each arrival window covers. */
export const WINDOW_HOURS: Record<ArrivalWindow, [number, number]> = {
  AM: [6, 10],
  PM: [14, 18],
  night: [21, 24],
  AT: [7, 17],
};

export const FAILED_REASON: Record<FailedReason, string> = {
  no_waste: "No waste",
  access_blocked: "Access blocked",
  service_refused: "Service refused",
  bin_not_out: "Bin not out",
  contaminated: "Contaminated",
};

export const CANCEL_REASON: Record<CancelReason, string> = {
  customer_request: "Customer request",
  service_pro_unavailable: "Service pro unavailable",
  vehicle_breakdown: "Vehicle breakdown",
  weather: "Weather",
  other: "Other",
};
