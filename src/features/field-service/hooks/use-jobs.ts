"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

export function useJobs() {
  return useQuery({
    queryKey: fieldServiceKeys.jobs(),
    queryFn: fieldServiceApi.listJobs,
  });
}
