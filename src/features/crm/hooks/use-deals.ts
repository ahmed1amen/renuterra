"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "../api";
import { crmKeys } from "./query-keys";

export function useDeals() {
  return useQuery({ queryKey: crmKeys.deals(), queryFn: crmApi.listDeals });
}
