"use client";

import { useMemo } from "react";
import {
  assignmentChecks,
  instanceLoad,
  isRouteDue,
  LIMIT_NAME,
  overCapacityOptions,
  type RouteContext,
  useAppointments,
  useContainerTypes,
  useDirectory,
  useOpsMasters,
  useRouteAssignments,
  useRouteInstances,
  useRouteScoring,
  useRoutes,
  useServiceItems,
  useServicePoints,
  useShifts,
  useTechnicians,
  useVehicles,
  weekdayOfDay,
  withExtraTrips,
} from "@/features/field-service";
import type { Appointment, Route, RouteInstance, Shift } from "@/mocks";
import {
  appointmentLoadKg,
  CLOSED_STATUSES,
  confirmBlockers,
  type DefaultRoute,
  type EligibilityIssue,
  fitsVehicle,
  type OpenSlot,
  PLANNABLE_STATUSES,
  type RoutePlan,
  routeColors,
  type SlotKind,
  type StaffOption,
  slotKind,
  slotLabel,
  VEHICLE_CLASS,
} from "../../../components";
import { TODAY, toDayKey, toDubaiDayKey } from "../../../utils";

const TODAY_KEY = toDayKey(TODAY);

const isOpen = (apt: Appointment) => !CLOSED_STATUSES.includes(apt.status);

/**
 * The run's load on the truck it actually has (when that's one of the
 * Route's types; otherwise the Route's required type).
 */
function planLoad(
  template: Route | undefined,
  vehicleTruckType: string | undefined,
  stops: Appointment[],
  ctx: RouteContext | null,
  extra = 0,
) {
  if (!template || !ctx) return null;
  const truckTypeId =
    vehicleTruckType && template.truckTypeIds.includes(vehicleTruckType)
      ? vehicleTruckType
      : undefined;
  return instanceLoad(withExtraTrips(template, extra), truckTypeId, stops, ctx);
}

/**
 * Re-check whoever is on the instance now against the Route's rules for the
 * day: a licence or permit can expire after the run was generated (R5).
 */
function eligibilityOf(
  instance: RouteInstance,
  template: Route | undefined,
  ctx: RouteContext | null,
  names: (id: string) => string,
): EligibilityIssue[] {
  if (!template || !ctx) return [];
  const wd = weekdayOfDay(instance.date);
  const slots: ["truck" | "driver" | "helper", string, string | null][] = [
    ["truck", "truck", instance.vehicleId],
    ["driver", "driver", instance.primaryServiceProId],
    ...instance.crew.map(
      (c, i) =>
        ["helper", `helper-${i + 1}`, c.serviceProId] as [
          "helper",
          string,
          string,
        ],
    ),
  ];
  return slots.flatMap(([kind, slot, id]) => {
    if (!id) return [];
    const failed = assignmentChecks(template, kind, id, "backup", [wd], ctx);
    const issue =
      failed.find((c) => !c.ok && c.severity === "block") ??
      failed.find((c) => !c.ok);
    return issue
      ? [
          {
            slot,
            name: names(id),
            reason: issue.detail ?? issue.label,
            severity: issue.severity,
          },
        ]
      : [];
  });
}

/** Can a person work this instance's shift (on leave / wrong shift = no)? */
function shiftReason(shift: Shift | undefined, instance: RouteInstance) {
  if (!shift || shift.type === "leave") return "No shift this day";
  if (instance.shiftId === "NIGHT" && shift.type !== "night")
    return "Not on the night shift";
  if (instance.shiftId === "MORNING" && shift.type === "night")
    return "On the night shift";
  return undefined;
}

/** Slots that still need someone: the engine's flags, plus any empty seat. */
function unstaffedSlots(instance: RouteInstance) {
  const slots = new Set(
    instance.flags.flatMap((f) => (f.kind === "unstaffed" ? [f.slot] : [])),
  );
  if (!instance.vehicleId) slots.add("truck");
  if (!instance.primaryServiceProId) slots.add("driver");
  return [...slots].sort((a, b) => order(a) - order(b));
}
const order = (slot: string) =>
  slot === "truck" ? 0 : slot === "driver" ? 1 : 1 + Number(slot.slice(7));

/**
 * Everything the board needs for one Dubai day: each route instance resolved
 * into a plan (template, pro, crew, truck, stops, capacity, open slots) plus
 * the backlog waiting for one and each backlog job's default route.
 */
