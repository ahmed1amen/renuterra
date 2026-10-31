"use client";

import { useMemo } from "react";
import { create } from "zustand";
import type { Route, RouteAssignment } from "@/mocks";
import {
  useRouteAssignmentsQuery,
  useRoutesQuery,
} from "./hooks/use-routes-query";

/**
 * Attributes the spec calls "matching" (R13): changing one on an Active Route
 * makes a new version; instances already generated keep the old one.
 */
const MATCHING: (keyof Route)[] = [
  "serviceType",
  "city",
  "truckTypeIds",
  "requiredSkills",
  "wasteCodes",
  "shiftId",
];

/**
 * Route templates and assignments edited this session. Prototype-grade: the
 * fixtures are never changed and everything resets on reload. Nothing is ever
 * deleted (R20): routes are retired, assignments suspended.
 */
type RouteState = {
  patches: Record<string, Partial<Route>>;
  added: Route[];
  assignmentPatches: Record<string, Partial<RouteAssignment>>;
  addedAssignments: RouteAssignment[];
  addRoute: (route: Route) => void;
  patchRoute: (id: string, changes: Partial<Route>) => void;
  addAssignment: (assignment: RouteAssignment) => void;
  patchAssignment: (id: string, changes: Partial<RouteAssignment>) => void;
};

export const useRouteStore = create<RouteState>((set) => ({
  patches: {},
  added: [],
  assignmentPatches: {},
  addedAssignments: [],
  addRoute: (route) => set((s) => ({ added: [...s.added, route] })),
  patchRoute: (id, changes) =>
    set((s) => ({
      patches: { ...s.patches, [id]: { ...s.patches[id], ...changes } },
    })),
  addAssignment: (assignment) =>
    set((s) => ({ addedAssignments: [...s.addedAssignments, assignment] })),
  patchAssignment: (id, changes) =>
    set((s) => ({
      assignmentPatches: {
        ...s.assignmentPatches,
        [id]: { ...s.assignmentPatches[id], ...changes },
      },
    })),
}));

function merge<T extends { id: string }>(
  base: T[] | undefined,
  added: T[],
  patches: Record<string, Partial<T>>,
) {
  if (!base) return undefined;
  return [...base, ...added].map((row) =>
    patches[row.id] ? { ...row, ...patches[row.id] } : row,
  );
}

/** Route templates: fixtures plus this session's edits. */
export function useRoutes() {
  const query = useRoutesQuery();
  const patches = useRouteStore((s) => s.patches);
  const added = useRouteStore((s) => s.added);
  const data = useMemo(
    () => merge(query.data, added, patches),
    [query.data, added, patches],
  );
  return { ...query, data };
}

export function useRouteAssignments() {
  const query = useRouteAssignmentsQuery();
  const patches = useRouteStore((s) => s.assignmentPatches);
  const added = useRouteStore((s) => s.addedAssignments);
  const data = useMemo(
    () => merge(query.data, added, patches),
    [query.data, added, patches],
  );
  return { ...query, data };
}

/**
 * Apply an edit to a route. On an Active route a change to a matching
 * attribute bumps the version (R13): returned so the caller can say so.
 */
export function editRoute(route: Route, changes: Partial<Route>) {
  const versioned =
    route.status === "active" &&
    MATCHING.some(
      (key) =>
        key in changes &&
        JSON.stringify(changes[key]) !== JSON.stringify(route[key]),
    );
  const next = versioned ? { ...changes, version: route.version + 1 } : changes;
  // R1: the code is immutable once a route has been active.
  if (route.status !== "draft") delete next.code;
  useRouteStore.getState().patchRoute(route.id, next);
  return { versioned, version: versioned ? route.version + 1 : route.version };
}

/**
 * Move a service line onto a route (R10: one Active route per line; a
 * transfer takes it off the old one).
 */
export function attachServiceLine(
  routes: Route[],
  routeId: string,
  serviceLineId: string,
) {
  const { patchRoute } = useRouteStore.getState();
  for (const r of routes) {
    if (r.id !== routeId && r.serviceLineIds.includes(serviceLineId))
      patchRoute(r.id, {
        serviceLineIds: r.serviceLineIds.filter((id) => id !== serviceLineId),
      });
  }
  const target = routes.find((r) => r.id === routeId);
  if (target && !target.serviceLineIds.includes(serviceLineId))
    patchRoute(routeId, {
      serviceLineIds: [...target.serviceLineIds, serviceLineId],
    });
}

export function detachServiceLine(route: Route, serviceLineId: string) {
  useRouteStore.getState().patchRoute(route.id, {
    serviceLineIds: route.serviceLineIds.filter((id) => id !== serviceLineId),
  });
}
