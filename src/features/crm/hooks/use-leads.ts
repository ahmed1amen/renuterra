"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "../api";
import { crmKeys } from "./query-keys";

export function useLeads() {
  return useQuery({ queryKey: crmKeys.leads(), queryFn: crmApi.listLeads });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: crmKeys.lead(id),
    queryFn: () => crmApi.getLead(id),
  });
}