export function useDispatchDay(dayKey: string) {
  const instances = useRouteInstances();
  const appointments = useAppointments();
  const directory = useDirectory();
  const routes = useRoutes();
  const assignments = useRouteAssignments();
  const masters = useOpsMasters();
  const vehicles = useVehicles();
  const pros = useTechnicians();
  const servicePoints = useServicePoints();
  const items = useServiceItems();
  const containerTypes = useContainerTypes();
  const { shiftOf } = useShifts();
  const { instanceScore } = useRouteScoring();

  const ctx = useMemo<RouteContext | null>(() => {
    if (
      !masters.data ||
      !routes.data ||
      !assignments.data ||
      !vehicles.data ||
      !pros.data ||
      !servicePoints.data ||
      !items.data ||
      !containerTypes.data
    )
      return null;
    return {
      masters: masters.data,
      routes: routes.data,
      assignments: assignments.data,
      vehicles: vehicles.data,
      pros: pros.data,
      servicePoints: servicePoints.data,
      items: items.data,
      containerTypes: containerTypes.data,
    };
  }, [
    masters.data,
    routes.data,
    assignments.data,
    vehicles.data,
    pros.data,
    servicePoints.data,
    items.data,
    containerTypes.data,
  ]);

  const plans = useMemo<RoutePlan[]>(() => {
    const byId = new Map((appointments.data ?? []).map((a) => [a.id, a]));
    const all = instances.data ?? [];
    const today = all.filter((route) => route.date === dayKey);
    const wd = weekdayOfDay(dayKey);

    /** Who's already out on another instance in the same shift. */
    const busyOn = (assetId: string, instance: RouteInstance) =>
      today.find(
        (other) =>
          other.id !== instance.id &&
          other.shiftId === instance.shiftId &&
          other.status !== "cancelled" &&
          (other.vehicleId === assetId ||
            other.primaryServiceProId === assetId ||
            other.crew.some((c) => c.serviceProId === assetId)),
      );

    const optionsFor = (
      kind: SlotKind,
      instance: RouteInstance,
      template: Route | undefined,
    ): StaffOption[] => {
      if (!ctx) return [];
      const taken = new Set([
        instance.vehicleId,
        instance.primaryServiceProId,
        ...instance.crew.map((c) => c.serviceProId),
      ]);
      const assets =
        kind === "truck"
          ? ctx.vehicles.map((v) => ({
              id: v.id,
              name: v.plate,
              detail: `${VEHICLE_CLASS[v.vehicleClass]} · ${v.truckTypeId}`,
            }))
          : ctx.pros
              .filter((p) =>
                kind === "driver" ? p.role !== "loader" : p.role === "loader",
              )
              .map((p) => ({
                id: p.id,
                name: p.name,
                detail: p.employeeId ?? p.zone,
              }));
      return assets
        .filter((a) => !taken.has(a.id))
        .map((a) => {
          const failed = template
            ? assignmentChecks(template, kind, a.id, "backup", [wd], ctx).find(
                (c) => !c.ok && c.severity === "block",
              )
            : undefined;
          const busy = busyOn(a.id, instance);
          const vehicle = ctx.vehicles.find((v) => v.id === a.id);
          const reason = failed
            ? (failed.detail ?? failed.label)
            : busy
              ? `On ${busy.name}`
              : kind === "truck"
                ? vehicle?.status === "in-service"
                  ? undefined
                  : "Not in service"
                : shiftReason(shiftOf(a.id, dayKey), instance);
          return { ...a, eligible: !reason, reason };
        })
        .sort(
          (a, b) =>
            Number(b.eligible) - Number(a.eligible) ||
            a.name.localeCompare(b.name),
        );
    };

    const built = today.map((route) => {
      const template = routes.data?.find((r) => r.id === route.routeId);
      const stops = route.appointmentIds
        .map((id) => byId.get(id))
        .filter((a): a is Appointment => a !== undefined);
      const active = stops.filter((a) => a.status !== "cancelled");
      const vehicle = directory.vehicle(route.vehicleId);
      const closed = Boolean(route.closure);
      const locked = route.lockedAt !== null || closed;
      // Close run applies once the run's day has come and work began, or the
      // day is over (spec section 6.1): never to a run still ahead of its shift.
      const closable =
        !closed &&
        route.status !== "cancelled" &&
        stops.length > 0 &&
        (route.date < TODAY_KEY ||
          (route.date === TODAY_KEY &&
            ["in-progress", "completed", "partial"].includes(route.status)));
      const plannable = PLANNABLE_STATUSES.includes(route.status);
      // Crew fill the filled helper slots in order, so each knows its source.
      const helperSlots = Object.keys(route.staffing)
        .filter((slot) => slotKind(slot) === "helper")
        .sort((a, b) => order(a) - order(b));
      // Only runs still ahead of their shift can be fixed, so only those are checked.
      const eligibility = plannable
        ? eligibilityOf(
            route,
            template,
            ctx,
            (id) =>
              directory.vehicle(id)?.plate ??
              directory.servicePro(id)?.name ??
              id,
          )
        : [];
      const ineligible = eligibility.filter((e) => e.severity === "block");
      const openSlots: OpenSlot[] = unstaffedSlots(route).map((slot) => ({
        slot,
        kind: slotKind(slot),
        options:
          plannable && !locked
            ? optionsFor(slotKind(slot), route, template)
            : [],
      }));
      return {
        route,
        template,
        colors: routeColors(route.colorIndex),
        pro: directory.servicePro(route.primaryServiceProId),
        crew: route.crew.flatMap((member, i) => {
          const pro = directory.servicePro(member.serviceProId);
          const slot = helperSlots[i];
          return pro
            ? [
                {
                  pro,
                  role: member.role,
                  source: slot ? route.staffing[slot] : undefined,
                },
              ]
            : [];
        }),
        vehicle,
        stops,
        activeStops: active.length,
        doneStops: active.filter(
          (a) => a.status === "completed" || a.status === "failed",
        ).length,
        loadKg: active.reduce((sum, a) => sum + appointmentLoadKg(a), 0),
        load: planLoad(
          template,
          vehicle?.truckTypeId,
          stops,
          ctx,
          route.extraTrips?.count ?? 0,
        ),
        score: instanceScore(route),
        mismatches: active.filter(
          (a) => isOpen(a) && !fitsVehicle(a, vehicle?.vehicleClass),
        ).length,
        locked,
        closed,
        closable,
        plannable,
        openSlots,
        blockers: [
          ...confirmBlockers(route, { liveCapacity: Boolean(template) }),
          ...(ineligible.length
            ? [
                `Ineligible: ${ineligible.map((e) => slotLabel(e.slot)).join(", ")}`,
              ]
            : []),
        ],
        eligibility,
        overCapacity: null,
      };
    });

    // Live Over capacity (R16): judged on the current load, with the two
    // fixes the spec allows, against the day's other runs that can change.
    if (!ctx) return built;
    const asRun = (p: RoutePlan) =>
      p.template
        ? {
            id: p.route.id,
            name: p.route.name,
            template: withExtraTrips(
              p.template,
              p.route.extraTrips?.count ?? 0,
            ),
            truckTypeId: p.load?.truckTypeId,
            stops: p.stops,
          }
        : null;
    const open = built.filter((p) => p.plannable && !p.locked);
    const candidates = open.flatMap((p) => asRun(p) ?? []);
    return built.map((p) => {
      const run = p.plannable && !p.locked ? asRun(p) : null;
      const overCapacity = run
        ? overCapacityOptions(run, candidates, ctx)
        : null;
      return overCapacity
        ? {
            ...p,
            overCapacity,
            blockers: [
              ...p.blockers,
              `Over capacity ${overCapacity.pct}% (${LIMIT_NAME[overCapacity.limit]})`,
            ],
          }
        : p;
    });
  }, [
    instances.data,
    appointments.data,
    directory,
    dayKey,
    routes.data,
    ctx,
    shiftOf,
    instanceScore,
  ]);

  const { backlog, overdue } = useMemo(() => {
    const unrouted = (appointments.data ?? []).filter(
      (a) => a.routeInstanceId === null && isOpen(a),
    );
    return {
      backlog: unrouted.filter((a) => toDubaiDayKey(a.plannedStart) === dayKey),
      // Earlier days that never got a route: only meaningful from today on.
      overdue: unrouted.filter((a) => {
        const day = toDubaiDayKey(a.plannedStart);
        return day < dayKey && day < TODAY_KEY;
      }),
    };
  }, [appointments.data, dayKey]);

  /**
   * R24: each backlog job's default route is the Route its service line is
   * attached to, with that Route's instance on the day being planned.
   */
  const defaultRoutes = useMemo(() => {
    const map = new Map<string, DefaultRoute>();
    for (const apt of [...backlog, ...overdue]) {
      const route = routes.data?.find(
        (r) =>
          apt.serviceLineId !== null &&
          r.serviceLineIds.includes(apt.serviceLineId),
      );
      if (!route) continue;
      map.set(apt.id, {
        route,
        plan: plans.find((p) => p.route.routeId === route.id),
      });
    }
    return map;
  }, [backlog, overdue, routes.data, plans]);

  /** Active Routes due this day: "Not generated yet" when none has an instance. */
  const dueRoutes = useMemo(
    () => (routes.data ?? []).filter((r) => isRouteDue(r, dayKey)),
    [routes.data, dayKey],
  );

  return {
    plans,
    backlog,
    overdue,
    defaultRoutes,
    dueRoutes,
    isToday: dayKey === TODAY_KEY,
    isPending:
      instances.isPending ||
      appointments.isPending ||
      directory.isPending ||
      routes.isPending,
    error: instances.error ?? appointments.error ?? routes.error,
    refetch: () => {
      instances.refetch();
      appointments.refetch();
      routes.refetch();
    },
  };
}
