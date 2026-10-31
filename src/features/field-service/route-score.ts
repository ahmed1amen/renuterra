/**
 * Route scoring — a 0–100 quality number with a grade and a breakdown, for a
 * Route template (design quality) and for a Route instance (how the day's run
 * is shaped). Same mechanism as XXXX's route score: each metric earns 0..1,
 * linear between a best and a worst value; the base is the weighted average
 * × 100; penalty points come off the base.
 *
 * The metrics are Renuterra's, not XXXX's: our routes are standing templates
 * with fixed sites on fixed days, so urgency means little — design, drive
 * overhead (tipping trips), capacity use and window fit are what count.
 *
 * Pure and estimate-based (straight-line distances, planning durations), so a
 * score can be computed before any optimiser runs and compared across
 * candidates. Prototype-grade.
 */
import type {
  Appointment,
  Route,
  RouteInstance,
  ServiceLine,
  ServicePoint,
} from "@/mocks";
import {
  findLine,
  isLineDue,
  lineConsumption,
  type RouteContext,
  routeCapacity,
  routeDays,
  weekdayOfDay,
} from "./route-rules";

export type ScoreGrade = "excellent" | "good" | "fair" | "poor";

export type ScoreMetric = {
  key: string;
  label: string;
  /** Raw value in `unit`; `null` when there is nothing to measure. */
  value: number | null;
  unit: "km" | "ratio" | "count";
  weight: number;
  /** 0..1 */
  score: number;
  explanation: string;
};

export type ScorePenalty = {
  key: string;
  label: string;
  points: number;
  explanation: string;
};

export type RouteScore = {
  total: number;
  grade: ScoreGrade;
  /** Weighted metric average × 100, before penalties. */
  base: number;
  penaltyPoints: number;
  metrics: ScoreMetric[];
  penalties: ScorePenalty[];
  stops: number;
  driveKm: number;
  driveMinutes: number;
  serviceMinutes: number;
};

/** Metric weights. Normalised at scoring time; a zero weight turns a metric off. */
export const SCORE_WEIGHTS = {
  neighbourhood: 0.2,
  tightness: 0.1,
  driveShare: 0.15,
  capacityUse: 0.2,
  windowFit: 0.2,
  tripEfficiency: 0.15,
};

/** Best → worst thresholds (linear in between). */
const THRESHOLDS = {
  neighbourhoodKm: [1, 6] as const,
  tightnessKm: [2, 12] as const,
  /** Waste runs drive a lot (tipping trips); 45% is a tight run, 85% a wasteful one. */
  driveShare: [0.45, 0.85] as const,
  /** Capacity use: full marks from 70% to 90%, none at 0% or ≥ 120%. */
  capacityUse: { lowZero: 0, lowFull: 0.7, highFull: 0.9, highZero: 1.2 },
};

const GRADES: [number, ScoreGrade][] = [
  [80, "excellent"],
  [65, "good"],
  [50, "fair"],
  [0, "poor"],
];

export const GRADE_LABEL: Record<ScoreGrade, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export function gradeOf(total: number): ScoreGrade {
  return GRADES.find(([min]) => total >= min)?.[1] ?? "poor";
}

/** Average speed with city traffic, tour and road factors (straight-line km → minutes). */
const MINUTES_PER_KM = 2.2;
const TIP_TRIP_KM = 15;
const TIP_MINUTES = 35;

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dx = (a.lng - b.lng) * 101;
  const dy = (a.lat - b.lat) * 111;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 1 at `best`, 0 at `worst`, linear between (works for either direction). */
function linear(value: number, best: number, worst: number) {
  if (best === worst) return 1;
  const t = (value - worst) / (best - worst);
  return Math.max(0, Math.min(1, t));
}

