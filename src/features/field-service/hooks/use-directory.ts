"use client";

import { useMemo } from "react";
import type {
  Container,
  ContainerType,
  Customer,
  RouteInstance,
  ServiceItem,
  ServicePoint,
  Technician,
  Vehicle,
} from "@/mocks";
import { useVehicles } from "../fleet-store";
import { useRouteInstances } from "../route-instance-store";
import {
  useContainers,
  useContainerTypes,
  useServiceItems,
} from "./use-catalog";
import { useCustomers } from "./use-customers";
import { useServicePoints } from "./use-service-points";
import { useTechnicians } from "./use-technicians";

/**
 * Id lookups for the records appointments point at — customers, service
 * points, service pros, routes, vehicles, service items and containers — so list rows can
 * resolve names without a query each.
 */
export function useDirectory() {
  const customers = useCustomers();
  const servicePoints = useServicePoints();
  const pros = useTechnicians();
  const items = useServiceItems();
  const containerTypes = useContainerTypes();
  const containers = useContainers();
  const routes = useRouteInstances();
  const vehicles = useVehicles();

  return useMemo(
    () => ({
      customer: byId<Customer>(customers.data),
      servicePoint: byId<ServicePoint>(servicePoints.data),
      servicePro: byId<Technician>(pros.data),
      serviceItem: byId<ServiceItem>(items.data),
      containerType: byId<ContainerType>(containerTypes.data),
      container: byId<Container>(containers.data),
      routeInstance: byId<RouteInstance>(routes.data),
      vehicle: byId<Vehicle>(vehicles.data),
      isPending:
        customers.isPending ||
        servicePoints.isPending ||
        pros.isPending ||
        items.isPending ||
        containerTypes.isPending ||
        containers.isPending ||
        routes.isPending ||
        vehicles.isPending,
    }),
    [
      customers.data,
      servicePoints.data,
      pros.data,
      items.data,
      containerTypes.data,
      containers.data,
      routes.data,
      vehicles.data,
      customers.isPending,
      servicePoints.isPending,
      pros.isPending,
      items.isPending,
      containerTypes.isPending,
      containers.isPending,
      routes.isPending,
      vehicles.isPending,
    ],
  );
}

function byId<T extends { id: string }>(rows: T[] | undefined) {
  const map = new Map((rows ?? []).map((row) => [row.id, row]));
  return (id: string | null | undefined) => (id ? map.get(id) : undefined);
}
