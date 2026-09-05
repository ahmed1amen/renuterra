"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "../api";
import { crmKeys } from "./query-keys";

export function useActivities() {
  return useQuery({
    queryKey: crmKeys.activities(),
    queryFn: crmApi.listActivities,
  });
}
