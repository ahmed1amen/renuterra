"use client";

import { create } from "zustand";
import type { DayOfWeek, Technician } from "@/mocks";

export type DefaultSchedule = Partial<Record<DayOfWeek, string>>;

/**
 * Default schedules saved this session, keyed by service pro. Prototype-grade:
 * the fixture pro is never changed and everything resets on reload.
 */
type ScheduleState = {
  schedules: Record<string, DefaultSchedule>;
  save: (serviceProId: string, schedule: DefaultSchedule) => void;
};

export const useDefaultScheduleStore = create<ScheduleState>((set) => ({
  schedules: {},
  save: (serviceProId, schedule) =>
    set((state) => ({
      schedules: { ...state.schedules, [serviceProId]: schedule },
    })),
}));

/** A pro's default schedule: this session's save, else the fixture's. */
export function defaultScheduleOf(
  pro: Technician,
  schedules: Record<string, DefaultSchedule>,
): DefaultSchedule {
  return schedules[pro.id] ?? pro.defaultSchedule ?? {};
}
