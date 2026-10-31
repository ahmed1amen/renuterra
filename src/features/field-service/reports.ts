/**
 * The standard reports (spec section 11) and the Route's Performance tab, as
 * pure functions over mock data: visit history before the live fixtures,
 * plus the live and closed runs. Prototype-grade, like the rest of the
 * field-service rules.
 */
import type {
  Appointment,
  FailedReason,
  RescheduleReason,
  Route,
  RouteAssignment,
  RouteInstance,
  ServiceLine,
  StaffingSource,
  Technician,
  Vehicle,
  VisitRecord,
} from "@/mocks";
import { MOCK_NOW } from "@/mocks";
import { stopLoad } from "./capacity-forecast";
import {
  addLoads,
  type CapacityLimitKind,
  findLine,
  isLineDue,
  type Load,
  lineLoad,
  NO_LOAD,
  type RouteContext,
  routeCapacity,
  utilisation,
} from "./route-rules";

const TODAY = MOCK_NOW.slice(0, 10);
const DAY_MS = 86_400_000;
const dayAdd = (day: string, n: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
/** The Monday of a day's week (UTC calendar days, like the rest of the mocks). */
export function weekStart(day: string) {
  const wd = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return dayAdd(day, -((wd + 6) % 7));
}

// ── Planned vs actual by week (report 2, spec section 8.5 rule 4) ─────────

/** What one past visit actually put on the truck, from its recorded counts. */
function recordLoad(record: VisitRecord, ctx: RouteContext): Load {
  const item = ctx.items.find((i) => i.id === record.serviceItemId);
  if (!item) return NO_LOAD;
  const weight = record.weightKg ?? record.countDone * item.estKgPerUnit;
  switch (item.method) {
    case "empty-on-site": {
      const ct = ctx.containerTypes.find((c) => c.id === item.containerTypeId);
      const fill = (record.fillLevelPct ?? 80) / 100;
      return {
        ...NO_LOAD,
        volume: ((ct?.capacityLitres ?? 0) / 1000) * record.countDone * fill,
        weight,
        visits: 1,
      };
    }
    case "pump-out":
      return { ...NO_LOAD, volume: record.countDone / 1000, weight, visits: 1 };
    case "exchange":
      return {
        ...NO_LOAD,
        weight,
        visits: record.countDone,
        heaviestKg: record.countDone ? weight / record.countDone : 0,
      };
    case "packaged":
      return {
        ...NO_LOAD,
        weight,
        slots: item.countUnit === "bag" ? 0 : record.countDone,
        visits: 1,
      };
    default:
      return { ...NO_LOAD, weight, visits: 1 };
  }
}

export type WeekUtilisation = {
  /** Monday of the week. */
  week: string;
  runs: number;
  /** Average daily utilisation of the binding limit, planned and actual, %. */
  planned: number;
  actual: number;
  kind: CapacityLimitKind;
};

type DayLoads = { planned: Load; actual: Load };

/**
 * Planned vs actual utilisation per week for one Route: past visits from the
 * history, then the live runs already done. Planned uses today's fill rates
 * and quantities, so the gap is what the planner can tune (fill rate, trips).
 */
export function routeWeeklyUtilisation(
  route: Route,
  ctx: RouteContext,
  history: VisitRecord[],
  instances: RouteInstance[],
  appointments: Appointment[],
  weeks = 8,
): WeekUtilisation[] {
  const capacity = routeCapacity(route, ctx.masters);
  const lines = route.serviceLineIds
    .map((id) => findLine(ctx.servicePoints, id)?.line)
    .filter((l): l is ServiceLine => Boolean(l));
  const byDay = new Map<string, DayLoads>();
  const dayOf = (d: string) => {
    let entry = byDay.get(d);
    if (!entry) {
      const due = lines.filter(
        (l) => l.contractStatus === "active" && isLineDue(l, d),
      );
      entry = {
        planned: addLoads(due.map((l) => lineLoad(route, l, ctx))),
        actual: NO_LOAD,
      };
      byDay.set(d, entry);
    }
    return entry;
  };

  const lineIds = new Set(route.serviceLineIds);
  for (const r of history) {
    if (!lineIds.has(r.serviceLineId)) continue;
    const e = dayOf(r.date);
    e.actual = addLoads([e.actual, recordLoad(r, ctx)]);
  }
  // Live runs of this Route already behind us: their recorded work orders.
  const byId = new Map(appointments.map((a) => [a.id, a]));
  for (const i of instances) {
    if (i.routeId !== route.id || i.date >= TODAY || i.status === "cancelled")
      continue;
    const stops = i.appointmentIds
      .map((id) => byId.get(id))
      .filter((a): a is Appointment => a !== undefined);
    const e = dayOf(i.date);
    e.planned = addLoads(stops.map((a) => stopLoad(route, a, "forecast", ctx)));
    e.actual = addLoads(stops.map((a) => stopLoad(route, a, "actual", ctx)));
  }

  const firstWeek = weekStart(dayAdd(TODAY, -7 * weeks));
  const buckets = new Map<
    string,
    { p: number[]; a: number[]; kinds: CapacityLimitKind[] }
  >();
  for (const [d, loads] of byDay) {
    const w = weekStart(d);
    if (w < firstWeek || d >= TODAY) continue;
    const planned = utilisation(capacity, loads.planned);
    // Judge actual on the same limit the plan binds on.
    const kind = planned.binding.kind;
    const actual = utilisation(capacity, loads.actual).limits.find(
      (l) => l.kind === kind && !l.perLoad,
    );
    const b = buckets.get(w) ?? { p: [], a: [], kinds: [] };
    b.p.push(planned.pct);
    b.a.push(actual?.pct ?? 0);
    b.kinds.push(kind);
    buckets.set(w, b);
  }
  const avg = (xs: number[]) =>
    xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, b]) => ({
      week,
      runs: b.p.length,
      planned: avg(b.p),
      actual: avg(b.a),
      kind: b.kinds[b.kinds.length - 1] ?? capacity.limits[0].kind,
    }));
}

