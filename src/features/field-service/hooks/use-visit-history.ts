"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

/** Past visits per service line: what the suggested fill rate learns from. */
export function useVisitHistory() {
  return useQuery({
    queryKey: fieldServiceKeys.visitHistory(),
    queryFn: fieldServiceApi.listVisitHistory,
  });
}
