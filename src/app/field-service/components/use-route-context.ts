"use client";

import { useMemo } from "react";
import {
  type RouteContext,
  useContainerTypes,
  useOpsMasters,
  useRouteAssignments,
  useRoutes,
  useServiceItems,
  useServicePoints,
  useTechnicians,
  useVehicles,
} from "@/features/field-service";
import type { OpsMasters } from "@/mocks";

/** The empty scenario returns no masters; keep the screens renderable. */
const NO_MASTERS: OpsMasters = {
  entities: [],
  cities: [],
  depots: [],
  disposalSites: [],
  serviceTypes: [],
  truckTypes: [],
  skillCodes: [],
  wasteCodes: [],
  shifts: [],
};

/**
 * Everything the route rules judge a route against, built from the hooks.
 * `ctx` is undefined until every query has landed.
 */
export function useRouteContext() {
  const routes = useRoutes();
  const assignments = useRouteAssignments();
  const masters = useOpsMasters();
  const vehicles = useVehicles();
  const pros = useTechnicians();
  const servicePoints = useServicePoints();
  const items = useServiceItems();
  const containerTypes = useContainerTypes();

  const queries = [
    routes,
    assignments,
    masters,
    vehicles,
    pros,
    servicePoints,
    items,
    containerTypes,
  ];
  const failed = queries.find((q) => q.isError);

  const ctx = useMemo<RouteContext | undefined>(() => {
    if (
      !routes.data ||
      !assignments.data ||
      !masters.isSuccess ||
      !vehicles.data ||
      !pros.data ||
      !servicePoints.data ||
      !items.data ||
      !containerTypes.data
    )
      return undefined;
    return {
      routes: routes.data,
      assignments: assignments.data,
      masters: masters.data ?? NO_MASTERS,
      vehicles: vehicles.data,
      pros: pros.data,
      servicePoints: servicePoints.data,
      items: items.data,
      containerTypes: containerTypes.data,
    };
  }, [
    routes.data,
    assignments.data,
    masters.isSuccess,
    masters.data,
    vehicles.data,
    pros.data,
    servicePoints.data,
    items.data,
    containerTypes.data,
  ]);

  return {
    ctx,
    isPending: !ctx && !failed,
    error: failed?.error ?? null,
    refetch: () => {
      for (const q of queries) if (q.isError) q.refetch();
    },
  };
}
