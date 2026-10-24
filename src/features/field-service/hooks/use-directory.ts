"use client";

import { useMemo } from "react";
import type {
  Container,
  ContainerType,
  Customer,
  ServiceItem,
  ServicePoint,
  Technician,
} from "@/mocks";
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
 * points, service pros, service items and containers — so list rows can
 * resolve names without a query each.
 */
export function useDirectory() {
  const customers = useCustomers();
  const servicePoints = useServicePoints();
  const pros = useTechnicians();
  const items = useServiceItems();
  const containerTypes = useContainerTypes();
  const containers = useContainers();

  return useMemo(
    () => ({
      customer: byId<Customer>(customers.data),
      servicePoint: byId<ServicePoint>(servicePoints.data),
      servicePro: byId<Technician>(pros.data),
      serviceItem: byId<ServiceItem>(items.data),
      containerType: byId<ContainerType>(containerTypes.data),
      container: byId<Container>(containers.data),
      isPending:
        customers.isPending ||
        servicePoints.isPending ||
        pros.isPending ||
        items.isPending ||
        containerTypes.isPending ||
        containers.isPending,
    }),
    [
      customers.data,
      servicePoints.data,
      pros.data,
      items.data,
      containerTypes.data,
      containers.data,
      customers.isPending,
      servicePoints.isPending,
      pros.isPending,
      items.isPending,
      containerTypes.isPending,
      containers.isPending,
    ],
  );
}

function byId<T extends { id: string }>(rows: T[] | undefined) {
  const map = new Map((rows ?? []).map((row) => [row.id, row]));
  return (id: string | null | undefined) => (id ? map.get(id) : undefined);
}
