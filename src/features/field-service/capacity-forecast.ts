/**
 * Forecast vs actual capacity for a route instance (spec sections 8.2 and
 * 8.5 rule 4), on top of the per-truck limits in `route-rules.ts`.
 *
 * Three layers per run, each in every limit's unit:
 * - worst case: every container 100% full;
 * - forecast: the fill rate the dispatcher stands by (override, else the
 *   Route's standard);
 * - actual: what completed work orders recorded.
 *
 * Prototype-grade: pure functions over mock data, no forecasting engine.
 */
import type {
  Appointment,
  CapacitySnapshot,
  Route,
  ServiceLine,
  VisitRecord,
} from "@/mocks";
import {
  addLoads,
  type Capacity,
  type CapacityLimitKind,
  findLine,
  type Load,
  NO_LOAD,
  type RouteContext,
  routeCapacity,
  type Utilisation,
  utilisation,
} from "./route-rules";

// ── Suggested fill rate (spec section 8.2) ─────────────────────────────────

export type FillObservation = { date: string; fillLevelPct: number };

export type FillSuggestion = {
  /** Recency-weighted average, rounded to 5% like the drivers report it. */
  rate: number;
  visits: number;
  min: number;
  max: number;
};

/** Visits needed before a suggestion is shown. */
export const MIN_VISITS = 4;
/** Most recent visits the suggestion looks at. */
const WINDOW = 12;
/** Each older visit counts this much less than the one after it. */
const DECAY = 0.85;

/** Every fill level reported for a line: past visits plus completed stops. */
export function fillObservations(
  lineId: string,
  history: VisitRecord[],
  appointments: Appointment[],
): FillObservation[] {
  const past = history.flatMap((v) =>
    v.serviceLineId === lineId && v.fillLevelPct !== null
      ? [{ date: v.date, fillLevelPct: v.fillLevelPct }]
      : [],
  );
  const live = appointments.flatMap((apt) =>
    apt.serviceLineId === lineId
      ? apt.workOrders.flatMap((wo) =>
          wo.method === "empty-on-site" &&
          (wo.status === "completed" || wo.status === "partial") &&
          wo.evidence.fillLevelPct !== undefined
            ? [
                {
                  date: apt.plannedStart.slice(0, 10),
                  fillLevelPct: wo.evidence.fillLevelPct,
                },
              ]
            : [],
        )
      : [],
  );
  return [...past, ...live];
}

/**
 * A suggested fill rate from the line's recent visits, or `null` with too
 * little history. Never applied by itself: the dispatcher accepts it.
 */
export function suggestFillRate(
  observations: FillObservation[],
): FillSuggestion | null {
  const recent = [...observations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, WINDOW);
  if (recent.length < MIN_VISITS) return null;
  let sum = 0;
  let weights = 0;
  recent.forEach((o, i) => {
    const w = DECAY ** i;
    sum += w * o.fillLevelPct;
    weights += w;
  });
  const pct = recent.map((o) => o.fillLevelPct);
  return {
    rate: Math.round(sum / weights / 5) / 20,
    visits: recent.length,
    min: Math.min(...pct) / 100,
    max: Math.max(...pct) / 100,
  };
}

/** The fill rate a line is planned at, and where it comes from. */
export function fillRateOf(route: Route, line: ServiceLine | undefined) {
  return line?.fillRate != null
    ? { rate: line.fillRate, source: "override" as const }
    : { rate: route.fillRate, source: "standard" as const };
}

// ── Load per stop ──────────────────────────────────────────────────────────

type Layer = "worst" | "forecast" | "actual";

const DONE = new Set(["completed", "failed"]);

