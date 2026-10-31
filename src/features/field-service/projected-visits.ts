/**
 * Projected visits: when a service line will next be collected, worked out
 * from its frequency and its Route's schedule: before any instance exists.
 * Answers "when is my next collection?" on customer and appointment screens
 * without pretending the stop has been dispatched.
 */
import type { Route, RouteInstance, ServicePoint } from "@/mocks";
import { isLineDue, isRouteDue } from "./route-rules";

export type ProjectedVisit = {
  /** Dubai day key. */
  date: string;
  customerId: string;
  servicePointId: string;
  serviceLineId: string;
  routeId: string;
  routeCode: string;
  shiftId: Route["shiftId"];
  /** The generated instance for that day, once it exists. */
  instanceId: string | null;
};

function addDays(day: string, n: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Visits due from `fromDay` for `days` days, soonest first. Lines with inactive contracts are skipped. */
export function projectVisits(
  servicePoints: ServicePoint[],
  routes: Route[],
  instances: RouteInstance[],
  fromDay: string,
  days = 14,
  filter?: { customerId?: string; servicePointId?: string },
): ProjectedVisit[] {
  const out: ProjectedVisit[] = [];
  const routeOfLine = new Map<string, Route>();
  for (const r of routes)
    if (r.status === "active")
      for (const id of r.serviceLineIds) routeOfLine.set(id, r);
  for (let i = 0; i < days; i++) {
    const day = addDays(fromDay, i);
    for (const sp of servicePoints) {
      if (filter?.customerId && sp.customerId !== filter.customerId) continue;
      if (filter?.servicePointId && sp.id !== filter.servicePointId) continue;
      for (const line of sp.serviceLines) {
        if (line.contractStatus !== "active" || !isLineDue(line, day)) continue;
        const route = routeOfLine.get(line.id);
        if (!route || !isRouteDue(route, day)) continue;
        const instance = instances.find(
          (x) => x.routeId === route.id && x.date === day,
        );
        out.push({
          date: day,
          customerId: sp.customerId,
          servicePointId: sp.id,
          serviceLineId: line.id,
          routeId: route.id,
          routeCode: route.code,
          shiftId: route.shiftId,
          instanceId: instance?.id ?? null,
        });
      }
    }
  }
  return out;
}
