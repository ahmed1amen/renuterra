"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

/** Routes as fixtures hold them; screens read `useRoutes()`, which adds this session's dispatch changes. */
export function useRoutesQuery() {
  return useQuery({
    queryKey: fieldServiceKeys.routes(),
    queryFn: fieldServiceApi.listRoutes,
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: fieldServiceKeys.vehicles(),
    queryFn: fieldServiceApi.listVehicles,
  });
}
