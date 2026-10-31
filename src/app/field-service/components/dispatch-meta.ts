import type { Capacity, RouteScore } from "@/features/field-service";
import type {
  Appointment,
  HandlingMethod,
  InstanceFlag,
  Route,
  RouteCrewRole,
  RouteInstance,
  RouteInstanceStatus,
  RouteShiftId,
  StaffingSource,
  Technician,
  Vehicle,
  VehicleClass,
} from "@/mocks";
import type { RouteColors } from "./route-sidebar";

/**
 * Which trucks can carry each handling method. A stop is judged by its first
 * work order — good enough for a planning hint; the real rule lives server-side.
 */
export const METHOD_VEHICLE_CLASSES: Record<HandlingMethod, VehicleClass[]> = {
  "empty-on-site": ["compactor"],
  exchange: ["hook-loader", "skip-loader"],
  packaged: ["box-truck"],
  destruction: ["box-truck"],
  "pump-out": ["tanker"],
  logistics: ["skip-loader"],
};

export const CREW_ROLE_LABEL: Record<RouteCrewRole | "primary", string> = {
  primary: "Primary",
  secondary: "Helper",
  trainee: "Trainee",
};

/** Vehicle classes an appointment's first work order needs; `null` = any. */
export function requiredClasses(appointment: Appointment) {
  const method = appointment.workOrders[0]?.method;
  return method ? METHOD_VEHICLE_CLASSES[method] : null;
}

/** Whether a truck of this class can run the appointment. */
export function fitsVehicle(
  appointment: Appointment,
  vehicleClass: VehicleClass | undefined,
) {
  const classes = requiredClasses(appointment);
  if (!classes) return true;
  return vehicleClass !== undefined && classes.includes(vehicleClass);
}

/**
 * Only stops nobody has set off for can change route — once a pro is en route
 * or on site the visit stays where it is.
 */
export function isMovable(appointment: Appointment) {
  return (
    appointment.status === "scheduled" || appointment.status === "confirmed"
  );
}

/** Planned load:recorded weight where there is one, the estimate otherwise. */
export function appointmentLoadKg(appointment: Appointment) {
  return appointment.workOrders.reduce(
    (sum, wo) => sum + (wo.weightKg ?? wo.weightEstKg),
    0,
  );
}

export const SHIFT_LABEL: Record<RouteShiftId, string> = {
  MORNING: "Morning",
  NIGHT: "Night",
};

/** A staffing slot on an instance: `truck`, `driver`, `helper-1`… */
export type SlotKind = "truck" | "driver" | "helper";

export function slotKind(slot: string): SlotKind {
  if (slot === "truck" || slot === "driver") return slot;
  return "helper";
}

/** "truck", "driver", "helper 2" — for chips and menus. */
export function slotLabel(slot: string) {
  return slot.startsWith("helper-") ? `helper ${slot.slice(7)}` : slot;
}

/** An asset the dispatcher could put in an empty slot. */
export type StaffOption = {
  id: string;
  name: string;
  /** Plate's class, a pro's role — shown greyed next to the name. */
  detail: string;
  eligible: boolean;
  /** Why it can't take the slot (failed rule, already out, off shift). */
  reason?: string;
};

/** An empty slot and who could fill it. */
export type OpenSlot = {
  slot: string;
  kind: SlotKind;
  options: StaffOption[];
};

/** Statuses the dispatcher can still staff and confirm (before the shift). */
export const PLANNABLE_STATUSES: RouteInstanceStatus[] = [
  "planned",
  "unstaffed",
];

/** Instances whose stop order can still be optimised: not confirmed, not closed. */
export function canOptimize(plan: Pick<RoutePlan, "route" | "locked">) {
  return (
    !plan.locked &&
    plan.route.status !== "confirmed" &&
    plan.route.status !== "completed" &&
    plan.route.status !== "partial" &&
    plan.route.status !== "cancelled"
  );
}

/** Flags that stop a plain Confirm (R16, R21) — "Confirm anyway" overrides. */
export function confirmBlockers(route: RouteInstance) {
  const blockers: string[] = [];
  const unstaffed = route.flags.filter((f) => f.kind === "unstaffed");
  if (unstaffed.length || route.status === "unstaffed")
    blockers.push(
      unstaffed.length
        ? `Unstaffed: ${unstaffed.map((f) => slotLabel(f.slot)).join(", ")}`
        : "Unstaffed",
    );
  const over = route.flags.find((f) => f.kind === "over-capacity");
  if (over) blockers.push(`Over capacity ${over.utilisation}%`);
  return blockers;
}

/** Drop one slot's unstaffed / substitute flags once it's been staffed by hand. */
export function withoutSlotFlags(flags: InstanceFlag[], slot: string) {
  return flags.filter(
    (f) =>
      !((f.kind === "unstaffed" || f.kind === "substitute") && f.slot === slot),
  );
}

/** Everything the board shows about one route instance, resolved once per render. */
export type RoutePlan = {
  route: RouteInstance;
  /** The Route (template) it was generated from. */
  template: Route | undefined;
  colors: RouteColors;
  pro: Technician | undefined;
  crew: {
    pro: Technician;
    role: RouteCrewRole;
    /** How the helper slot got filled, when it wasn't the primary. */
    source?: StaffingSource;
  }[];
  vehicle: Vehicle | undefined;
  /** Every stop in drive order — the stop number is the index + 1. */
  stops: Appointment[];
  /** Stops that still count against capacity (not cancelled). */
  activeStops: number;
  loadKg: number;
  /**
   * The day's planned work in the Route's own capacity basis (m³ for REL,
   * visits for SKIP/HOOK, kg for MED/HAZ/WWT), against its capacity per shift
   * on the instance's truck. `null` for an instance with no Route.
   */
  capacity: (Capacity & { consumed: number }) | null;
  /** Instance score from its stop order and times; `null` while loading. */
  score: RouteScore | null;
  /** Stops whose work needs a different class of truck. */
  mismatches: number;
  /** Confirmed (or otherwise locked): no drops, no staffing changes. */
  locked: boolean;
  /** Still before the shift: staffing and Confirm apply. */
  plannable: boolean;
  /** Empty slots with their eligible (and ineligible) assets. */
  openSlots: OpenSlot[];
  /** Why Confirm needs an override; empty = ready to confirm. */
  blockers: string[];
};

/** The fake dispatch actions the board's panels call. */
export type BoardActions = {
  /** Put an appointment on a route, or back in the backlog with `null`. */
  assign: (appointmentId: string, routeId: string | null) => void;
  /** Confirm (lock) an instance, or reopen it. `force` = "Confirm anyway". */
  setConfirmed: (routeId: string, confirmed: boolean, force?: boolean) => void;
  setVehicle: (routeId: string, vehicleId: string) => void;
  setPrimary: (routeId: string, serviceProId: string) => void;
  /** Fill an empty truck / driver / helper slot by hand. */
  staff: (routeId: string, slot: string, assetId: string) => void;
  /** Send every stop not yet started back to the backlog. */
  clearRoute: (routeId: string) => void;
  /** Re-sequence the open stops (window, then nearest); toast with Undo. */
  optimize: (routeId: string) => void;
};

/** A backlog job's default route (R24): the Route its service line sits on. */
export type DefaultRoute = {
  route: Route;
  /** Its instance on the day being planned, if it runs then. */
  plan: RoutePlan | undefined;
};
