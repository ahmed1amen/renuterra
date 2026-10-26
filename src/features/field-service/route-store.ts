"use client";

import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { MOCK_NOW, type Route } from "@/mocks";
import { useAppointmentStore } from "./appointment-store";
import { useRoutesQuery } from "./hooks/use-routes-query";

/**
 * Dispatch changes made during this session — stops moved between routes,
 * locks, vehicle and crew swaps. Prototype-grade like the appointment store:
 * fixtures stay untouched and everything resets on reload.
 */
type RouteState = {
  /** Field overrides per route id. */
  patches: Record<string, Partial<Route>>;
  /** Routes created this session (e.g. "New route" on the board). */
  added: Route[];
  patch: (id: string, changes: Partial<Route>) => void;
  add: (route: Route) => void;
};

export const useRouteStore = create<RouteState>((set) => ({
  patches: {},
  added: [],
  patch: (id, changes) =>
    set((state) => ({
      patches: { ...state.patches, [id]: { ...state.patches[id], ...changes } },
    })),
  add: (route) => set((state) => ({ added: [...state.added, route] })),
}));

/** Fixtures plus this session's dispatch changes. */
export function useRoutes() {
  const query = useRoutesQuery();
  const patches = useRouteStore((s) => s.patches);
  const added = useRouteStore((s) => s.added);

  const data = useMemo(() => {
    if (!query.data) return undefined;
    return [...query.data, ...added].map((r) =>
      patches[r.id] ? { ...r, ...patches[r.id] } : r,
    );
  }, [query.data, patches, added]);

  return { ...query, data };
}

/**
 * Dispatch actions that keep a route's stop list and its appointments'
 * `routeId` in step. Every action is a fake: it only patches session state.
 */
export function useDispatchActions() {
  const routes = useRoutes();
  const base = useRoutesQuery().data;
  const patchRoute = useRouteStore((s) => s.patch);
  const updateAppointment = useAppointmentStore((s) => s.update);

  /**
   * Routes as the store holds them right now — not as of the last render — so
   * several moves in one handler (Auto-plan) build on each other.
   */
  const current = useCallback(() => {
    const { patches, added } = useRouteStore.getState();
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
      updateAppointment(appointmentId, { routeId: toRouteId });
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
