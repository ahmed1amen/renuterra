"use client";

import { useMemo } from "react";
import { create } from "zustand";
import type { ServiceItem } from "@/mocks";
import { useServiceItems } from "./hooks/use-catalog";

/** What the service item dialog collects; the store assigns the id. */
export type ServiceItemInput = Omit<ServiceItem, "id">;

let itemSeq = 900;

/**
 * Service items added and edited during this session. Prototype-grade like
 * the appointment store: fixtures stay untouched and everything resets on reload.
 */
type CatalogState = {
  /** Added in this session, newest first. */
  added: ServiceItem[];
  /** Field overrides per service item id. */
  patches: Record<string, Partial<ServiceItem>>;
  /** Adds the item and returns it with its new id. */
  add: (input: ServiceItemInput) => ServiceItem;
  update: (id: string, patch: Partial<ServiceItem>) => void;
};

export const useCatalogStore = create<CatalogState>((set) => ({
  added: [],
  patches: {},
  add: (input) => {
    const item: ServiceItem = { ...input, id: `si_new_${itemSeq++}` };
    set((state) => ({ added: [item, ...state.added] }));
    return item;
  },
  update: (id, patch) =>
    set((state) => ({
      patches: { ...state.patches, [id]: { ...state.patches[id], ...patch } },
    })),
}));

/** The service catalogue plus this session's additions and edits, by code. */
export function useCatalogItems() {
  const query = useServiceItems();
  const added = useCatalogStore((s) => s.added);
  const patches = useCatalogStore((s) => s.patches);

  const data = useMemo(() => {
    if (!query.data) return undefined;
    return [...added, ...query.data]
      .map((i) => (patches[i.id] ? { ...i, ...patches[i.id] } : i))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [query.data, added, patches]);

  return { ...query, data };
}
