"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

/** Route templates as fixtures hold them; screens read `useRoutes()`, which adds session edits. */
export function useRoutesQuery() {
  return useQuery({
    queryKey: fieldServiceKeys.routes(),
    queryFn: fieldServiceApi.listRoutes,
  });
}

export function useRouteAssignmentsQuery() {
  return useQuery({
    queryKey: fieldServiceKeys.routeAssignments(),
    queryFn: fieldServiceApi.listRouteAssignments,
  });
}

/** Lookup lists the Route model validates against. Rarely changes. */
export function useOpsMasters() {
  return useQuery({
    queryKey: fieldServiceKeys.opsMasters(),
    queryFn: fieldServiceApi.getOpsMasters,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