/** What one stop puts on the truck, from its work orders, in one layer. */
export function stopLoad(
  route: Route,
  apt: Appointment,
  layer: Layer,
  ctx: Pick<RouteContext, "items" | "containerTypes" | "servicePoints">,
): Load {
  const line = apt.serviceLineId
    ? findLine(ctx.servicePoints, apt.serviceLineId)?.line
    : undefined;
  const planFill = layer === "worst" ? 1 : fillRateOf(route, line).rate;
  let load: Load = { ...NO_LOAD };
  let exchanged = false;
  for (const wo of apt.workOrders) {
    if (wo.status === "cancelled") continue;
    const recorded = wo.status === "completed" || wo.status === "partial";
    if (layer === "actual" && !recorded) continue;
    const item = ctx.items.find((i) => i.id === wo.serviceItemId);
    const count = layer === "actual" ? (wo.countDone ?? 0) : wo.countPlanned;
    const kgPerUnit = item?.estKgPerUnit ?? 0;
    const weight =
      layer === "actual"
        ? (wo.weightKg ?? count * kgPerUnit)
        : count * kgPerUnit;
    const part: Load = { ...NO_LOAD, weight };
    if (wo.method === "empty-on-site") {
      const ct = ctx.containerTypes.find((c) => c.id === item?.containerTypeId);
      const fill =
        layer === "actual" && wo.evidence.fillLevelPct !== undefined
          ? wo.evidence.fillLevelPct / 100
          : planFill;
      part.volume = ((ct?.capacityLitres ?? 0) / 1000) * count * fill;
    } else if (wo.method === "pump-out") {
      part.volume = count / 1000;
    } else if (wo.method === "exchange") {
      exchanged = true;
      part.visits = count;
      part.heaviestKg = count ? weight / count : 0;
    } else if (wo.method === "packaged") {
      part.slots = wo.countUnit === "bag" ? 0 : count;
    }
    load = addLoads([load, part]);
  }
  // A stop is one visit unless it exchanges containers (one visit each).
  if (!exchanged) load.visits = 1;
  return load;
}

// ── Load per instance ──────────────────────────────────────────────────────

export type InstanceLoad = {
  capacity: Capacity;
  /** The truck type the limits were calculated for. */
  truckTypeId: string | undefined;
  worst: Utilisation;
  forecast: Utilisation;
  /** What completed stops recorded so far. */
  actual: Utilisation;
  /** The forecast for the same completed stops: what `actual` is judged against. */
  forecastDone: Utilisation;
  doneStops: number;
  totalStops: number;
  /** The forecast's binding limit. */
  binding: CapacityLimitKind;
  /** Actuals 15% or more above the forecast for the stops already done. */
  runningHeavy: boolean;
};

/** Planned vs recorded load of a run, on the truck type it actually has. */
export function instanceLoad(
  template: Route,
  truckTypeId: string | undefined,
  stops: Appointment[],
  ctx: RouteContext,
): InstanceLoad {
  const capacity = routeCapacity(template, ctx.masters, truckTypeId);
  const active = stops.filter((a) => a.status !== "cancelled");
  const done = active.filter((a) => DONE.has(a.status));
  const sum = (list: Appointment[], layer: Layer) =>
    utilisation(
      capacity,
      addLoads(list.map((a) => stopLoad(template, a, layer, ctx))),
    );
  const forecast = sum(active, "forecast");
  const actual = sum(done, "actual");
  const forecastDone = sum(done, "forecast");
  const kind = forecast.binding.kind;
  const planned = forecastDone.limits.find((l) => l.kind === kind)?.consumed;
  const recorded = actual.limits.find((l) => l.kind === kind)?.consumed ?? 0;
  return {
    capacity,
    truckTypeId,
    worst: sum(active, "worst"),
    forecast,
    actual,
    forecastDone,
    doneStops: done.length,
    totalStops: active.length,
    binding: kind,
    runningHeavy: Boolean(planned && recorded >= planned * 1.15),
  };
}

/** The forecast frozen at Confirm, from the run's current load. */
export function captureSnapshot(
  load: InstanceLoad,
  template: Route,
  truckTypeId: string | undefined,
  stops: Appointment[],
  ctx: Pick<RouteContext, "servicePoints">,
  at: string,
): CapacitySnapshot {
  const fillRates: Record<string, number> = {};
  for (const apt of stops) {
    if (!apt.workOrders.some((wo) => wo.method === "empty-on-site")) continue;
    const line = apt.serviceLineId
      ? findLine(ctx.servicePoints, apt.serviceLineId)?.line
      : undefined;
    fillRates[apt.id] = fillRateOf(template, line).rate;
  }
  return {
    at,
    truckTypeId: truckTypeId ?? template.truckTypeIds[0] ?? null,
    limits: load.forecast.limits.map((limit, i) => ({
      kind: limit.kind,
      unit: limit.unit,
      capacity: limit.perLoad ? limit.perTrip : limit.perShift,
      forecast: limit.consumed,
      worstCase: load.worst.limits[i]?.consumed ?? limit.consumed,
    })),
    forecastPct: load.forecast.pct,
    fillRates,
  };
}

