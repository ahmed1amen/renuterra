"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

export function useTechnicians() {
  return useQuery({
    queryKey: fieldServiceKeys.technicians(),
    queryFn: fieldServiceApi.listTechnicians,
  });
}
