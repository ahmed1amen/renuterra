"use client";

import { useMemo } from "react";
import { create } from "zustand";
import type { VehicleStatus } from "@/mocks";
import { useVehiclesQuery } from "./hooks/use-route-instances-query";

/**
 * Workshop moves made this session (Fleet screen). Dispatch and the dispatch
 * engine read vehicles through `useVehicles()`, so a truck sent to the
 * workshop drops out of generation. Prototype-grade: resets on reload.
 */
type FleetState = {
  statusOverrides: Record<string, VehicleStatus>;
  setStatus: (vehicleId: string, status: VehicleStatus) => void;
};

export const useFleetStore = create<FleetState>((set) => ({
  statusOverrides: {},
  setStatus: (vehicleId, status) =>
    set((s) => ({
      statusOverrides: { ...s.statusOverrides, [vehicleId]: status },
    })),
}));

/** Vehicles with this session's workshop moves applied. */
export function useVehicles() {
  const query = useVehiclesQuery();
  const overrides = useFleetStore((s) => s.statusOverrides);
  const data = useMemo(
    () =>
      query.data?.map((v) =>
        overrides[v.id] ? { ...v, status: overrides[v.id] } : v,
      ),
    [query.data, overrides],
  );
  return { ...query, data };
}
