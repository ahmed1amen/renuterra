import { describe, expect, it } from "vitest";
import {
  APPOINTMENTS,
  type Appointment,
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
  captureSnapshot,
  fillObservations,
  instanceLoad,
  overCapacityOptions,
  stopLoad,
  suggestFillRate,
} from "./capacity-forecast";
import { routeCapacity, utilisation } from "./route-rules";

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
const route = (code: string) => {
  const r = ROUTES.find((x) => x.code === code);
  if (!r) throw new Error(code);
  return r;
};

describe("truck limits (operations-flow section 3.6)", () => {
  it("a REL has volume and payload; a medical box truck payload and slots", () => {
    const rel = routeCapacity(route("RWC-DXB-REL-001"), OPS_MASTERS);
    expect(rel.limits.map((l) => l.kind)).toEqual(["volume", "weight"]);
    const med = routeCapacity(route("GGM-DXB-MED-001"), OPS_MASTERS);
    expect(med.limits.map((l) => l.kind)).toEqual(["weight", "slots"]);
  });

  it("an exchange truck's payload only binds once one container is over it", () => {
    const hook = routeCapacity(route("RWC-DXB-HOOK-001"), OPS_MASTERS);
    const load = {
      volume: 0,
      weight: 0,
      slots: 0,
      visits: 3,
      heaviestKg: 9000,
    };
    expect(utilisation(hook, load).binding.kind).toBe("visits");
    const heavy = utilisation(hook, { ...load, heaviestKg: 18_000 });
    expect(heavy.binding.perLoad).toBe(true);
    expect(heavy.pct).toBeGreaterThan(100);
  });
});

describe("suggested fill rate (spec section 8.2)", () => {
  it("needs at least four visits", () => {
    expect(
      suggestFillRate([
        { date: "2026-08-01", fillLevelPct: 80 },
        { date: "2026-08-02", fillLevelPct: 80 },
        { date: "2026-08-03", fillLevelPct: 80 },
      ]),
    ).toBeNull();
  });

  it("weights recent visits more and rounds to 5%", () => {
    const old = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-07-${String(i + 10).padStart(2, "0")}`,
      fillLevelPct: 50,
    }));
    const recent = Array.from({ length: 4 }, (_, i) => ({
      date: `2026-08-${String(i + 10).padStart(2, "0")}`,
      fillLevelPct: 90,
    }));
    const s = suggestFillRate([...old, ...recent]);
    expect(s?.visits).toBe(12);
    // A plain average would be 63%; recency pulls it toward 90%.
    expect(s?.rate).toBeGreaterThanOrEqual(0.7);
    expect(Math.round((s?.rate ?? 0) * 100) % 5).toBe(0);
  });

  it("finds that sp_01_l1 runs well under its 95% override", () => {
    const s = suggestFillRate(
      fillObservations("sp_01_l1", VISIT_HISTORY, APPOINTMENTS),
    );
    expect(s).not.toBeNull();
    expect(s?.rate).toBeLessThan(0.8);
  });
});

describe("instance load: worst case, forecast, actual", () => {
  const instance = ROUTE_INSTANCES.find((r) =>
    r.appointmentIds.some(
      (id) =>
        APPOINTMENTS.find((a) => a.id === id)?.status === "completed" &&
        APPOINTMENTS.find((a) => a.id === id)?.workOrders.some(
          (wo) => wo.method === "empty-on-site",
        ),
    ),
  );
  const template = ROUTES.find((r) => r.id === instance?.routeId);
  const stops = (instance?.appointmentIds ?? [])
    .map((id) => APPOINTMENTS.find((a) => a.id === id))
    .filter((a): a is Appointment => a !== undefined);

  it("orders the layers: worst case ≥ forecast, actual only from done stops", () => {
    if (!template) throw new Error("no completed REL instance in fixtures");
    const load = instanceLoad(template, undefined, stops, ctx);
    const vol = (u: typeof load.forecast) =>
      u.limits.find((l) => l.kind === "volume")?.consumed ?? 0;
    expect(vol(load.worst)).toBeGreaterThanOrEqual(vol(load.forecast));
    expect(load.doneStops).toBeGreaterThan(0);
    expect(vol(load.actual)).toBeGreaterThan(0);
  });

  it("a stop with nothing recorded has no actual load", () => {
    if (!template) throw new Error("no template");
    const open = stops.find((a) => a.status === "scheduled") ?? stops[0];
    const blank: Appointment = {
      ...open,
      workOrders: open.workOrders.map((wo) => ({ ...wo, status: "scheduled" })),
    };
    const actual = stopLoad(template, blank, "actual", ctx);
    expect(actual.volume + actual.weight).toBe(0);
  });

  it("the snapshot freezes every limit and the fill rate per stop", () => {
    if (!template) throw new Error("no template");
    const load = instanceLoad(template, undefined, stops, ctx);
    const snap = captureSnapshot(load, template, undefined, stops, ctx, "t");
    expect(snap.limits.map((l) => l.kind)).toEqual(
      load.capacity.limits.map((l) => l.kind),
    );
    expect(snap.forecastPct).toBe(load.forecast.pct);
    expect(Object.keys(snap.fillRates).length).toBeGreaterThan(0);
  });
});

describe("Over capacity: split or extra trip (R16)", () => {
  const hook = route("RWC-DXB-HOOK-001");
  // Three open exchange stops on a run planned for one visit.
  const stops = APPOINTMENTS.filter((a) =>
    a.workOrders.some(
      (wo) => wo.method === "exchange" && wo.countPlanned === 1,
    ),
  )
    .slice(0, 3)
    .map((a) => ({ ...a, status: "scheduled" as const }));
  const run = {
    id: "run_a",
    name: "Run A",
    template: { ...hook, plannedVisits: 1 },
    truckTypeId: undefined,
    stops,
  };
  const roomy = {
    id: "run_b",
    name: "Run B",
    template: { ...hook, plannedVisits: 6 },
    truckTypeId: undefined,
    stops: [],
  };

  it("suggests moving stops off the end to the run with room", () => {
    const over = overCapacityOptions(run, [run, roomy], ctx);
    expect(over?.pct).toBe(300);
    expect(over?.limit).toBe("visits");
    expect(over?.move?.toRouteId).toBe("run_b");
    expect(over?.move?.stopIds).toEqual([stops[2].id, stops[1].id]);
    expect(over?.move?.after).toBeLessThanOrEqual(100);
  });

  it("finds the smallest number of extra trips that fits", () => {
    expect(overCapacityOptions(run, [], ctx)?.extraTrips).toBe(2);
    expect(overCapacityOptions(run, [], ctx)?.move).toBeNull();
  });

  it("returns null when the run fits", () => {
    expect(overCapacityOptions(roomy, [], ctx)).toBeNull();
  });
});
