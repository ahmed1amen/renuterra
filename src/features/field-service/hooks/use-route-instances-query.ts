"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

/** Routes as fixtures hold them; screens read `useRouteInstances()`, which adds this session's dispatch changes. */
export function useRouteInstancesQuery() {
  return useQuery({
    queryKey: fieldServiceKeys.routeInstances(),
    queryFn: fieldServiceApi.listRouteInstances,
  });
}

/** Vehicles as fixtures hold them; screens read `useVehicles()`, which adds workshop moves. */
export function useVehiclesQuery() {
  return useQuery({
    queryKey: fieldServiceKeys.vehicles(),
    queryFn: fieldServiceApi.listVehicles,
  });
}
