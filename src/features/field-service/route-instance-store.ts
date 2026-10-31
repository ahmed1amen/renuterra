"use client";

import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { type Appointment, MOCK_NOW, type RouteInstance } from "@/mocks";
import { useAppointmentStore, useAppointments } from "./appointment-store";
import { useRouteInstancesQuery } from "./hooks/use-route-instances-query";

/**
 * Dispatch changes made during this session: stops moved between routes,
 * locks, vehicle and crew swaps. Prototype-grade like the appointment store:
 * fixtures stay untouched and everything resets on reload.
 */
type RouteState = {
  /** Field overrides per route id. */
  patches: Record<string, Partial<RouteInstance>>;
  /** Routes created this session (e.g. "New route" on the board). */
  added: RouteInstance[];
  patch: (id: string, changes: Partial<RouteInstance>) => void;
  add: (route: RouteInstance) => void;
};

export const useRouteInstanceStore = create<RouteState>((set) => ({
  patches: {},
  added: [],
  patch: (id, changes) =>
    set((state) => ({
      patches: { ...state.patches, [id]: { ...state.patches[id], ...changes } },
    })),
  add: (route) => set((state) => ({ added: [...state.added, route] })),
}));

const CLOSED = new Set(["completed", "failed", "cancelled"]);
const LIVE = new Set(["en-route", "in-progress"]);

/**
 * An instance's status follows its stops once work starts: the first stop
 * en route makes it In progress; every stop closed makes it Completed, or
 * Partial when some failed or were cancelled. Before that, the dispatcher's
 * status (planned / unstaffed / confirmed) stands.
 */
export function deriveInstanceStatus(
  instance: RouteInstance,
  stops: Pick<Appointment, "id" | "status">[],
): RouteInstance["status"] {
  if (instance.status === "cancelled") return "cancelled";
  const mine = stops.filter((a) => instance.appointmentIds.includes(a.id));
  if (!mine.length) return instance.status;
  const live = mine.some((a) => LIVE.has(a.status));
  const closed = mine.filter((a) => CLOSED.has(a.status));
  if (closed.length === mine.length)
    return mine.every((a) => a.status === "completed")
      ? "completed"
      : "partial";
  if (live || closed.length) return "in-progress";
  return instance.status;
}

/** Fixtures plus this session's dispatch changes, with status derived from the stops. */
export function useRouteInstances() {
  const query = useRouteInstancesQuery();
  const patches = useRouteInstanceStore((s) => s.patches);
  const added = useRouteInstanceStore((s) => s.added);
  const stops = useAppointments();

  const data = useMemo(() => {
    if (!query.data) return undefined;
    const merged = [...query.data, ...added].map((r) =>
      patches[r.id] ? { ...r, ...patches[r.id] } : r,
    );
    if (!stops.data) return merged;
    return merged.map((r) => {
      const status = deriveInstanceStatus(r, stops.data as Appointment[]);
      return status === r.status ? r : { ...r, status };
    });
  }, [query.data, patches, added, stops.data]);

  return { ...query, data };
}

/**
 * Dispatch actions that keep a route's stop list and its appointments'
 * `routeId` in step. Every action is a fake: it only patches session state.
 */
export function useDispatchActions() {
  const routes = useRouteInstances();
  const base = useRouteInstancesQuery().data;
  const patchRoute = useRouteInstanceStore((s) => s.patch);
  const updateAppointment = useAppointmentStore((s) => s.update);

  /**
   * Routes as the store holds them right now (not as of the last render) so
   * several moves in one handler (Auto-plan) build on each other.
   */
  const current = useCallback(() => {
    const { patches, added } = useRouteInstanceStore.getState();
    return [...(base ?? []), ...added].map((r) =>
      patches[r.id] ? { ...r, ...patches[r.id] } : r,
    );
  }, [base]);

  const routeOf = useCallback(
    (appointmentId: string) =>
      current().find((r) => r.appointmentIds.includes(appointmentId)),
    [current],
  );

  /**
   * Put an appointment on a route (at `index`, default the end) or back in the
   * backlog (`toRouteId: null`). Tipping trips after a moved stop are dropped.
   */
  const move = useCallback(
    (appointmentId: string, toRouteId: string | null, index?: number) => {
      const from = routeOf(appointmentId);
      if (from) {
        patchRoute(from.id, {
          appointmentIds: from.appointmentIds.filter(
            (id) => id !== appointmentId,
          ),
          tippingTrips: from.tippingTrips.filter(
            (t) => t.afterAppointmentId !== appointmentId,
          ),
        });
      }
      if (toRouteId) {
        const to = current().find((r) => r.id === toRouteId);
        if (to) {
          const ids = to.appointmentIds.filter((id) => id !== appointmentId);
          ids.splice(index ?? ids.length, 0, appointmentId);
          patchRoute(to.id, { appointmentIds: ids });
        }
      }
      updateAppointment(appointmentId, { routeInstanceId: toRouteId });
    },
    [routeOf, current, patchRoute, updateAppointment],
  );

  const setLocked = useCallback(
    (routeId: string, locked: boolean) =>
      patchRoute(routeId, {
        lockedAt: locked ? MOCK_NOW : null,
        lockedBy: locked ? "usr_1" : null,
      }),
    [patchRoute],
  );

  return { move, setLocked, patch: patchRoute, routeOf, routes };
}
