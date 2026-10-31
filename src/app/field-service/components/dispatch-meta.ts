import {
  type InstanceLoad,
  LIMIT_NAME,
  type OverCapacity,
  type RouteScore,
} from "@/features/field-service";
import type {
  Appointment,
  FailedReason,
  HandlingMethod,
  InstanceClosure,
  InstanceFlag,
  Route,
  RouteCrewRole,
  RouteInstance,
  RouteInstanceStatus,
  RouteShiftId,
  RunCancelReason,
  StaffingSource,
  Technician,
  Vehicle,
  VehicleClass,
} from "@/mocks";
import type { RouteColors } from "./route-sidebar";

/**
 * Which trucks can carry each handling method. A stop is judged by its first
 * work order: good enough for a planning hint; the real rule lives server-side.
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
 * Only stops nobody has set off for can change route: once a pro is en route
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

/** "truck", "driver", "helper 2": for chips and menus. */
export function slotLabel(slot: string) {
  return slot.startsWith("helper-") ? `helper ${slot.slice(7)}` : slot;
}

/** An asset the dispatcher could put in an empty slot. */
export type StaffOption = {
  id: string;
  name: string;
  /** Plate's class, a pro's role: shown greyed next to the name. */
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

/** Flags that stop a plain Confirm (R16, R21): "Confirm anyway" overrides. */
export const RUN_CANCEL_REASON: Record<RunCancelReason, string> = {
  public_holiday: "Public holiday",
  vehicle_breakdown: "Vehicle breakdown",
  weather: "Weather",
  customer_closure: "Customer sites closed",
  no_stops: "Nothing to collect",
  other: "Other",
};

/** Runs that haven't started and aren't closed: what Cancel applies to. */
export const CANCELLABLE_STATUSES: RouteInstanceStatus[] = [
  "planned",
  "unstaffed",
  "confirmed",
];

/** Finished stops: what may stay on a closed run without a decision (R17). */
export const RESOLVED_STATUSES: Appointment["status"][] = [
  "completed",
  "failed",
  "cancelled",
];

/**
 * Why Confirm needs an override. `liveCapacity` = the board judges capacity
 * from the current load, so the generation-time flag (which goes stale once
 * stops or the truck change) is left out.
 */
export function confirmBlockers(
  route: RouteInstance,
  { liveCapacity = false }: { liveCapacity?: boolean } = {},
) {
  const blockers: string[] = [];
  const unstaffed = route.flags.filter((f) => f.kind === "unstaffed");
  if (unstaffed.length || route.status === "unstaffed")
    blockers.push(
      unstaffed.length
        ? `Unstaffed: ${unstaffed.map((f) => slotLabel(f.slot)).join(", ")}`
        : "Unstaffed",
    );
  const over = liveCapacity
    ? undefined
    : route.flags.find((f) => f.kind === "over-capacity");
  if (over)
    blockers.push(
      `Over capacity ${over.utilisation}%${over.limit ? ` (${LIMIT_NAME[over.limit]})` : ""}`,
    );
  return blockers;
}

/** Drop one slot's unstaffed / substitute flags once it's been staffed by hand. */
export function withoutSlotFlags(flags: InstanceFlag[], slot: string) {
  return flags.filter(
    (f) =>
      !(
        (f.kind === "unstaffed" ||
          f.kind === "substitute" ||
          f.kind === "ineligible") &&
        f.slot === slot
      ),
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
  /** Every stop in drive order: the stop number is the index + 1. */
  stops: Appointment[];
  /** Stops that still count against capacity (not cancelled). */
  activeStops: number;
  /** Of those, the ones finished (completed or failed). */
  doneStops: number;
  loadKg: number;
  /**
   * Worst case, forecast and actual load against every limit of the truck
   * the instance has (operations-flow section 3.6). `null` for an instance
   * with no Route.
   */
  load: InstanceLoad | null;
  /** Instance score from its stop order and times; `null` while loading. */
  score: RouteScore | null;
  /** Stops whose work needs a different class of truck. */
  mismatches: number;
  /** Confirmed, closed or otherwise locked: no drops, no staffing changes. */
  locked: boolean;
  /** Closed by the dispatcher: read-only, corrections are adjustments (R18). */
  closed: boolean;
  /** Its day has started and work began (or the day is over): Close run applies. */
  closable: boolean;
  /** Still before the shift: staffing and Confirm apply. */
  plannable: boolean;
  /** Empty slots with their eligible (and ineligible) assets. */
  openSlots: OpenSlot[];
  /** Why Confirm needs an override; empty = ready to confirm. */
  blockers: string[];
  /**
   * The current truck and crew re-checked for this day (R4, R5, section 4.2):
   * `block` = may not run it (e.g. an expired licence), `warn` = expires soon.
   */
  eligibility: EligibilityIssue[];
  /** Live Over capacity with its two fixes; `null` when the run fits or can't change. */
  overCapacity: OverCapacity | null;
};

export type EligibilityIssue = {
  slot: string;
  name: string;
  reason: string;
  severity: "block" | "warn";
};

/** How each open stop is resolved in the closing sheet (R17). */
export type StopResolution =
  | { outcome: "missed"; reason: FailedReason }
  | { outcome: "rescheduled" };

export type CloseRunInput = {
  resolutions: Record<string, StopResolution>;
  odometerOut: number | null;
  odometerIn: number | null;
  tipTickets: InstanceClosure["tipTickets"];
  note: string;
};

/** The fake dispatch actions the board's panels call. */
export type BoardActions = {
  /** Resolve the open stops and close the run (R17); it becomes read-only. */
  closeRun: (routeId: string, input: CloseRunInput) => void;
  /** Add a dated correction to a closed run (R18). */
  addAdjustment: (routeId: string, note: string) => void;
  /** Move several stops to another run in one go (Over capacity: split). */
  moveStops: (appointmentIds: string[], toRouteId: string) => void;
  /** Accept extra trips on a run (Over capacity: second trip), recording who. */
  acceptExtraTrips: (routeId: string, count: number) => void;
  /** Cancel runs (one, or every cancellable run on the day); open stops go back to the backlog. */
  cancelRuns: (
    routeIds: string[],
    reason: RunCancelReason,
    note: string,
  ) => void;
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
