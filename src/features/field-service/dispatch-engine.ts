/**
 * The dispatch engine (spec §4.3, §6): turns Active Routes into Route
 * Instances for the days asked — copies the stops that are due, fills truck,
 * driver and helpers (primary → backups by rank → pool → Unstaffed), orders
 * stops by time window then proximity, and flags anything a dispatcher must
 * look at.
 *
 * Pure: give it the data, get instances + their stops (appointments) + a
 * summary back. Prototype-grade — travel is straight-line, durations are
 * estimates, and nothing is persisted (the caller writes session state).
 */
import type {
  Appointment,
  ArrivalWindow,
  InstanceFlag,
  Route,
  RouteInstance,
  ServiceLine,
  ServicePoint,
  Shift,
  StaffingSource,
  TimeWindow,
  TippingTrip,
} from "@/mocks";
import { MOCK_NOW } from "@/mocks";
import {
  assignmentChecks,
  findLine,
  isLineDue,
  isRouteDue,
  lineConsumption,
  type RouteContext,
  routeCapacity,
  weekdayOfDay,
} from "./route-rules";
import { newWorkOrder } from "./work-orders";

export type EngineInput = RouteContext & {
  /** Dubai day keys to generate, e.g. `["2026-09-05"]`. */
  days: string[];
  shiftOf: (serviceProId: string, day: string) => Shift | undefined;
  /** Instances that already exist — never generated twice, and their assets are taken. */
  existing: RouteInstance[];
};

export type GenerationSummary = {
  days: string[];
  generated: number;
  /** Routes skipped because an instance already exists for that day. */
  alreadyGenerated: number;
  unstaffed: number;
  overCapacity: number;
  substitutions: number;
  outsideWindow: number;
  contractsSkipped: number;
  stops: number;
  /** Routes due that day with no service line due — no instance is made. */
  nothingDue: number;
};

const DUBAI_OFFSET_MIN = 4 * 60;

/** ISO instant for a Dubai day at local `HH:mm` (24:00 = next midnight). */
function at(day: string, minutes: number) {
  return new Date(
    Date.parse(`${day}T00:00:00Z`) + (minutes - DUBAI_OFFSET_MIN) * 60_000,
  ).toISOString();
}
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** A line's window clipped to the route's planned hours, in minutes of the day. */
function windowMinutes(w: TimeWindow, route: Route): [number, number] {
  const start = toMin(route.startTime);
  const end = toMin(route.endTime === "00:00" ? "24:00" : route.endTime);
  if (w.kind === "before") return [start, Math.min(end, toMin(w.to))];
  if (w.kind === "after") return [Math.max(start, toMin(w.from)), end];
  if (w.kind === "range") return [toMin(w.from), toMin(w.to)];
  return [start, end];
}

function arrivalWindow(fromMin: number, w: TimeWindow): ArrivalWindow {
  if (w.kind === "none") return "AT";
  if (fromMin < 12 * 60) return "AM";
  if (fromMin < 18 * 60) return "PM";
  return "night";
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dx = (a.lng - b.lng) * 101;
  const dy = (a.lat - b.lat) * 111;
  return Math.sqrt(dx * dx + dy * dy);
}

/** A person can work the route's shift that day (on leave or wrong shift = no). */
function works(shift: Shift | undefined, route: Route) {
  if (!shift || shift.type === "leave") return false;
  if (route.shiftId === "NIGHT") return shift.type === "night";
  return shift.type !== "night";
}

let refSeq = 50000;