/** Sites of the stops, in order, with the depot first when known. */
type Stop = {
  site: ServicePoint;
  line: ServiceLine;
  serviceMinutes: number;
  /** Minutes of the day the stop was planned at, when known. */
  plannedMin: number | null;
  window: [number, number];
  exchange: boolean;
};

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function windowOf(line: ServiceLine, route: Route): [number, number] {
  const start = toMin(route.startTime);
  const end = toMin(route.endTime === "00:00" ? "24:00" : route.endTime);
  const w = line.timeWindow;
  if (w.kind === "before") return [start, Math.min(end, toMin(w.to))];
  if (w.kind === "after") return [Math.max(start, toMin(w.from)), end];
  if (w.kind === "range") return [toMin(w.from), toMin(w.to)];
  return [start, end];
}

function stopFor(
  route: Route,
  line: ServiceLine,
  site: ServicePoint,
  ctx: RouteContext,
  plannedMin: number | null,
): Stop | null {
  const item = ctx.items.find((i) => i.id === line.serviceItemId);
  if (!item) return null;
  return {
    site,
    line,
    serviceMinutes: Math.max(
      5,
      Math.round(5 + item.minutesPerUnit * line.quantity),
    ),
    plannedMin,
    window: windowOf(line, route),
    exchange: item.method === "exchange",
  };
}

type Shape = {
  stops: Stop[];
  consumed: number;
  trips: number;
  flags: RouteInstance["flags"];
  /** Stops in route order, for drive estimates. */
  ordered: Stop[];
};