// ── Resolving Over capacity (R16, spec section 8.5 rule 3) ─────────────────

/** The Route as one run sees it: its trips (and visits) plus any accepted extra. */
export function withExtraTrips(route: Route, extra: number): Route {
  if (!extra) return route;
  return {
    ...route,
    plannedTrips: route.plannedTrips + extra,
    plannedVisits:
      route.plannedVisits === null ? null : route.plannedVisits + extra,
  };
}

export type RunForResolution = {
  id: string;
  name: string;
  template: Route;
  truckTypeId: string | undefined;
  stops: Appointment[];
};

export type MoveSuggestion = {
  stopIds: string[];
  toRouteId: string;
  toName: string;
  /** The receiving run's forecast before and after, %. */
  toBefore: number;
  toAfter: number;
  /** This run's forecast after the move, %. */
  after: number;
};

export type OverCapacity = {
  pct: number;
  limit: CapacityLimitKind;
  /** Stops from the end of the run that bring it to 100% or under, and where they fit best. */
  move: MoveSuggestion | null;
  /** Extra trips (cycles, on exchange routes) that bring it to 100% or under; `null` if 3 aren't enough. */
  extraTrips: number | null;
};

const OPEN = (a: Appointment) =>
  a.status !== "cancelled" && !DONE.has(a.status) && a.status !== "in-progress";

/**
 * The two ways the spec lets a dispatcher resolve Over capacity: split stops
 * to another run, or accept a second trip. Returns `null` when the run fits.
 */
export function overCapacityOptions(
  run: RunForResolution,
  candidates: RunForResolution[],
  ctx: RouteContext,
): OverCapacity | null {
  const loadOf = (r: RunForResolution, list: Appointment[]) =>
    addLoads(list.map((a) => stopLoad(r.template, a, "forecast", ctx)));
  const capacity = routeCapacity(run.template, ctx.masters, run.truckTypeId);
  const active = run.stops.filter((a) => a.status !== "cancelled");
  const current = utilisation(capacity, loadOf(run, active));
  if (current.pct <= 100) return null;

  // Extra trips: the smallest number (up to 3) that fits.
  let extraTrips: number | null = null;
  for (let n = 1; n <= 3; n++) {
    const cap = routeCapacity(
      withExtraTrips(run.template, n),
      ctx.masters,
      run.truckTypeId,
    );
    if (utilisation(cap, loadOf(run, active)).pct <= 100) {
      extraTrips = n;
      break;
    }
  }

  // Move: peel open stops off the end until the run fits.
  const movable = active.filter(OPEN);
  const moved: Appointment[] = [];
  let after = current.pct;
  for (const apt of [...movable].reverse()) {
    if (after <= 100) break;
    moved.push(apt);
    const keep = active.filter((a) => !moved.includes(a));
    after = utilisation(capacity, loadOf(run, keep)).pct;
  }
  let move: MoveSuggestion | null = null;
  if (moved.length && after <= 100) {
    let best: MoveSuggestion | null = null;
    for (const c of candidates) {
      if (
        c.id === run.id ||
        c.template.serviceType !== run.template.serviceType ||
        c.template.city !== run.template.city
      )
        continue;
      const cCap = routeCapacity(c.template, ctx.masters, c.truckTypeId);
      const cActive = c.stops.filter((a) => a.status !== "cancelled");
      const before = utilisation(cCap, loadOf(c, cActive)).pct;
      const toAfter = utilisation(
        cCap,
        addLoads([loadOf(c, cActive), loadOf(run, moved)]),
      ).pct;
      if (toAfter > 100) continue;
      if (!best || toAfter < best.toAfter)
        best = {
          stopIds: moved.map((a) => a.id),
          toRouteId: c.id,
          toName: c.name,
          toBefore: before,
          toAfter,
          after,
        };
    }
    move = best;
  }
  return { pct: current.pct, limit: current.binding.kind, move, extraTrips };
}
