/**
 * The Route model's business rules (docs/product/specs/route-definition.md,
 * §4.2, §5, §8, §9) as pure functions, so the Routes screens and the dispatch
 * engine judge a route the same way.
 *
 * Prototype-grade: enough to make every rule visible and clickable, not a
 * production validator — the real checks belong in the backend (spec §9).
 */
import type {
  CityCode,
  ContainerType,
  DayOfWeek,
  Emirate,
  OpsMasters,
  Route,
  RouteAssignment,
  ServiceItem,
  ServiceLine,
  ServicePoint,
  ServiceTypeCode,
  Technician,
  Vehicle,
} from "@/mocks";
import { MOCK_NOW } from "@/mocks";

export type RouteContext = {
  masters: OpsMasters;
  routes: Route[];
  assignments: RouteAssignment[];
  vehicles: Vehicle[];
  pros: Technician[];
  servicePoints: ServicePoint[];
  items: ServiceItem[];
  containerTypes: ContainerType[];
};

export type RuleCheck = {
  /** Spec rule id, e.g. `R7`, or the §4.2 check number. */
  rule: string;
  label: string;
  ok: boolean;
  /** `warn` passes with a caution; `block` stops the action. */
  severity: "block" | "warn";
  detail?: string;
};

const WEEK: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const weekdayOfDay = (day: string) =>
  WEEK[new Date(`${day}T00:00:00Z`).getUTCDay()];

export const CITY_OF_EMIRATE: Record<Emirate, CityCode> = {
  Dubai: "DXB",
  Sharjah: "SHJ",
  Ajman: "AJM",
  "Umm Al Quwain": "UAQ",
};

const TODAY = MOCK_NOW.slice(0, 10);

// ── Schedules ──────────────────────────────────────────────────────────────

/** The weekdays a route runs on (alternate days run on a 2-day cycle). */
export function routeDays(route: Route): DayOfWeek[] {
  const { pattern, days } = route.schedule;
  if (pattern === "daily" || pattern === "alternate") return [...WEEK];
  if (pattern === "weekdays") return WEEK.filter((d) => d !== "sun");
  return days;
}

