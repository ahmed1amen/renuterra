import { describe, expect, it } from "vitest";
import type { Appointment } from "@/mocks";
import {
  CONTAINER_TYPES,
  OPS_MASTERS,
  ROUTE_ASSIGNMENTS,
  ROUTE_INSTANCES,
  ROUTES,
  type Route,
  SERVICE_ITEMS,
  SERVICE_POINTS,
  SHIFTS,
  TECHNICIANS,
  VEHICLES,
} from "@/mocks";
import { generateInstances } from "./dispatch-engine";
import { projectVisits } from "./projected-visits";
import { deriveInstanceStatus } from "./route-instance-store";
import { optimizeInstance } from "./route-optimizer";
import {
  activationChecks,
  assignmentChecks,
  attachChecks,
  isRouteDue,
  weekdayOfDay,
} from "./route-rules";
import { gradeOf, scoreInstance, scoreRoute } from "./route-score";

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
const attachableDriverBlock = (route: Route, pro: string, day: string) =>
  assignmentChecks(
    route,
    "driver",
    pro,
    "backup",
    [weekdayOfDay(day)],
    ctx,
  ).find((c) => !c.ok && c.severity === "block");
const shiftOf = (pro: string, day: string) =>
  SHIFTS.find((s) => s.serviceProId === pro && s.date === day);

function days(from: string, count: number) {
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.parse(`${from}T00:00:00Z`) + i * 86_400_000)
      .toISOString()
      .slice(0, 10),
  );
}

describe("route schedules (spec section 10 acceptance test)", () => {
  const base = ROUTES[0];
  const make = (schedule: Route["schedule"]): Route => ({
    ...base,
    schedule,
    validFrom: "2026-11-01",
  });
  const count = (r: Route) =>
    days("2026-11-01", 14).filter((d) => isRouteDue(r, d)).length;

  it("A: daily Mon–Sat → 12 instances", () => {
    expect(
      count(make({ pattern: "weekdays", days: [], anchorDate: null })),
    ).toBe(12);
  });
  it("B: alternate days from 1 Nov → 7", () => {
    expect(
      count(make({ pattern: "alternate", days: [], anchorDate: "2026-11-01" })),
    ).toBe(7);
  });
  it("C: weekly Tuesday → 2", () => {
    expect(
      count(make({ pattern: "weekly", days: ["tue"], anchorDate: null })),
    ).toBe(2);
  });
});

describe("generateInstances", () => {
  const run = generateInstances({
    ...ctx,
    days: days("2026-09-05", 6),
    existing: ROUTE_INSTANCES,
    shiftOf,
  });

  it("creates one instance per active route that is due and has stops", () => {
    const due = days("2026-09-05", 6).reduce(
      (n, d) => n + ROUTES.filter((r) => isRouteDue(r, d)).length,
      0,
    );
    expect(run.instances.length + run.summary.nothingDue).toBe(due);
    expect(run.instances.every((i) => i.appointmentIds.length > 0)).toBe(true);
    expect(run.instances.every((i) => i.routeId?.startsWith("rt_"))).toBe(true);
  });

  it("never dispatches an assigned driver who fails a blocking check (R5)", () => {
    for (const i of run.instances) {
      const route = ROUTES.find((r) => r.id === i.routeId);
      if (!route || !i.primaryServiceProId) continue;
      const failed = attachableDriverBlock(
        route,
        i.primaryServiceProId,
        i.date,
      );
      expect(failed, `${i.id} ${i.primaryServiceProId}`).toBeUndefined();
    }
    // tech_9's HGV licence expired on 15 Aug: wherever they're assigned, the
    // engine skips them and says why.
    const skipped = run.instances.flatMap((i) =>
      i.flags.filter((f) => f.kind === "ineligible" && f.assetId === "tech_9"),
    );
    expect(skipped.length).toBeGreaterThan(0);
  });

  it("never double-books a truck or person in the same day and shift (R6)", () => {
    const seen = new Set<string>();
    for (const i of run.instances) {
      for (const id of [
        i.vehicleId,
        i.primaryServiceProId,
        ...i.crew.map((c) => c.serviceProId),
      ]) {
        if (!id) continue;
        const key = `${i.date}|${i.shiftId}|${id}`;
        expect(seen.has(key), key).toBe(false);
        seen.add(key);
      }
    }
  });

  it("marks an instance unstaffed exactly when a slot is empty", () => {
    for (const i of run.instances) {
      const empty =
        !i.vehicleId ||
        !i.primaryServiceProId ||
        i.crew.length < i.helpersRequired;
      expect(i.status === "unstaffed").toBe(empty);
    }
  });

  it("skips lines whose contract isn't active (R15)", () => {
    const stopsOnHold = run.appointments.filter(
      (a) => a.serviceLineId === "sp_13_l1",
    );
    expect(stopsOnHold).toHaveLength(0);
    expect(
      run.instances.some((i) =>
        i.flags.some(
          (f) =>
            f.kind === "contract-skipped" && f.serviceLineId === "sp_13_l1",
        ),
      ),
    ).toBe(true);
  });

  it("does not regenerate a day that already has instances", () => {
    const again = generateInstances({
      ...ctx,
      days: ["2026-09-04"],
      existing: ROUTE_INSTANCES,
      shiftOf,
    });
    expect(again.summary.alreadyGenerated).toBe(
      ROUTES.filter((r) =>
        ROUTE_INSTANCES.some(
          (i) => i.routeId === r.id && i.date === "2026-09-04",
        ),
      ).length,
    );
    expect(
      again.instances.every((i) => !ROUTE_INSTANCES.some((x) => x.id === i.id)),
    ).toBe(true);
  });
});

