"use client";

import { create } from "zustand";
import type { ServiceLine } from "@/mocks";

/**
 * Service-line changes made in Field Ops this session. Lines are mastered in
 * the CRM (spec section 5); the fill-rate override is the one field operations
 * owns. Prototype-grade: resets on reload.
 */
type ServiceLineState = {
  patches: Record<string, Partial<Pick<ServiceLine, "fillRate">>>;
  setFillRate: (lineId: string, fillRate: number | null) => void;
};

export const useServiceLineStore = create<ServiceLineState>((set) => ({
  patches: {},
  setFillRate: (lineId, fillRate) =>
    set((state) => ({
      patches: { ...state.patches, [lineId]: { fillRate } },
    })),
}));