export function generateInstances(input: EngineInput) {
  const instances: RouteInstance[] = [];
  const appointments: Appointment[] = [];
  const summary: GenerationSummary = {
    days: input.days,
    generated: 0,
    alreadyGenerated: 0,
    unstaffed: 0,
    overCapacity: 0,
    substitutions: 0,
    outsideWindow: 0,
    contractsSkipped: 0,
    stops: 0,
    nothingDue: 0,
  };

  // Assets already out per day + shift — from existing instances and this run.
  const busy = new Map<string, Set<string>>();
  const taken = (day: string, shiftId: string) => {
    const key = `${day}|${shiftId}`;
    if (!busy.has(key)) busy.set(key, new Set());
    return busy.get(key) as Set<string>;
  };
  for (const inst of input.existing) {
    const set = taken(inst.date, inst.shiftId);
    for (const id of [
      inst.vehicleId,
      inst.primaryServiceProId,
      ...inst.crew.map((c) => c.serviceProId),
    ])
      if (id) set.add(id);
  }

  for (const day of input.days) {
    const wd = weekdayOfDay(day);
    // Routes with stricter staffing first, so pool assets go where they're scarce.
    const due = input.routes
      .filter((r) => isRouteDue(r, day))
      .sort((a, b) => a.code.localeCompare(b.code));

    for (const route of due) {
      const id = `${route.code}-${day.replaceAll("-", "")}-${route.shiftId[0]}`;
      if (input.existing.some((i) => i.id === id)) {
        summary.alreadyGenerated++;
        continue;
      }
      const used = taken(day, route.shiftId);
      const flags: InstanceFlag[] = [];
      const staffing: Record<string, StaffingSource> = {};

      const assigned = (kind: "truck" | "driver" | "helper") =>
        input.assignments
          .filter(
            (a) =>
              a.routeId === route.id &&
              a.assetType === kind &&
              a.status === "active" &&
              (!a.days.length || a.days.includes(wd)) &&
              a.validFrom <= day &&
              (!a.validTo || a.validTo >= day),
          )
          .sort((a, b) => a.rank - b.rank);

      const available = (
        kind: "truck" | "driver" | "helper",
        assetId: string,
      ) => {
        if (used.has(assetId)) return false;
        if (kind === "truck")
          return (
            input.vehicles.find((v) => v.id === assetId)?.status ===
            "in-service"
          );
        return works(input.shiftOf(assetId, day), route);
      };

      /** §4.3: primary, then backups by rank, then an eligible pool asset. */
      const fill = (kind: "truck" | "driver" | "helper", slot: string) => {
        for (const a of assigned(kind)) {
          if (!available(kind, a.assetId)) continue;
          used.add(a.assetId);
          staffing[slot] = a.role === "primary" ? "primary" : "backup";
          if (a.role !== "primary") {
            flags.push({ kind: "substitute", slot, source: "backup" });
            summary.substitutions++;
          }
          return a.assetId;
        }
        const pool =
          kind === "truck"
            ? input.vehicles.map((v) => v.id)
            : input.pros
                .filter((p) =>
                  kind === "driver" ? p.role !== "loader" : p.role === "loader",
                )
                .map((p) => p.id);
        for (const assetId of pool) {
          if (!available(kind, assetId)) continue;
          const eligible = assignmentChecks(
            route,
            kind,
            assetId,
            "backup",
            [wd],
            input,
          ).every((c) => c.ok || c.severity === "warn");
          if (!eligible) continue;
          used.add(assetId);
          staffing[slot] = "pool";
          flags.push({ kind: "substitute", slot, source: "pool" });
          summary.substitutions++;
          return assetId;
        }
        flags.push({ kind: "unstaffed", slot });
        return null;
      };

      const truckId = fill("truck", "truck");
      const driverId = fill("driver", "driver");
      const crew: RouteInstance["crew"] = [];
      for (let i = 0; i < route.helpers; i++) {
        const helper = fill("helper", `helper-${i + 1}`);
        if (helper) crew.push({ serviceProId: helper, role: "secondary" });
      }

      // Stops: lines due today with an active contract (§6.2 rule 7, R15).
      const depot = input.masters.depots.find((d) => d.id === route.depotId);
      type Due = { line: ServiceLine; sp: ServicePoint; win: [number, number] };
      const dueLines: Due[] = [];
      for (const lineId of route.serviceLineIds) {
        const found = findLine(input.servicePoints, lineId);
        if (!found || !isLineDue(found.line, day)) continue;
        if (found.line.contractStatus !== "active") {
          flags.push({
            kind: "contract-skipped",
            serviceLineId: lineId,
            reason: found.line.contractStatus,
          });
          summary.contractsSkipped++;
          continue;
        }
        dueLines.push({
          line: found.line,
          sp: found.servicePoint,
          win: windowMinutes(found.line.timeWindow, route),
        });
      }

      if (!dueLines.length) {
        // Nothing to collect today: no run, no idle crew flagged as unstaffed.
        for (const id of [
          truckId,
          driverId,
          ...crew.map((c) => c.serviceProId),
        ])
          if (id) used.delete(id);
        summary.nothingDue++;
        continue;
      }

      // Phase-1 sequencing: by window, then nearest next stop.
      const ordered: Due[] = [];
      const left = [...dueLines].sort((a, b) => a.win[0] - b.win[0]);
      let here: { lat: number; lng: number } | undefined = depot ?? left[0]?.sp;
      while (left.length) {
        const earliest = left[0].win[0];
        const group = left.filter((d) => d.win[0] === earliest);
        const from: { lat: number; lng: number } | undefined = here;
        const next: Due = from
          ? group.reduce((best, d) =>
              km(from, d.sp) < km(from, best.sp) ? d : best,
            )
          : group[0];
        ordered.push(next);
        left.splice(left.indexOf(next), 1);
        here = next.sp;
      }

      let cursor = toMin(route.startTime);
      let prev: { lat: number; lng: number } | undefined = depot;
      const stopIds: string[] = [];
      const tipping: TippingTrip[] = [];
      let distance = 0;
      for (const { line, sp, win } of ordered) {
        const item = input.items.find((i) => i.id === line.serviceItemId);
        if (!item) continue;
        const legKm = prev ? km(prev, sp) : 5;
        distance += legKm;
        const arrive = Math.max(cursor + Math.round(5 + legKm * 2), win[0]);
        const duration = Math.max(
          5,
          Math.round(5 + item.minutesPerUnit * line.quantity),
        );
        const seq = refSeq++;
        const aptId = `apt_${seq}`;
        if (arrive > win[1]) {
          flags.push({ kind: "outside-window", appointmentId: aptId });
          summary.outsideWindow++;
        }
        appointments.push({
          id: aptId,
          ref: `APT-${seq}`,
          customerId: sp.customerId,
          servicePointId: sp.id,
          serviceLineId: line.id,
          type: "standard",
          serviceType:
            item.method === "logistics" ? "inspection" : "collection",
          stream: item.stream,
          source: "recurring",
          status: "scheduled",
          window: arrivalWindow(win[0], line.timeWindow),
          windowStart: at(day, win[0]),
          windowEnd: at(day, win[1]),
          plannedStart: at(day, arrive),
          durationMins: duration,
          routeInstanceId: id,
          workOrders: [newWorkOrder(item, line.quantity, line.containerIds)],
          startedAt: null,
          completedAt: null,
          failedReason: null,
          cancelReason: null,
          createdAt: MOCK_NOW,
          bookedBy: "system",
        });
        stopIds.push(aptId);
        cursor = arrive + duration;
        prev = sp;
        if (item.method === "exchange") {
          // Every exchange hauls the container to the facility and back.
          tipping.push({
            id: `${id}-tip${tipping.length + 1}`,
            afterAppointmentId: aptId,
            facility: siteFor(route, item.wasteCode, input),
            plannedStart: at(day, cursor + 10),
            durationMins: 40,
          });
          cursor += 50;
          distance += 20;
        }
      }
      const last = stopIds.at(-1);
      if (last && !tipping.some((t) => t.afterAppointmentId === last)) {
        tipping.push({
          id: `${id}-tip${tipping.length + 1}`,
          afterAppointmentId: last,
          facility: siteFor(route, null, input),
          plannedStart: at(day, cursor + 10),
          durationMins: 35,
        });
        distance += 15;
      }

      // R16: capacity against the truck actually dispatched.
      const truck = input.vehicles.find((v) => v.id === truckId);
      const capacity = routeCapacity(route, input.masters, truck?.truckTypeId);
      const consumed = ordered.reduce(
        (sum, d) => sum + lineConsumption(route, d.line, input),
        0,
      );
      const utilisation = capacity.perShift
        ? Math.round((consumed / capacity.perShift) * 100)
        : 0;
      if (utilisation > 100) {
        flags.push({ kind: "over-capacity", utilisation });
        summary.overCapacity++;
      }

      const unstaffed = flags.some((f) => f.kind === "unstaffed");
      if (unstaffed) summary.unstaffed++;
      summary.generated++;
      summary.stops += stopIds.length;
      const kmTotal = Math.round(distance * 10) / 10;
      instances.push({
        id,
        routeId: route.id,
        routeVersion: route.version,
        name: route.name,
        date: day,
        shiftId: route.shiftId,
        status: unstaffed ? "unstaffed" : "planned",
        primaryServiceProId: driverId,
        crew,
        vehicleId: truckId,
        staffing,
        helpersRequired: route.helpers,
        flags,
        startTime: route.startTime,
        endTime: route.endTime,
        maxStops: route.plannedVisits ?? 24,
        colorIndex: route.colorIndex,
        appointmentIds: stopIds,
        tippingTrips: tipping,
        estimatedKm: kmTotal,
        estimatedDriveMins: Math.round(kmTotal * 2.2),
        lockedAt: null,
        lockedBy: null,
      });
    }
  }
  return { instances, appointments, summary };
}

function siteFor(route: Route, wasteCode: string | null, input: EngineInput) {
  const sites = input.masters.disposalSites.filter((s) =>
    route.disposalSiteIds.includes(s.id),
  );
  const match = wasteCode
    ? sites.find((s) => s.wasteCodes.includes(wasteCode))
    : undefined;
  return (match ?? sites[0])?.name ?? "Disposal site";
}
