import { describe, expect, it } from "vitest";
import {
  APPOINTMENTS,
  CONTAINER_TYPES,
  OPS_MASTERS,
  ROUTE_ASSIGNMENTS,
  ROUTE_INSTANCES,
  ROUTES,
  SERVICE_ITEMS,
  SERVICE_POINTS,
  TECHNICIANS,
  VEHICLES,
  VISIT_HISTORY,
} from "@/mocks";
import {
  expiringForRoutes,
  fillByWeekday,
  missedAndRescheduled,
  routeWeeklyUtilisation,
  substitutionLog,
  weekStart,
} from "./reports";

const ctx = {
  masters: OPS_MASTERS,
  routes: ROUTES,
  assignments: ROUTE_ASSIGNMENTS,
  vehicles: VEHICLES,
  pros: TECHNICIANS,
  servicePoints: SERVICE_POINTS,
  items: SERVICE_ITEMS,
  containerTypes: CONTAINER_TYPES,
};

describe("reports (spec section 11)", () => {
  it("weeks start on Monday", () => {
    expect(weekStart("2026-09-04")).toBe("2026-08-31"); // Friday → Monday
    expect(weekStart("2026-08-31")).toBe("2026-08-31");
  });

  it("planned vs actual covers past weeks only, with runs and a binding limit", () => {
    const weeks = routeWeeklyUtilisation(
      ROUTES[0],
      ctx,
      VISIT_HISTORY,
      ROUTE_INSTANCES,
      APPOINTMENTS,
    );
    expect(weeks.length).toBeGreaterThan(4);
    expect(weeks.every((w) => w.runs > 0 && w.week < "2026-09-04")).toBe(true);
    // Full history: plan and reality stay close on a steady route.
    for (const w of weeks.slice(0, -1))
      expect(Math.abs(w.actual - w.planned)).toBeLessThanOrEqual(5);
  });

  it("fill by weekday averages only bin visits", () => {
    const days = fillByWeekday(ROUTES[0], VISIT_HISTORY);
    expect(days).toHaveLength(7);
    expect(days.some((d) => d.fill !== null)).toBe(true);
  });

  it("counts failed visits by reason and finds substitutions", () => {
    const reasons = missedAndRescheduled(APPOINTMENTS);
    expect(reasons.reduce((n, r) => n + r.count, 0)).toBe(
      APPOINTMENTS.filter((a) => a.status === "failed").length,
    );
    expect(substitutionLog(ROUTE_INSTANCES).some((r) => r.backup > 0)).toBe(
      true,
    );
  });

  it("lists the expired HGV licence with the route it affects", () => {
    const rows = expiringForRoutes(TECHNICIANS, VEHICLES, ROUTE_ASSIGNMENTS);
    const samuel = rows.find((r) => r.assetId === "tech_9");
    expect(samuel?.daysLeft).toBeLessThan(0);
    expect(samuel?.routeIds).toContain("rt_09");
    expect(rows.every((r) => r.daysLeft <= 30 && r.routeIds.length > 0)).toBe(
      true,
    );
  });
});
