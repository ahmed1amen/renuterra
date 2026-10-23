"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

/** Raw fixture query — screens use `useAppointments`, which adds session edits. */
export function useAppointmentsQuery() {
  return useQuery({
    queryKey: fieldServiceKeys.appointments(),
    queryFn: fieldServiceApi.listAppointments,
  });
}
