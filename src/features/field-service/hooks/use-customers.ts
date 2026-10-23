"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

export function useCustomers() {
  return useQuery({
    queryKey: fieldServiceKeys.customers(),
    queryFn: fieldServiceApi.listCustomers,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: fieldServiceKeys.customer(id),
    queryFn: () => fieldServiceApi.getCustomer(id),
  });
}