function score(route: Route, shape: Shape, ctx: RouteContext): RouteScore {
  const { stops, ordered } = shape;
  const depot = ctx.masters.depots.find((d) => d.id === route.depotId);
  const metrics: ScoreMetric[] = [];
  const penalties: ScorePenalty[] = [];

  // Drive: depot → stops in order → back, plus a tipping trip per exchange
  // and one final tip.
  let driveKm = 0;
  let prev: { lat: number; lng: number } | undefined = depot;
  for (const s of ordered) {
    if (prev) driveKm += km(prev, s.site);
    prev = s.site;
    if (s.exchange) driveKm += TIP_TRIP_KM;
  }
  if (ordered.length) driveKm += TIP_TRIP_KM;
  const tips =
    ordered.filter((s) => s.exchange).length + (ordered.length ? 1 : 0);
  const driveMinutes = Math.round(
    driveKm * MINUTES_PER_KM + tips * TIP_MINUTES,
  );
  const serviceMinutes = stops.reduce((n, s) => n + s.serviceMinutes, 0);

  // Neighbourhood: average km from each stop to its nearest other stop.
  let nearest: number | null = null;
  if (stops.length >= 2) {
    const sum = stops.reduce((acc, s) => {
      const d = Math.min(
        ...stops.filter((o) => o !== s).map((o) => km(s.site, o.site)),
      );
      return acc + d;
    }, 0);
    nearest = sum / stops.length;
  }
  metrics.push({
    key: "neighbourhood",
    label: "Neighbourhood",
    value: nearest,
    unit: "km",
    weight: SCORE_WEIGHTS.neighbourhood,
    score:
      nearest === null ? 0 : linear(nearest, ...THRESHOLDS.neighbourhoodKm),
    explanation: "Average distance from each stop to its nearest other stop.",
  });

  // Tightness: average km from the centre.
  let spread: number | null = null;
  if (stops.length >= 2) {
    const c = {
      lat: stops.reduce((n, s) => n + s.site.lat, 0) / stops.length,
      lng: stops.reduce((n, s) => n + s.site.lng, 0) / stops.length,
    };
    spread = stops.reduce((n, s) => n + km(c, s.site), 0) / stops.length;
  }
  metrics.push({
    key: "tightness",
    label: "Tightness",
    value: spread,
    unit: "km",
    weight: SCORE_WEIGHTS.tightness,
    score: spread === null ? 0 : linear(spread, ...THRESHOLDS.tightnessKm),
    explanation: "Average distance of the stops from the route's centre.",
  });

  // Drive share, tipping included.
  const total = driveMinutes + serviceMinutes;
  const driveShare = total ? driveMinutes / total : null;
  metrics.push({
    key: "driveShare",
    label: "Drive share",
    value: driveShare,
    unit: "ratio",
    weight: SCORE_WEIGHTS.driveShare,
    score:
      driveShare === null ? 0 : linear(driveShare, ...THRESHOLDS.driveShare),
    explanation:
      "Driving (including tipping trips) as a share of the whole run.",
  });

  // Capacity use in the route's own basis.
  const capacity = routeCapacity(route, ctx.masters);
  const use = capacity.perShift ? shape.consumed / capacity.perShift : 0;
  const t = THRESHOLDS.capacityUse;
  const capScore =
    use <= t.lowFull
      ? linear(use, t.lowFull, t.lowZero)
      : use <= t.highFull
        ? 1
        : linear(use, t.highFull, t.highZero);
  metrics.push({
    key: "capacityUse",
    label: "Capacity use",
    value: use,
    unit: "ratio",
    weight: SCORE_WEIGHTS.capacityUse,
    score: capScore,
    explanation: `Planned work against the route's capacity (${capacity.unit}); 70–90% is the sweet spot.`,
  });

  // Window fit: stops that sit inside their time window (when planned).
  const timed = stops.filter((s) => s.plannedMin !== null);
  const inside = timed.filter(
    (s) =>
      (s.plannedMin as number) >= s.window[0] &&
      (s.plannedMin as number) <= s.window[1],
  ).length;
  const fit = timed.length ? inside / timed.length : null;
  metrics.push({
    key: "windowFit",
    label: "Window fit",
    value: fit,
    unit: "ratio",
    weight: SCORE_WEIGHTS.windowFit,
    score: fit ?? 0,
    explanation: "Share of stops planned inside their service window.",
  });

  // Trip efficiency: a second trip should be earned.
  const perTrip = capacity.perTrip
    ? shape.consumed / capacity.perTrip
    : stops.length;
  const tripsNeeded = Math.max(1, Math.ceil(perTrip - 0.05));
  const tripsPlanned = Math.max(1, shape.trips);
  // Full marks when the plan matches the work; a spare trip or a missing
  // one both cost (3 trips of work planned as 1 is not efficient).
  const tripEff =
    Math.min(tripsNeeded, tripsPlanned) / Math.max(tripsNeeded, tripsPlanned);
  metrics.push({
    key: "tripEfficiency",
    label: "Trip efficiency",
    value: tripsPlanned,
    unit: "count",
    weight: SCORE_WEIGHTS.tripEfficiency,
    score: stops.length ? tripEff : 0,
    explanation: `${tripsNeeded} ${tripsNeeded === 1 ? "trip" : "trips"} of work planned as ${tripsPlanned}.`,
  });

  // Penalties.
  if (use > 1)
    penalties.push({
      key: "overCapacity",
      label: "Over capacity",
      points: Math.min(20, Math.round((use - 1) * 100)),
      explanation: `Planned at ${Math.round(use * 100)}% of capacity.`,
    });
  const outside = timed.length - inside;
  if (outside > 0)
    penalties.push({
      key: "outsideWindow",
      label: "Outside window",
      points: Math.min(15, outside * 5),
      explanation: `${outside} ${outside === 1 ? "stop misses" : "stops miss"} the service window.`,
    });
  const unstaffed = shape.flags.filter((f) => f.kind === "unstaffed").length;
  if (unstaffed)
    penalties.push({
      key: "unstaffed",
      label: "Unstaffed",
      points: Math.min(20, unstaffed * 10),
      explanation: `${unstaffed} ${unstaffed === 1 ? "slot" : "slots"} not filled.`,
    });
  const subs = shape.flags.filter((f) => f.kind === "substitute").length;
  if (subs)
    penalties.push({
      key: "substitutes",
      label: "Substitutes",
      points: Math.min(6, subs * 2),
      explanation: `${subs} ${subs === 1 ? "slot" : "slots"} filled by a backup or the pool.`,
    });

  // A metric with nothing to measure (one stop, no planned times) is left
  // out of the average rather than awarded full marks.
  const measured = metrics.filter((m) => m.value !== null);
  const weightSum = measured.reduce((n, m) => n + m.weight, 0) || 1;
  const base = stops.length
    ? (measured.reduce((n, m) => n + m.weight * m.score, 0) / weightSum) * 100
    : 0;
  const penaltyPoints = penalties.reduce((n, p) => n + p.points, 0);
  const totalScore = Math.max(
    0,
    Math.min(100, Math.round(base - penaltyPoints)),
  );
  return {
    total: totalScore,
    grade: gradeOf(totalScore),
    base: Math.round(base),
    penaltyPoints,
    metrics,
    penalties,
    stops: stops.length,
    driveKm: Math.round(driveKm * 10) / 10,
    driveMinutes,
    serviceMinutes,
  };
}

