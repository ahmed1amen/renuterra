"use client";

import { create } from "zustand";
import { MOCK_NOW } from "@/mocks";

export type RouteEvent = {
  /** ISO instant; session events use the mock clock. */
  at: string;
  title: string;
  detail?: string;
};

/**
 * What happened to each route this session (R19 audit log, faked). Resets on
 * reload with the rest of the session edits.
 */
type RouteHistoryState = {
  events: Record<string, RouteEvent[]>;
  log: (routeId: string, title: string, detail?: string) => void;
};

export const useRouteHistory = create<RouteHistoryState>((set) => ({
  events: {},
  log: (routeId, title, detail) =>
    set((s) => ({
      events: {
        ...s.events,
        [routeId]: [
          { at: MOCK_NOW, title, detail },
          ...(s.events[routeId] ?? []),
        ],
      },
    })),
}));

export const logRouteEvent = (
  routeId: string,
  title: string,
  detail?: string,
) => useRouteHistory.getState().log(routeId, title, detail);
