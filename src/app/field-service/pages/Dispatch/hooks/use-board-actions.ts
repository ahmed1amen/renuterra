"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import {
  useAppointmentStore,
  useDirectory,
  useDispatchActions,
} from "@/features/field-service";
import type { Appointment } from "@/mocks";
import {
  type BoardActions,
  fitsVehicle,
  isMovable,
  type RoutePlan,
  VEHICLE_CLASS,
} from "../../../components";

/** Where a stop slots into a route's drive order: by its planned arrival. */
function insertIndex(plan: RoutePlan, appointment: Appointment) {
  const index = plan.stops.findIndex(
    (stop) => stop.plannedStart > appointment.plannedStart,
  );
  return index === -1 ? plan.stops.length : index;
}

/**
 * The board's fake dispatch actions. Each one patches session state through
 * `useDispatchActions` and confirms with a toast — nothing is persisted.
 */
export function useBoardActions(plans: RoutePlan[], backlog: Appointment[]) {
  const dispatch = useDispatchActions();
  const updateAppointment = useAppointmentStore((s) => s.update);
  const directory = useDirectory();

  return useMemo(() => {
    const planOf = (routeId: string) =>
      plans.find((p) => p.route.id === routeId);
    const appointmentOf = (id: string) =>
      plans.flatMap((p) => p.stops).find((a) => a.id === id) ??
      backlog.find((a) => a.id === id);

    const actions: BoardActions = {
      assign: (appointmentId, routeId) => {
        const apt = appointmentOf(appointmentId);
        const ref = apt?.ref ?? "Appointment";
        if (routeId === null) {
          dispatch.move(appointmentId, null);
          toast.success(`${ref} sent to the backlog`);
          return;
        }
        const plan = planOf(routeId);
        if (!plan || plan.locked) return;
        const index = apt ? insertIndex(plan, apt) : plan.stops.length;
        dispatch.move(appointmentId, routeId, index);
        toast.success(`${ref} moved to ${plan.route.name}`, {
          description:
            apt && !fitsVehicle(apt, plan.vehicle?.vehicleClass)
              ? `Stop ${index + 1} — check the vehicle, this work needs a different truck.`
              : `Stop ${index + 1} of ${plan.stops.length + 1}.`,
        });
      },

      setLocked: (routeId, locked) => {
        dispatch.setLocked(routeId, locked);
        const name = planOf(routeId)?.route.name;
        toast.success(locked ? `${name} locked` : `${name} unlocked`, {
          description: locked
            ? "Its stops can't be moved until it's unlocked."
            : undefined,
        });
      },

      setVehicle: (routeId, vehicleId) => {
        dispatch.patch(routeId, { vehicleId });
        const vehicle = directory.vehicle(vehicleId);
        toast.success(`Vehicle changed to ${vehicle?.plate}`, {
          description: vehicle
            ? `${VEHICLE_CLASS[vehicle.vehicleClass]} on ${planOf(routeId)?.route.name}.`
            : undefined,
        });
      },

      setPrimary: (routeId, serviceProId) => {
        dispatch.patch(routeId, { primaryServiceProId: serviceProId });
        toast.success(
          `${directory.servicePro(serviceProId)?.name} now runs ${planOf(routeId)?.route.name}`,
        );
      },

      // Done in one patch: `move` reads the route from its last render, so
      // calling it per stop would keep only the last removal.
      clearRoute: (routeId) => {
        const plan = planOf(routeId);
        if (!plan) return;
        const moving = plan.stops.filter(isMovable).map((a) => a.id);
        const kept = plan.route.appointmentIds.filter(
          (id) => !moving.includes(id),
        );
        dispatch.patch(routeId, {
          appointmentIds: kept,
          tippingTrips: plan.route.tippingTrips.filter((t) =>
            kept.includes(t.afterAppointmentId),
          ),
        });
        for (const id of moving) updateAppointment(id, { routeId: null });
        toast.success(
          `${moving.length} ${moving.length === 1 ? "stop" : "stops"} sent to the backlog`,
          { description: `From ${plan.route.name}.` },
        );
      },
    };

    /**
     * Put each backlog appointment on the first unlocked route whose truck can
     * carry its first work order. Batched per route for the same reason as
     * `clearRoute`.
     */
    const autoPlan = () => {
      const added = new Map<string, Appointment[]>();
      const unplaced: Appointment[] = [];
      for (const apt of backlog) {
        const plan = plans.find(
          (p) => !p.locked && fitsVehicle(apt, p.vehicle?.vehicleClass),
        );
        if (!plan) {
          unplaced.push(apt);
          continue;
        }
        added.set(plan.route.id, [...(added.get(plan.route.id) ?? []), apt]);
      }

      for (const [routeId, apts] of added) {
        const plan = planOf(routeId);
        if (!plan) continue;
        const stops = [...plan.stops, ...apts].sort((a, b) =>
          a.plannedStart.localeCompare(b.plannedStart),
        );
        // Keep the existing drive order and slot the new stops in by time.
        const ids = [...plan.route.appointmentIds];
        for (const apt of apts) {
          const next = stops
            .slice(stops.indexOf(apt) + 1)
            .find((s) => ids.includes(s.id));
          ids.splice(next ? ids.indexOf(next.id) : ids.length, 0, apt.id);
        }
        dispatch.patch(routeId, { appointmentIds: ids });
        for (const apt of apts) updateAppointment(apt.id, { routeId });
      }

      const placed = backlog.length - unplaced.length;
      if (backlog.length === 0) {
        toast("Nothing to plan", {
          description: "The backlog for this day is empty.",
        });
      } else if (placed === 0) {
        toast.warning("Auto-Plan couldn't place anything", {
          description:
            "No unlocked route has a vehicle that suits the backlog's work.",
        });
      } else {
        toast.success(
          `Auto-Plan placed ${placed} of ${backlog.length} ${backlog.length === 1 ? "appointment" : "appointments"}`,
          {
            description: unplaced.length
              ? `${unplaced.map((a) => a.ref).join(", ")} still need${unplaced.length === 1 ? "s" : ""} a route with a suitable, unlocked vehicle.`
              : `Across ${added.size} ${added.size === 1 ? "route" : "routes"}.`,
          },
        );
      }
    };

    return { ...actions, autoPlan };
  }, [plans, backlog, dispatch, updateAppointment, directory]);
}
