"use client";

import { useCallback, useMemo } from "react";
import type { Route, RouteInstance } from "@/mocks";
import { useAppointmentStore, useAppointments } from "./appointment-store";
import { useVehicles } from "./fleet-store";
import { useContainerTypes, useServiceItems } from "./hooks/use-catalog";
import { useOpsMasters } from "./hooks/use-routes-query";
import { useServicePoints } from "./hooks/use-service-points";
import { useTechnicians } from "./hooks/use-technicians";
import { projectVisits } from "./projected-visits";
import {
  useRouteInstanceStore,
  useRouteInstances,
} from "./route-instance-store";
import { optimizeInstance } from "./route-optimizer";
import type { RouteContext } from "./route-rules";
import { scoreInstance, scoreRoute } from "./route-score";
import { useRouteAssignments, useRoutes } from "./route-store";

/** The rules context from the live hooks; `null` while anything is loading. */
export function useRouteContext(): RouteContext | null {
  const masters = useOpsMasters();
  const routes = useRoutes();
  const assignments = useRouteAssignments();
  const vehicles = useVehicles();
  const pros = useTechnicians();
  const servicePoints = useServicePoints();
  const items = useServiceItems();
  const containerTypes = useContainerTypes();
  return useMemo(() => {
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
}

/** Scores for Route templates and instances, from whatever is loaded. */
export function useRouteScoring() {
  const ctx = useRouteContext();
  const stops = useAppointments();
  const routeScore = useCallback(
    (route: Route, day?: string) => (ctx ? scoreRoute(route, ctx, day) : null),
    [ctx],
  );
  const instanceScore = useCallback(
    (instance: RouteInstance) =>
      ctx && stops.data ? scoreInstance(instance, stops.data, ctx) : null,
    [ctx, stops.data],
  );
  return { ready: Boolean(ctx && stops.data), routeScore, instanceScore };
}

/**
 * Phase-1 optimisation of one instance, applied to session state. Returns the
 * before/after scores so the board can show the gain, and an `undo`.
 */
export function useOptimizer() {
  const ctx = useRouteContext();
  const stops = useAppointments();
  const instances = useRouteInstances();
  const patchInstance = useRouteInstanceStore((s) => s.patch);
  const updateAppointment = useAppointmentStore((s) => s.update);

  const optimize = useCallback(
    (instanceId: string) => {
      const instance = instances.data?.find((i) => i.id === instanceId);
      if (!ctx || !stops.data || !instance) return null;
      const result = optimizeInstance(instance, stops.data, ctx);
      if (result.unchanged) return result;
      const previous = {
        instance: {
          appointmentIds: instance.appointmentIds,
          tippingTrips: instance.tippingTrips,
          estimatedKm: instance.estimatedKm,
          estimatedDriveMins: instance.estimatedDriveMins,
          flags: instance.flags,
        },
        appointments: result.appointments.map((m) => ({
          id: m.id,
          plannedStart:
            stops.data?.find((a) => a.id === m.id)?.plannedStart ??
            m.plannedStart,
        })),
      };
      patchInstance(instanceId, result.instance);
      for (const m of result.appointments)
        updateAppointment(m.id, { plannedStart: m.plannedStart });
      const undo = () => {
        patchInstance(instanceId, previous.instance);
        for (const m of previous.appointments)
          updateAppointment(m.id, { plannedStart: m.plannedStart });
      };
      return { ...result, undo };
    },
    [ctx, stops.data, instances.data, patchInstance, updateAppointment],
  );

  return { optimize, ready: Boolean(ctx && stops.data && instances.data) };
}

/** Next collections for a customer or site, from route schedules (see `projectVisits`). */
export function useProjectedVisits(
  filter?: { customerId?: string; servicePointId?: string },
  fromDay = "2026-09-04",
  days = 14,
) {
  const servicePoints = useServicePoints();
  const routes = useRoutes();
  const instances = useRouteInstances();
  const { customerId, servicePointId } = filter ?? {};
  return useMemo(
    () =>
      servicePoints.data && routes.data && instances.data
        ? projectVisits(
            servicePoints.data,
            routes.data,
            instances.data,
            fromDay,
            days,
            { customerId, servicePointId },
          )
        : undefined,
    [
      servicePoints.data,
      routes.data,
      instances.data,
      fromDay,
      days,
      customerId,
      servicePointId,
    ],
  );
}
