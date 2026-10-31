"use client";

import { useMemo } from "react";
import {
  assignmentChecks,
  findLine,
  isRouteDue,
  lineConsumption,
  type RouteContext,
  routeCapacity,
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
} from "@/features/field-service";
import type { Appointment, Route, RouteInstance, Shift } from "@/mocks";
import {
  appointmentLoadKg,
  CLOSED_STATUSES,
  confirmBlockers,
  type DefaultRoute,
  fitsVehicle,
  type OpenSlot,
  PLANNABLE_STATUSES,
  type RoutePlan,
  routeColors,
  type SlotKind,
  type StaffOption,
  slotKind,
  VEHICLE_CLASS,
} from "../../../components";
import { TODAY, toDayKey, toDubaiDayKey } from "../../../utils";

const TODAY_KEY = toDayKey(TODAY);

const isOpen = (apt: Appointment) => !CLOSED_STATUSES.includes(apt.status);

/**
 * The instance's planned work in its Route's capacity basis, on the truck it
 * actually has (when that's one of the Route's types). Stops without a
 * service line (one-offs) count a visit, or their estimated weight.
 */
function instanceCapacity(
  template: Route | undefined,
  vehicleTruckType: string | undefined,
  active: Appointment[],
  ctx: RouteContext | null,
) {
  if (!template || !ctx) return null;
  const truckTypeId =
    vehicleTruckType && template.truckTypeIds.includes(vehicleTruckType)
      ? vehicleTruckType
      : undefined;
  const capacity = routeCapacity(template, ctx.masters, truckTypeId);
  const consumed = active.reduce((sum, apt) => {
    const found = apt.serviceLineId
      ? findLine(ctx.servicePoints, apt.serviceLineId)
      : undefined;
    if (found) return sum + lineConsumption(template, found.line, ctx);
    if (capacity.basis === "visits") return sum + 1;
    if (capacity.basis === "weight") return sum + appointmentLoadKg(apt);
    return sum;
  }, 0);
  return { ...capacity, consumed };
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

    return today.map((route) => {
      const template = routes.data?.find((r) => r.id === route.routeId);
      const stops = route.appointmentIds
        .map((id) => byId.get(id))
        .filter((a): a is Appointment => a !== undefined);
      const active = stops.filter((a) => a.status !== "cancelled");
      const vehicle = directory.vehicle(route.vehicleId);
      const locked = route.lockedAt !== null;
      const plannable = PLANNABLE_STATUSES.includes(route.status);
      // Crew fill the filled helper slots in order, so each knows its source.
      const helperSlots = Object.keys(route.staffing)
        .filter((slot) => slotKind(slot) === "helper")
        .sort((a, b) => order(a) - order(b));
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
        loadKg: active.reduce((sum, a) => sum + appointmentLoadKg(a), 0),
        capacity: instanceCapacity(template, vehicle?.truckTypeId, active, ctx),
        score: instanceScore(route),
        mismatches: active.filter(
          (a) => isOpen(a) && !fitsVehicle(a, vehicle?.vehicleClass),
        ).length,
        locked,
        plannable,
        openSlots,
        blockers: confirmBlockers(route),
      };
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
      // Earlier days that never got a route — only meaningful from today on.
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

  /** Active Routes due this day — "Not generated yet" when none has an instance. */
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
