"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "../api";
import { crmKeys } from "./query-keys";

export function useContacts() {
  return useQuery({
    queryKey: crmKeys.contacts(),
    queryFn: crmApi.listContacts,
  });
}
