"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

export function useServicePoints() {
  return useQuery({
    queryKey: fieldServiceKeys.servicePoints(),
    queryFn: fieldServiceApi.listServicePoints,
  });
}