// ── Fill rate by weekday (Performance tab) ────────────────────────────────

const WEEKDAY_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Average reported fill level of the Route's bin lines per weekday. */
export function fillByWeekday(route: Route, history: VisitRecord[]) {
  const lineIds = new Set(route.serviceLineIds);
  const sums = WEEKDAY_LABEL.map(() => ({ total: 0, n: 0 }));
  for (const r of history) {
    if (!lineIds.has(r.serviceLineId) || r.fillLevelPct === null) continue;
    const wd = (new Date(`${r.date}T00:00:00Z`).getUTCDay() + 6) % 7;
    sums[wd].total += r.fillLevelPct;
    sums[wd].n++;
  }
  return WEEKDAY_LABEL.map((label, i) => ({
    label,
    visits: sums[i].n,
    fill: sums[i].n ? Math.round(sums[i].total / sums[i].n) : null,
  }));
}

// ── Missed and rescheduled by reason (report 3) ───────────────────────────

export type ReasonCount = {
  kind: "missed" | "rescheduled";
  reason: FailedReason | RescheduleReason;
  count: number;
};

/** Failed visits by failed reason and moved visits by reschedule reason. */
export function missedAndRescheduled(appointments: Appointment[]) {
  const counts = new Map<string, ReasonCount>();
  const bump = (kind: ReasonCount["kind"], reason: ReasonCount["reason"]) => {
    const key = `${kind}:${reason}`;
    const c = counts.get(key) ?? { kind, reason, count: 0 };
    c.count++;
    counts.set(key, c);
  };
  for (const a of appointments) {
    if (a.status === "failed" && a.failedReason) bump("missed", a.failedReason);
    if (a.rescheduled) bump("rescheduled", a.rescheduled.reason);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

// ── Substitution log (report 4) ───────────────────────────────────────────

export type SubstitutionRow = {
  routeId: string;
  runs: number;
  backup: number;
  pool: number;
  manual: number;
  /** Assigned assets skipped at generation for a failed check (R5). */
  skipped: number;
};

/** How often backups, the pool or a manual pick filled a slot, per Route. */
export function substitutionLog(instances: RouteInstance[]): SubstitutionRow[] {
  const rows = new Map<string, SubstitutionRow>();
  for (const i of instances) {
    if (!i.routeId || i.status === "cancelled") continue;
    const row = rows.get(i.routeId) ?? {
      routeId: i.routeId,
      runs: 0,
      backup: 0,
      pool: 0,
      manual: 0,
      skipped: 0,
    };
    row.runs++;
    for (const source of Object.values(i.staffing) as StaffingSource[]) {
      if (source === "backup") row.backup++;
      if (source === "pool") row.pool++;
      if (source === "manual") row.manual++;
    }
    row.skipped += i.flags.filter((f) => f.kind === "ineligible").length;
    rows.set(i.routeId, row);
  }
  return [...rows.values()].sort(
    (a, b) => b.backup + b.pool + b.manual - (a.backup + a.pool + a.manual),
  );
}

// ── Expiring certifications and permits (report 5) ────────────────────────

export type ExpiryRow = {
  assetType: "driver" | "helper" | "truck";
  assetId: string;
  name: string;
  what: string;
  expiresOn: string;
  /** Negative = already expired. */
  daysLeft: number;
  /** Routes the asset is assigned to (primary or backup). */
  routeIds: string[];
};

/** Everything expiring in the next 30 days (or already expired) that a Route depends on. */
export function expiringForRoutes(
  pros: Technician[],
  vehicles: Vehicle[],
  assignments: RouteAssignment[],
  within = 30,
): ExpiryRow[] {
  const daysLeft = (d: string) =>
    Math.round((Date.parse(d) - Date.parse(TODAY)) / DAY_MS);
  const routesOf = (assetId: string) => [
    ...new Set(
      assignments
        .filter((a) => a.assetId === assetId && a.status === "active")
        .map((a) => a.routeId),
    ),
  ];
  const rows: ExpiryRow[] = [];
  const push = (row: Omit<ExpiryRow, "daysLeft" | "routeIds">) => {
    const left = daysLeft(row.expiresOn);
    const routeIds = routesOf(row.assetId);
    if (left <= within && routeIds.length)
      rows.push({ ...row, daysLeft: left, routeIds });
  };
  for (const p of pros) {
    const assetType = p.role === "loader" ? "helper" : "driver";
    for (const s of p.skillCodes ?? [])
      if (s.expiresOn)
        push({
          assetType,
          assetId: p.id,
          name: p.name,
          what: s.code,
          expiresOn: s.expiresOn,
        });
  }
  for (const v of vehicles) {
    push({
      assetType: "truck",
      assetId: v.id,
      name: v.plate,
      what: "Registration",
      expiresOn: v.registrationExpiry,
    });
    push({
      assetType: "truck",
      assetId: v.id,
      name: v.plate,
      what: "Insurance",
      expiresOn: v.insuranceExpiry,
    });
  }
  return rows.sort((a, b) => a.daysLeft - b.daysLeft);
}
