"use client";

import { useMemo } from "react";
import {
  useAppointments,
  useDirectory,
  useRoutes,
} from "@/features/field-service";
import type { Appointment } from "@/mocks";
import {
  appointmentLoadKg,
  CLOSED_STATUSES,
  fitsVehicle,
  type RoutePlan,
  routeColors,
} from "../../../components";
import { TODAY, toDayKey, toDubaiDayKey } from "../../../utils";

const TODAY_KEY = toDayKey(TODAY);

const isOpen = (apt: Appointment) => !CLOSED_STATUSES.includes(apt.status);

/**
 * Everything the board needs for one Dubai day: each route resolved into a
 * plan (pro, crew, truck, stops, capacity) plus the backlog waiting for one.
 */
export function useDispatchDay(dayKey: string) {
  const routes = useRoutes();
  const appointments = useAppointments();
  const directory = useDirectory();

  const plans = useMemo<RoutePlan[]>(() => {
    const byId = new Map((appointments.data ?? []).map((a) => [a.id, a]));
    return (routes.data ?? [])
      .filter((route) => route.date === dayKey)
      .map((route) => {
        const stops = route.appointmentIds
          .map((id) => byId.get(id))
          .filter((a): a is Appointment => a !== undefined);
        const active = stops.filter((a) => a.status !== "cancelled");
        const vehicle = directory.vehicle(route.vehicleId);
        return {
          route,
          colors: routeColors(route.colorIndex),
          pro: directory.servicePro(route.primaryServiceProId),
          crew: route.crew.flatMap((member) => {
            const pro = directory.servicePro(member.serviceProId);
            return pro ? [{ pro, role: member.role }] : [];
          }),
          vehicle,
          stops,
          activeStops: active.length,
          loadKg: active.reduce((sum, a) => sum + appointmentLoadKg(a), 0),
          mismatches: active.filter(
            (a) => isOpen(a) && !fitsVehicle(a, vehicle?.vehicleClass),
          ).length,
          locked: route.lockedAt !== null,
        };
      });
  }, [routes.data, appointments.data, directory, dayKey]);

  const { backlog, overdue } = useMemo(() => {
    const unrouted = (appointments.data ?? []).filter(
      (a) => a.routeId === null && isOpen(a),
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

  return {
    plans,
    backlog,
    overdue,
    isToday: dayKey === TODAY_KEY,
    isPending:
      routes.isPending || appointments.isPending || directory.isPending,
    error: routes.error ?? appointments.error,
    refetch: () => {
      routes.refetch();
      appointments.refetch();
    },
  };
}
