/**
 * Phase-1 route optimisation (spec section 5 rule 5): re-sequence an instance's open
 * stops by time window, then nearest next stop, and recompute planned times.
 * Closed stops (completed, failed, cancelled, in progress) keep their place
 * at the front. Scored before and after so the dispatcher sees the gain.
 *
 * Phase 2 (real cycle times from GPS) replaces the straight-line estimates
 * later; the shape of the result stays the same.
 */
import type { Appointment, RouteInstance, TippingTrip } from "@/mocks";
import type { RouteContext } from "./route-rules";
import { type RouteScore, scoreInstance } from "./route-score";

export type OptimizeResult = {
  before: RouteScore | null;
  after: RouteScore | null;
  /** Instance fields to patch. */
  instance: Pick<
    RouteInstance,
    | "appointmentIds"
    | "tippingTrips"
    | "estimatedKm"
    | "estimatedDriveMins"
    | "flags"
  >;
  /** New planned times per re-sequenced appointment. */
  appointments: { id: string; plannedStart: string }[];
  /** Nothing to move: fewer than two open stops. */
  unchanged: boolean;
};

const DUBAI_OFFSET_MIN = 4 * 60;
const OPEN = new Set(["scheduled", "confirmed"]);

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dx = (a.lng - b.lng) * 101;
  const dy = (a.lat - b.lat) * 111;
  return Math.sqrt(dx * dx + dy * dy);
}
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
function at(day: string, minutes: number) {
  return new Date(
    Date.parse(`${day}T00:00:00Z`) + (minutes - DUBAI_OFFSET_MIN) * 60_000,
  ).toISOString();
}
function minutesOf(iso: string) {
  const d = new Date(iso);
  return ((d.getUTCHours() + 4) * 60 + d.getUTCMinutes()) % 1440;
}

export function optimizeInstance(
  instance: RouteInstance,
  stops: Appointment[],
  ctx: RouteContext,
): OptimizeResult {
  const route = ctx.routes.find((r) => r.id === instance.routeId);
  const before = scoreInstance(instance, stops, ctx);
  const byId = new Map(stops.map((a) => [a.id, a]));
  const ordered = instance.appointmentIds
    .map((id) => byId.get(id))
    .filter((a): a is Appointment => Boolean(a));
  const fixed = ordered.filter((a) => !OPEN.has(a.status));
  const open = ordered.filter((a) => OPEN.has(a.status));
  const unchanged = {
    before,
    after: before,
    instance: {
      appointmentIds: instance.appointmentIds,
      tippingTrips: instance.tippingTrips,
      estimatedKm: instance.estimatedKm,
      estimatedDriveMins: instance.estimatedDriveMins,
      flags: instance.flags,
    },
    appointments: [],
    unchanged: true,
  };
  if (!route || open.length < 2) return unchanged;

  type Cand = {
    apt: Appointment;
    site: { lat: number; lng: number };
    win: [number, number];
    exchange: boolean;
  };
  const cands: Cand[] = open.map((apt) => {
    const site = ctx.servicePoints.find((s) => s.id === apt.servicePointId);
    return {
      apt,
      site: site ?? { lat: 25.2, lng: 55.27 },
      win: [minutesOf(apt.windowStart), minutesOf(apt.windowEnd) || 1440],
      exchange: apt.workOrders[0]?.method === "exchange",
    };
  });

  // Start where the fixed part ends: the last closed stop, else the depot.
  const depot = ctx.masters.depots.find((d) => d.id === route.depotId);
  const lastFixed = fixed.at(-1);
  let here: { lat: number; lng: number } | undefined = lastFixed
    ? ctx.servicePoints.find((s) => s.id === lastFixed.servicePointId)
    : depot;
  let cursor = lastFixed
    ? minutesOf(lastFixed.plannedStart) + lastFixed.durationMins
    : toMin(route.startTime);

  const left = [...cands].sort((a, b) => a.win[0] - b.win[0]);
  const seq: Cand[] = [];
  while (left.length) {
    const earliest = left[0].win[0];
    const group = left.filter((c) => c.win[0] === earliest);
    const from = here;
    const next = from
      ? group.reduce((best, c) =>
          km(from, c.site) < km(from, best.site) ? c : best,
        )
      : group[0];
    seq.push(next);
    left.splice(left.indexOf(next), 1);
    here = next.site;
  }

  const appointments: OptimizeResult["appointments"] = [];
  const flags: RouteInstance["flags"] = instance.flags.filter(
    (f) => f.kind !== "outside-window",
  );
  let prev: { lat: number; lng: number } | undefined = lastFixed
    ? ctx.servicePoints.find((s) => s.id === lastFixed.servicePointId)
    : depot;
  let distance = 0;
  const tipping: TippingTrip[] = instance.tippingTrips.filter((t) =>
    fixed.some((a) => a.id === t.afterAppointmentId),
  );
  const facilityOf = (code: string | null | undefined) => {
    const sites = ctx.masters.disposalSites.filter((s) =>
      route.disposalSiteIds.includes(s.id),
    );
    const match = code
      ? sites.find((s) => s.wasteCodes.includes(code))
      : undefined;
    return (match ?? sites[0])?.name;
  };
  for (const c of seq) {
    const legKm = prev ? km(prev, c.site) : 5;
    distance += legKm;
    const arrive = Math.max(cursor + Math.round(5 + legKm * 2), c.win[0]);
    if (arrive > c.win[1])
      flags.push({ kind: "outside-window", appointmentId: c.apt.id });
    appointments.push({
      id: c.apt.id,
      plannedStart: at(instance.date, arrive),
    });
    cursor = arrive + c.apt.durationMins;
    prev = c.site;
    if (c.exchange) {
      const item = ctx.items.find(
        (i) => i.id === c.apt.workOrders[0]?.serviceItemId,
      );
      tipping.push({
        id: `${instance.id}-tip${tipping.length + 1}`,
        afterAppointmentId: c.apt.id,
        facility: facilityOf(item?.wasteCode) ?? "Disposal site",
        plannedStart: at(instance.date, cursor + 10),
        durationMins: 40,
      });
      cursor += 50;
      distance += 20;
    }
  }
  const last = seq.at(-1);
  if (last && !tipping.some((t) => t.afterAppointmentId === last.apt.id)) {
    tipping.push({
      id: `${instance.id}-tip${tipping.length + 1}`,
      afterAppointmentId: last.apt.id,
      facility: facilityOf(null) ?? "Disposal site",
      plannedStart: at(instance.date, cursor + 10),
      durationMins: 35,
    });
    distance += 15;
  }

  const appointmentIds = [
    ...fixed.map((a) => a.id),
    ...seq.map((c) => c.apt.id),
  ];
  const estimatedKm = Math.round(distance * 10) / 10;
  const nextInstance = {
    ...instance,
    appointmentIds,
    tippingTrips: tipping,
    flags,
  };
  const nextStops = stops.map((a) => {
    const moved = appointments.find((m) => m.id === a.id);
    return moved ? { ...a, plannedStart: moved.plannedStart } : a;
  });
  const after = scoreInstance(nextInstance, nextStops, ctx);
  return {
    before,
    after,
    instance: {
      appointmentIds,
      tippingTrips: tipping,
      estimatedKm,
      estimatedDriveMins: Math.round(estimatedKm * 2.2),
      flags,
    },
    appointments,
    unchanged: false,
  };
}
