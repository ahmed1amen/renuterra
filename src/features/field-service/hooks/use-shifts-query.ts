"use client";

import { useQuery } from "@tanstack/react-query";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";

/** Shifts as fixtures hold them; screens read `useShifts()`, which adds this session's edits. */
export function useShiftsQuery() {
  return useQuery({
    queryKey: fieldServiceKeys.shifts(),
    queryFn: fieldServiceApi.listShifts,
  });
}

export function useShiftTemplatesQuery() {
  return useQuery({
    queryKey: fieldServiceKeys.shiftTemplates(),
    queryFn: fieldServiceApi.listShiftTemplates,
  });
}