/** Is an instance due on `day` (spec §6.2)? Also checks status and dates (R14). */
export function isRouteDue(route: Route, day: string) {
  if (route.status !== "active") return false;
  if (day < route.validFrom || (route.validTo && day > route.validTo))
    return false;
  if (route.schedule.pattern === "alternate") {
    const anchor = route.schedule.anchorDate ?? route.validFrom;
    const diff = Math.round(
      (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${anchor}T00:00:00Z`)) /
        86_400_000,
    );
    return diff % 2 === 0;
  }
  return routeDays(route).includes(weekdayOfDay(day));
}

/** Is a service line due on `day` under its own frequency (§6.2 rule 7)? */
export function isLineDue(line: ServiceLine, day: string) {
  const wd = weekdayOfDay(day);
  if (line.frequency === "daily") return line.days.includes(wd);
  if (line.frequency === "weekly") return line.days.includes(wd);
  if (line.frequency === "monthly")
    return line.days.includes(wd) && Number(day.slice(8, 10)) <= 7;
  return false; // on-call lines only run as ad-hoc jobs
}

// ── Compatibility ──────────────────────────────────────────────────────────

/** Which service types can perform an item, from its handling method. */
export function serviceTypesFor(item: ServiceItem): ServiceTypeCode[] {
  switch (item.method) {
    case "empty-on-site":
      return ["REL", "COMP"];
    case "exchange":
      return item.code.startsWith("SKIP") ? ["SKIP"] : ["HOOK"];
    case "packaged":
    case "destruction":
      return item.stream === "medical" ? ["MED"] : ["HAZ"];
    case "pump-out":
      return ["WWT", "HAZ"];
    case "logistics":
      return ["SKIP", "HOOK"];
  }
}

/** R12: medical alone, hazardous never with non-hazardous, co-collection only where allowed. */
export function streamMixCheck(route: Route, masters: OpsMasters): RuleCheck {
  const codes = route.wasteCodes;
  const groupOf = (c: string) =>
    masters.wasteCodes.find((w) => w.code === c)?.group;
  const groups = new Set(codes.map(groupOf));
  let detail: string | undefined;
  if (groups.has("medical") && codes.length > 1)
    detail = "Medical waste can't share a route with any other stream.";
  else if (
    groups.has("hazardous") &&
    [...groups].some((g) => g !== "hazardous")
  )
    detail = "Hazardous streams can't share a route with non-hazardous ones.";
  else if (route.coCollection && codes.length > 1) {
    const bad = codes.find((c) =>
      codes.some(
        (o) =>
          o !== c &&
          !masters.wasteCodes
            .find((w) => w.code === c)
            ?.coCollectWith.includes(o),
      ),
    );
    if (bad)
      detail = `${bad} can't be co-collected with the other streams — turn co-collection off to run separate trips.`;
  }
  return {
    rule: "R12",
    label: "Streams can share this route",
    ok: !detail,
    severity: "block",
    detail,
  };
}

// ── Capacity (§8) ──────────────────────────────────────────────────────────

export type Capacity = {
  basis: "volume" | "visits" | "weight";
  unit: "m³" | "visits" | "kg";
  perTrip: number;
  perShift: number;
};

/** Route capacity per shift for a truck type (the dispatched one, or the required one). */
export function routeCapacity(
  route: Route,
  masters: OpsMasters,
  truckTypeId = route.truckTypeIds[0],
): Capacity {
  const tt = masters.truckTypes.find((t) => t.id === truckTypeId);
  const basis = tt?.capacityBasis ?? "weight";
  if (basis === "volume") {
    const perTrip = (tt?.bodyM3 ?? 0) * (tt?.compressionRatio ?? 1);
    return {
      basis,
      unit: "m³",
      perTrip,
      perShift: perTrip * route.plannedTrips,
    };
  }
  if (basis === "visits") {
    const visits = route.plannedVisits ?? 6;
    return { basis, unit: "visits", perTrip: 1, perShift: visits };
  }
  const perTrip = tt?.payloadKg ?? 0;
  return { basis, unit: "kg", perTrip, perShift: perTrip * route.plannedTrips };
}

/** What one visit of a line consumes, in the route's capacity unit (§8.2–8.3). */
export function lineConsumption(
  route: Route,
  line: ServiceLine,
  ctx: Pick<RouteContext, "items" | "containerTypes" | "masters">,
) {
  const item = ctx.items.find((i) => i.id === line.serviceItemId);
  const basis = routeCapacity(route, ctx.masters).basis;
  if (!item) return 0;
  if (basis === "visits") return item.method === "exchange" ? line.quantity : 1;
  if (basis === "volume") {
    if (item.countUnit === "litre") return line.quantity / 1000;
    const ct = ctx.containerTypes.find((c) => c.id === item.containerTypeId);
    const fill = line.fillRate ?? route.fillRate;
    return ((ct?.capacityLitres ?? 0) / 1000) * line.quantity * fill;
  }
  return line.quantity * item.estKgPerUnit;
}

export function findLine(servicePoints: ServicePoint[], id: string) {
  for (const sp of servicePoints) {
    const line = sp.serviceLines.find((l) => l.id === id);
    if (line) return { line, servicePoint: sp };
  }
  return undefined;
}

/**
 * Planned utilisation on the route's busiest day over the next week (R11 is
 * checked per due day, §8.5 rule 2). `extraLine` previews an attachment.
 */
export function plannedUtilisation(
  route: Route,
  ctx: RouteContext,
  extraLine?: ServiceLine,
  truckTypeId?: string,
) {
  const capacity = routeCapacity(route, ctx.masters, truckTypeId);
  const lines = [
    ...route.serviceLineIds
      .map((id) => findLine(ctx.servicePoints, id)?.line)
      .filter((l): l is ServiceLine => Boolean(l)),
    ...(extraLine ? [extraLine] : []),
  ];
  let peak = 0;
  let peakDay = TODAY;
  for (let i = 1; i <= 7; i++) {
    const day = new Date(Date.parse(`${TODAY}T00:00:00Z`) + i * 86_400_000)
      .toISOString()
      .slice(0, 10);
    if (!routeDays(route).includes(weekdayOfDay(day))) continue;
    const used = lines
      .filter((l) => l.contractStatus === "active" && isLineDue(l, day))
      .reduce((sum, l) => sum + lineConsumption(route, l, ctx), 0);
    if (used > peak) {
      peak = used;
      peakDay = day;
    }
  }
  return {
    capacity,
    consumed: peak,
    day: peakDay,
    pct: capacity.perShift ? Math.round((peak / capacity.perShift) * 100) : 0,
  };
}

// ── Attach a service line (§5 rules, R7–R11) ───────────────────────────────

export function attachChecks(
  route: Route,
  line: ServiceLine,
  servicePoint: ServicePoint,
  ctx: RouteContext,
): RuleCheck[] {
  const item = ctx.items.find((i) => i.id === line.serviceItemId);
  const city = CITY_OF_EMIRATE[servicePoint.emirate];
  const owner = ctx.routes.find(
    (r) =>
      r.id !== route.id &&
      r.status === "active" &&
      r.serviceLineIds.includes(line.id),
  );
  const routeWeek = routeDays(route);
  const missingDays =
    line.frequency === "on-call"
      ? []
      : line.days.filter((d) => !routeWeek.includes(d));
  const util = plannedUtilisation(route, ctx, line);
  return [
    {
      rule: "R7",
      label: "Same city",
      ok: city === route.city,
      severity: "block",
      detail:
        city === route.city
          ? undefined
          : `The site is in ${city}; this route serves ${route.city} only.`,
    },
    {
      rule: "R8",
      label: "Stream accepted and service type fits",
      ok:
        Boolean(item?.wasteCode && route.wasteCodes.includes(item.wasteCode)) &&
        Boolean(item && serviceTypesFor(item).includes(route.serviceType)),
      severity: "block",
      detail: !item
        ? "Unknown service item."
        : !item.wasteCode || !route.wasteCodes.includes(item.wasteCode)
          ? `${item.wasteCode ?? "No waste code"} isn't one of this route's streams (${route.wasteCodes.join(", ")}).`
          : !serviceTypesFor(item).includes(route.serviceType)
            ? `${item.code} needs a ${serviceTypesFor(item).join(" or ")} route.`
            : undefined,
    },
    {
      rule: "R9",
      label: "Frequency fits the schedule",
      ok: missingDays.length === 0,
      severity: "block",
      detail: missingDays.length
        ? `The route doesn't run on ${missingDays.join(", ")}.`
        : undefined,
    },
    {
      rule: "R10",
      label: "Not on another active route",
      ok: !owner,
      severity: "warn",
      detail: owner
        ? `Attaching transfers it from ${owner.code} from today.`
        : undefined,
    },
    {
      rule: "R11",
      label: "Capacity",
      ok: util.pct <= 90,
      severity: util.pct > 100 ? "block" : "warn",
      detail: `${util.pct}% planned on the busiest day (${formatAmount(util.consumed, util.capacity.unit)} of ${formatAmount(util.capacity.perShift, util.capacity.unit)}).`,
    },
  ];
}

export function formatAmount(value: number, unit: Capacity["unit"]) {
  const n = unit === "kg" ? Math.round(value) : Math.round(value * 10) / 10;
  return `${n.toLocaleString("en-AE")} ${unit}`;
}

// ── Assign an asset (§4.2 checks 1–8, R4–R6) ───────────────────────────────

const HEAVY = new Set([
  "REL-07",
  "REL-14",
  "REL-25",
  "SKP-STD",
  "HOOK-STD",
  "BOX-HAZ",
  "TNK-VAC",
  "FLT",
]);

function inDate(expiresOn: string | null) {
  return !expiresOn || expiresOn >= TODAY;
}
function expiringSoon(expiresOn: string | null) {
  if (!expiresOn) return false;
  const days = (Date.parse(expiresOn) - Date.parse(TODAY)) / 86_400_000;
  return days >= 0 && days <= 30;
}

export function assignmentChecks(
  route: Route,
  assetType: RouteAssignment["assetType"],
  assetId: string,
  role: RouteAssignment["role"],
  days: DayOfWeek[],
  ctx: RouteContext,
): RuleCheck[] {
  const checks: RuleCheck[] = [];
  const clash = () => {
    if (role !== "primary") return undefined;
    const mine = days.length ? days : routeDays(route);
    return ctx.assignments.find((a) => {
      if (
        a.assetId !== assetId ||
        a.role !== "primary" ||
        a.status !== "active"
      )
        return false;
      const other = ctx.routes.find((r) => r.id === a.routeId);
      if (!other || other.id === route.id || other.status === "retired")
        return false;
      if (other.shiftId !== route.shiftId) return false;
      const theirs = a.days.length ? a.days : routeDays(other);
      return mine.some((d) => theirs.includes(d));
    });
  };

  if (assetType === "truck") {
    const v = ctx.vehicles.find((x) => x.id === assetId);
    if (!v) return [];
    checks.push(
      {
        rule: "R4",
        label: "Truck type matches",
        ok: route.truckTypeIds.includes(v.truckTypeId),
        severity: "block",
        detail: route.truckTypeIds.includes(v.truckTypeId)
          ? undefined
          : `${v.truckTypeId} isn't ${route.truckTypeIds.join(" / ")}.`,
      },
      {
        rule: "4.2.2",
        label: "Registered to the entity or in the pool",
        ok: v.entity === null || v.entity === route.entity,
        severity: "block",
        detail:
          v.entity && v.entity !== route.entity
            ? `Registered to ${v.entity}.`
            : undefined,
      },
      {
        rule: "4.2.3",
        label: "Permits, registration and insurance",
        ok:
          v.permits.includes(route.city) &&
          inDate(v.registrationExpiry) &&
          inDate(v.insuranceExpiry),
        severity: expiringSoon(v.registrationExpiry) ? "warn" : "block",
        detail: !v.permits.includes(route.city)
          ? `No permit for ${route.city}.`
          : expiringSoon(v.registrationExpiry)
            ? `Registration expires ${v.registrationExpiry}.`
            : undefined,
      },
    );
  } else {
    const p = ctx.pros.find((x) => x.id === assetId);
    if (!p) return [];
    const codes = p.skillCodes ?? [];
    const needs =
      assetType === "driver"
        ? route.requiredSkills
        : route.requiredSkills.filter((s) => s.startsWith("CITY-"));
    const missing = needs.filter(
      (s) => !codes.some((c) => c.code === s && inDate(c.expiresOn)),
    );
    const soon = codes.filter(
      (c) => needs.includes(c.code) && expiringSoon(c.expiresOn),
    );
    const night = route.shiftId === "NIGHT";
    checks.push({
      rule: "R5",
      label:
        assetType === "driver"
          ? "Holds every required skill, in date"
          : "Eligible for the city",
      ok: missing.length === 0 && soon.length === 0,
      severity: missing.length ? "block" : "warn",
      detail: missing.length
        ? `Missing or expired: ${missing.join(", ")}.`
        : soon.length
          ? `${soon.map((c) => c.code).join(", ")} expires within 30 days.`
          : undefined,
    });
    if (assetType === "driver") {
      const heavy = route.truckTypeIds.some((t) => HEAVY.has(t));
      const hgv = codes.some(
        (c) => c.code === "LIC-HGV" && inDate(c.expiresOn),
      );
      checks.push({
        rule: "4.2.5",
        label: "Licence covers the truck",
        ok: !heavy || hgv,
        severity: "block",
        detail: heavy && !hgv ? "Needs a heavy goods licence." : undefined,
      });
    }
    checks.push({
      rule: "4.2.7",
      label: "Shift pattern allows the route's shift",
      ok: !night || codes.some((c) => c.code === "SHIFT-NIGHT"),
      severity: "block",
      detail:
        night && !codes.some((c) => c.code === "SHIFT-NIGHT")
          ? "Not cleared for night shift."
          : undefined,
    });
  }
  const other = clash();
  const otherRoute = other && ctx.routes.find((r) => r.id === other.routeId);
  checks.push({
    rule: "R6",
    label: "Not primary on another route in the same shift",
    ok: !other,
    severity: "block",
    detail: otherRoute
      ? `Already primary on ${otherRoute.code} on overlapping days.`
      : undefined,
  });
  return checks;
}

// ── Activate (R2, R3, R12, R21, R22) ───────────────────────────────────────

export function activationChecks(route: Route, ctx: RouteContext): RuleCheck[] {
  const shift = ctx.masters.shifts.find((s) => s.id === route.shiftId);
  const insideShift = (() => {
    if (!shift) return false;
    if (shift.id === "NIGHT") return route.startTime >= shift.startTime;
    return route.startTime >= shift.startTime && route.endTime <= shift.endTime;
  })();
  const missing = [
    !route.entity && "entity",
    !route.serviceType && "service type",
    !route.city && "city",
    !route.truckTypeIds.length && "truck type",
    !route.requiredSkills.length && "driver skills",
    !route.wasteCodes.length && "waste streams",
    route.schedule.pattern !== "daily" &&
      route.schedule.pattern !== "weekdays" &&
      route.schedule.pattern !== "alternate" &&
      !route.schedule.days.length &&
      "schedule days",
    !route.shiftId && "shift",
    !route.depotId && "start depot",
    !route.disposalSiteIds.length && "disposal site",
    !route.ownerId && "owner",
  ].filter(Boolean) as string[];
  const mine = ctx.assignments.filter(
    (a) =>
      a.routeId === route.id && a.status === "active" && a.role === "primary",
  );
  const hasTruck = mine.some((a) => a.assetType === "truck");
  const hasDriver = mine.some((a) => a.assetType === "driver");
  return [
    {
      rule: "R2",
      label: "Every required attribute is filled",
      ok: missing.length === 0,
      severity: "block",
      detail: missing.length ? `Missing: ${missing.join(", ")}.` : undefined,
    },
    {
      rule: "R3",
      label: "A primary truck and a primary driver are assigned",
      ok: hasTruck && hasDriver,
      severity: "block",
      detail:
        hasTruck && hasDriver
          ? undefined
          : `No primary ${[!hasTruck && "truck", !hasDriver && "driver"].filter(Boolean).join(" or ")}.`,
    },
    {
      rule: "R21",
      label: "Helper count is set",
      ok: route.helpers >= 0 && Number.isInteger(route.helpers),
      severity: "block",
    },
    {
      rule: "R22",
      label: "Planned times sit inside the shift window",
      ok: insideShift,
      severity: "block",
      detail: insideShift
        ? undefined
        : `${shift?.name ?? "Shift"} runs ${shift?.startTime}–${shift?.endTime}.`,
    },
    streamMixCheck(route, ctx.masters),
  ];
}

/** `[Entity]-[City]-[ServiceType]-[NNN]`, the next free number (R1). */
export function nextRouteCode(
  routes: Route[],
  entity: string,
  city: string,
  serviceType: string,
) {
  const prefix = `${entity}-${city}-${serviceType}-`;
  const used = routes
    .filter((r) => r.code.startsWith(prefix))
    .map((r) => Number(r.code.slice(prefix.length)) || 0);
  return `${prefix}${String(Math.max(0, ...used) + 1).padStart(3, "0")}`;
}