describe("route rules", () => {
  it("blocks activating the draft route without a primary driver (R3)", () => {
    const draft = ROUTES.find((r) => r.status === "draft") as Route;
    const r3 = activationChecks(draft, ctx).find((c) => c.rule === "R3");
    expect(r3?.ok).toBe(false);
  });

  it("blocks attaching a Sharjah site to a Dubai route (R7)", () => {
    const dubai = ROUTES[0];
    const sharjah = SERVICE_POINTS.find((s) => s.emirate === "Sharjah");
    const line = sharjah?.serviceLines[0];
    if (!sharjah || !line) throw new Error("fixture");
    const r7 = attachChecks(dubai, line, sharjah, ctx).find(
      (c) => c.rule === "R7",
    );
    expect(r7?.ok).toBe(false);
  });
});

describe("route scoring and optimisation", () => {
  it("scores every active route 0..100 with a grade and a breakdown", () => {
    for (const route of ROUTES.filter((r) => r.status === "active")) {
      const s = scoreRoute(route, ctx);
      expect(s.total).toBeGreaterThanOrEqual(0);
      expect(s.total).toBeLessThanOrEqual(100);
      expect(s.metrics.map((m) => m.key)).toEqual([
        "neighbourhood",
        "tightness",
        "driveShare",
        "capacityUse",
        "windowFit",
        "tripEfficiency",
      ]);
      expect(s.grade).toBe(gradeOf(s.total));
    }
  });

  it("penalises an unstaffed instance", () => {
    const run = generateInstances({
      ...ctx,
      days: ["2026-09-05"],
      existing: ROUTE_INSTANCES,
      shiftOf,
    });
    const unstaffed = run.instances.find((i) => i.status === "unstaffed");
    if (!unstaffed) throw new Error("fixture: expected an unstaffed instance");
    const s = scoreInstance(unstaffed, run.appointments, ctx);
    expect(s?.penalties.some((p) => p.key === "unstaffed")).toBe(true);
  });

  it("optimising never lowers the score and keeps every stop", () => {
    const run = generateInstances({
      ...ctx,
      days: ["2026-09-07"],
      existing: ROUTE_INSTANCES,
      shiftOf,
    });
    for (const instance of run.instances) {
      // Scramble the order so the optimiser has work to do.
      const shuffled = {
        ...instance,
        appointmentIds: [...instance.appointmentIds].reverse(),
      };
      const result = optimizeInstance(shuffled, run.appointments, ctx);
      expect(new Set(result.instance.appointmentIds)).toEqual(
        new Set(instance.appointmentIds),
      );
      if (!result.unchanged && result.before && result.after)
        expect(result.after.total).toBeGreaterThanOrEqual(
          result.before.total - 1,
        );
    }
  });

  it("projects the next collection from the route schedule", () => {
    const visits = projectVisits(
      SERVICE_POINTS,
      ROUTES,
      ROUTE_INSTANCES,
      "2026-09-05",
      7,
      {
        servicePointId: "sp_01",
      },
    );
    expect(visits.length).toBeGreaterThan(0);
    // Palm Jumeirah: general + food on REL-001, recyclables on REL-002.
    expect(new Set(visits.map((v) => v.routeCode))).toEqual(
      new Set(["RWC-DXB-REL-001", "RWC-DXB-REL-002"]),
    );
    expect(visits.every((v) => v.instanceId === null)).toBe(true); // not generated yet
  });

  it("derives instance status from its stops", () => {
    const base = ROUTE_INSTANCES[0];
    const stops: { id: string; status: Appointment["status"] }[] =
      base.appointmentIds.map((id) => ({ id, status: "completed" }));
    expect(deriveInstanceStatus({ ...base, status: "confirmed" }, stops)).toBe(
      "completed",
    );
    stops[0] = { ...stops[0], status: "failed" };
    expect(deriveInstanceStatus({ ...base, status: "confirmed" }, stops)).toBe(
      "partial",
    );
    const open = base.appointmentIds.map((id) => ({
      id,
      status: "scheduled" as const,
    }));
    expect(deriveInstanceStatus({ ...base, status: "confirmed" }, open)).toBe(
      "confirmed",
    );
  });
});
