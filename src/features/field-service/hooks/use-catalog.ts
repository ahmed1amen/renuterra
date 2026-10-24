"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

/** The service catalogue, sorted by code. */
export function useServiceItems() {
  return useQuery({
    queryKey: fieldServiceKeys.serviceItems(),
    queryFn: fieldServiceApi.listServiceItems,
  });
}

export function useContainerTypes() {
  return useQuery({
    queryKey: fieldServiceKeys.containerTypes(),
    queryFn: fieldServiceApi.listContainerTypes,
  });
}

/** Every tagged container, placed or in the depot. */
export function useContainers() {
  return useQuery({
    queryKey: fieldServiceKeys.containers(),
    queryFn: fieldServiceApi.listContainers,
  });
}
