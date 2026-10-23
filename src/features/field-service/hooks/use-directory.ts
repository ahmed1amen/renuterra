"use client";

import { useMemo } from "react";
import type { Customer, ServicePoint, Technician } from "@/mocks";
import { useCustomers } from "./use-customers";
import { useServicePoints } from "./use-service-points";
import { useTechnicians } from "./use-technicians";

/**
 * Id lookups for the records appointments point at — customers, service
 * points and service pros — so list rows can resolve names without a query
 * each.
 */
export function useDirectory() {
  const customers = useCustomers();
  const servicePoints = useServicePoints();
  const pros = useTechnicians();

  return useMemo(
    () => ({
      customer: byId<Customer>(customers.data),
      servicePoint: byId<ServicePoint>(servicePoints.data),
      servicePro: byId<Technician>(pros.data),
      isPending:
        customers.isPending || servicePoints.isPending || pros.isPending,
    }),
    [
      customers.data,
      servicePoints.data,
      pros.data,
      customers.isPending,
      servicePoints.isPending,
      pros.isPending,
    ],
  );
}

function byId<T extends { id: string }>(rows: T[] | undefined) {
  const map = new Map((rows ?? []).map((row) => [row.id, row]));
  return (id: string | null | undefined) => (id ? map.get(id) : undefined);
}
