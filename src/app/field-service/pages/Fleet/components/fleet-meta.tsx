import { StatusPill, type StatusTone } from "@/components/shared";
import type {
  RouteAssignment,
  TruckType,
  Vehicle,
  VehicleStatus,
} from "@/mocks";
import { licenceState } from "../../../components";
import { formatKg } from "../../../utils";

export const VEHICLE_STATUS: Record<
  VehicleStatus,
  { label: string; tone: StatusTone }
> = {
  "in-service": { label: "In service", tone: "success" },
  maintenance: { label: "In workshop", tone: "warning" },
  "out-of-service": { label: "Out of service", tone: "destructive" },
};

export function VehicleStatusPill({ status }: { status: VehicleStatus }) {
  const s = VEHICLE_STATUS[status];
  return (
    <StatusPill tone={s.tone} dot>
      {s.label}
    </StatusPill>
  );
}

/** Registration or insurance expired, or expiring within 30 days. */
export function expiresSoon(vehicle: Vehicle) {
  return [vehicle.registrationExpiry, vehicle.insuranceExpiry].some(
    (date) => licenceState(date).tone !== "success",
  );
}

/** Compacting bodies compress the load; a tank (ratio 1) doesn't. */
export function isCompacting(type: TruckType | undefined) {
  return Boolean(type?.bodyM3 && (type.compressionRatio ?? 1) > 1);
}

/** "25 m³ × 5" for compacting bodies, "10 m³" for a tank, `null` otherwise. */
export function bodyLabel(type: TruckType | undefined) {
  if (!type?.bodyM3) return null;
  return isCompacting(type)
    ? `${type.bodyM3} m³ × ${type.compressionRatio}`
    : `${type.bodyM3} m³`;
}

/** "1 slot", "40 slots". */
export function slotsLabel(slots: number) {
  return `${slots} ${slots === 1 ? "slot" : "slots"}`;
}

/** Payload first, then the body or slots that actually limit a trip. */
export function capacityLines(vehicle: Vehicle, type: TruckType | undefined) {
  const extra =
    bodyLabel(type) ??
    (type?.containerSlots ? slotsLabel(type.containerSlots) : null);
  return { payload: formatKg(vehicle.capacityKg), extra };
}

/** "Primary" or "Backup 2"; primaries rank 0. */
export function assignmentRole(a: Pick<RouteAssignment, "role" | "rank">) {
  return a.role === "primary" ? "Primary" : `Backup ${a.rank}`;
}

const expiryFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "31 Mar 2027" for a calendar day. */
export function formatDay(day: string) {
  return expiryFormat.format(new Date(`${day}T00:00:00Z`));
}

/** "Reg 31 Mar 2027", flagged with its expiry tone once it's within 30 days. */
export function ExpiryLine({ label, date }: { label: string; date: string }) {
  const state = licenceState(date);
  return (
    <span className="flex flex-col items-start gap-0.5 whitespace-nowrap">
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground w-6 text-xs">{label}</span>
        <span className="text-sm tabular-nums">{formatDay(date)}</span>
      </span>
      {state.tone === "success" ? null : (
        <StatusPill tone={state.tone} className="ms-7">
          {state.label}
        </StatusPill>
      )}
    </span>
  );
}
