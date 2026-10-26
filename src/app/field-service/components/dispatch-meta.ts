import type {
  Appointment,
  HandlingMethod,
  Route,
  RouteCrewRole,
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
  secondary: "Loader",
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

/** Everything the board shows about one route, resolved once per render. */
export type RoutePlan = {
  route: Route;
  colors: RouteColors;
  pro: Technician | undefined;
  crew: { pro: Technician; role: RouteCrewRole }[];
  vehicle: Vehicle | undefined;
  /** Every stop in drive order — the stop number is the index + 1. */
  stops: Appointment[];
  /** Stops that still count against capacity (not cancelled). */
  activeStops: number;
  loadKg: number;
  /** Stops whose work needs a different class of truck. */
  mismatches: number;
  locked: boolean;
};

/** The fake dispatch actions the board's panels call. */
export type BoardActions = {
  /** Put an appointment on a route, or back in the backlog with `null`. */
  assign: (appointmentId: string, routeId: string | null) => void;
  setLocked: (routeId: string, locked: boolean) => void;
  setVehicle: (routeId: string, vehicleId: string) => void;
  setPrimary: (routeId: string, serviceProId: string) => void;
  /** Send every stop not yet started back to the backlog. */
  clearRoute: (routeId: string) => void;
};