/**
 * Design quality of a Route template on its busiest day in the next week
 * (or on `day`). No planned times, so window fit is neutral.
 */
export function scoreRoute(route: Route, ctx: RouteContext, day?: string) {
  const lines = route.serviceLineIds
    .map((id) => findLine(ctx.servicePoints, id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const candidates = day
    ? [day]
    : Array.from({ length: 7 }, (_, i) =>
        new Date(Date.parse("2026-09-04T00:00:00Z") + (i + 1) * 86_400_000)
          .toISOString()
          .slice(0, 10),
      ).filter((d) => routeDays(route).includes(weekdayOfDay(d)));
  let best: Shape | null = null;
  for (const d of candidates) {
    const due = lines.filter(
      (f) => f.line.contractStatus === "active" && isLineDue(f.line, d),
    );
    const stops = due
      .map((f) => stopFor(route, f.line, f.servicePoint, ctx, null))
      .filter((s): s is Stop => Boolean(s));
    const consumed = due.reduce(
      (n, f) => n + lineConsumption(route, f.line, ctx),
      0,
    );
    if (!best || consumed > best.consumed)
      best = {
        stops,
        ordered: stops,
        consumed,
        trips: route.plannedTrips,
        flags: [],
      };
  }
  return score(
    route,
    best ?? {
      stops: [],
      ordered: [],
      consumed: 0,
      trips: route.plannedTrips,
      flags: [],
    },
    ctx,
  );
}

/** How a generated instance is shaped: its real stop order, times and flags. */
export function scoreInstance(
  instance: RouteInstance,
  stops: Appointment[],
  ctx: RouteContext,
) {
  const route = ctx.routes.find((r) => r.id === instance.routeId);
  if (!route) return null;
  const ordered: Stop[] = [];
  let consumed = 0;
  for (const id of instance.appointmentIds) {
    const apt = stops.find((a) => a.id === id);
    if (!apt || apt.status === "cancelled") continue;
    const found = apt.serviceLineId
      ? findLine(ctx.servicePoints, apt.serviceLineId)
      : undefined;
    if (!found) continue;
    const planned = new Date(apt.plannedStart);
    const minutes = (planned.getUTCHours() + 4) * 60 + planned.getUTCMinutes();
    const stop = stopFor(
      route,
      found.line,
      found.servicePoint,
      ctx,
      minutes % 1440,
    );
    if (!stop) continue;
    ordered.push(stop);
    consumed += lineConsumption(route, found.line, ctx);
  }
  // Compacting runs: each tip that isn't an exchange haul ends a trip.
  const exchangeStops = new Set(
    instance.appointmentIds.filter(
      (id) =>
        stops.find((a) => a.id === id)?.workOrders[0]?.method === "exchange",
    ),
  );
  const trips = Math.max(
    1,
    instance.tippingTrips.filter(
      (t) => !exchangeStops.has(t.afterAppointmentId),
    ).length || route.plannedTrips,
  );
  return score(
    route,
    { stops: ordered, ordered, consumed, trips, flags: instance.flags },
    ctx,
  );
}
