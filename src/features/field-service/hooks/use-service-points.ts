"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fieldServiceApi } from "../api";
import { fieldServiceKeys } from "../query-keys";
import { useServiceLineStore } from "../service-line-store";

/** Fixtures plus this session's service-line overrides (e.g. an accepted fill rate). */
export function useServicePoints() {
  const query = useQuery({
    queryKey: fieldServiceKeys.servicePoints(),
    queryFn: fieldServiceApi.listServicePoints,
  });
  const patches = useServiceLineStore((s) => s.patches);
  const data = useMemo(
    () =>
      query.data?.map((sp) =>
        sp.serviceLines.some((l) => patches[l.id])
          ? {
              ...sp,
              serviceLines: sp.serviceLines.map((l) =>
                patches[l.id] ? { ...l, ...patches[l.id] } : l,
              ),
            }
          : sp,
      ),
    [query.data, patches],
  );
  return { ...query, data };
}
