import {
  GraduationCap,
  type LucideIcon,
  Moon,
  PhoneCall,
  Plane,
  Sun,
} from "lucide-react";
import type { StatusTone } from "@/components/shared";
import {
  type LicenceType,
  MOCK_NOW,
  type Shift,
  type ShiftType,
} from "@/mocks";

/** One tone per shift type, shared by the shift board, profiles and Dispatch. */
export const SHIFT_TYPE: Record<
  ShiftType,
  { label: string; tone: StatusTone; icon: LucideIcon }
> = {
  morning: { label: "Morning", tone: "info", icon: Sun },
  night: { label: "Night", tone: "neutral", icon: Moon },
  "on-call": { label: "On call", tone: "warning", icon: PhoneCall },
  training: { label: "Training", tone: "success", icon: GraduationCap },
  leave: { label: "Leave", tone: "destructive", icon: Plane },
};

export const SHIFT_TYPE_ORDER = Object.keys(SHIFT_TYPE) as ShiftType[];

/** "06:00–14:00", "20:00–04:00 (+1)", or "Leave". */
export function formatShiftWindow(
  shift: Pick<Shift, "type" | "startTime" | "endTime">,
) {
  if (shift.type === "leave" || !shift.startTime || !shift.endTime)
    return SHIFT_TYPE.leave.label;
  const overnight = shift.endTime < shift.startTime;
  return `${shift.startTime}–${shift.endTime}${overnight ? " (+1)" : ""}`;
}

/** Shift length in hours, overnight shifts included. */
export function shiftHours(shift: Pick<Shift, "startTime" | "endTime">) {
  if (!shift.startTime || !shift.endTime) return 0;
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  let mins = toMins(shift.endTime) - toMins(shift.startTime);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

export const LICENCE_TYPE: Record<LicenceType, string> = {
  heavy_vehicle: "Heavy vehicle",
  hazmat: "Hazmat (ADR)",
  medical_waste: "Medical waste handling",
};

/** Expired, expiring within 30 days of the mock today, or valid. */
export function licenceState(expiresOn: string) {
  const days = Math.round(
    (Date.parse(`${expiresOn}T00:00:00Z`) - Date.parse(MOCK_NOW)) / 86_400_000,
  );
  if (days < 0) return { tone: "destructive" as const, label: "Expired", days };
  if (days <= 30)
    return { tone: "warning" as const, label: `Expires in ${days} d`, days };
  return { tone: "success" as const, label: "Valid", days };
}
