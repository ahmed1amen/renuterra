"use client";

import { useCallback, useMemo } from "react";
import { create } from "zustand";
import type { DayOfWeek, Shift, ShiftTemplate, Technician } from "@/mocks";
import { useShiftsQuery } from "./hooks/use-shifts-query";

/** One shift per service pro per day: the key everything is looked up by. */
export const shiftKey = (serviceProId: string, date: string) =>
  `${serviceProId}|${date}`;

/** Working shifts make a pro available; leave doesn't. */
export const isWorkingShift = (shift: Shift | undefined) =>
  Boolean(shift && shift.type !== "leave");

const WEEKDAYS: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** `sun`…`sat` for a `2026-09-04` day key. */
export const weekdayOf = (date: string) =>
  WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

/** A shift on `date` from a template: what Autofill and "apply template" create. */
export function shiftFromTemplate(
  serviceProId: string,
  date: string,
  template: ShiftTemplate,
): Shift {
  return {
    id: `shift_${serviceProId}_${date.replaceAll("-", "")}`,
    serviceProId,
    date,
    type: template.type,
    startTime: template.startTime,
    endTime: template.endTime,
    templateId: template.id,
    trainerId: null,
  };
}

/**
 * Shift edits made during this session, keyed by pro + day. `null` marks a
 * fixture shift that was removed. Prototype-grade: resets on reload.
 */
type ShiftState = {
  overrides: Record<string, Shift | null>;
  set: (shift: Shift) => void;
  remove: (serviceProId: string, date: string) => void;
  setMany: (shifts: Shift[]) => void;
};

export const useShiftStore = create<ShiftState>((set) => ({
  overrides: {},
  set: (shift) =>
    set((state) => ({
      overrides: {
        ...state.overrides,
        [shiftKey(shift.serviceProId, shift.date)]: shift,
      },
    })),
  remove: (serviceProId, date) =>
    set((state) => ({
      overrides: { ...state.overrides, [shiftKey(serviceProId, date)]: null },
    })),
  setMany: (shifts) =>
    set((state) => ({
      overrides: {
        ...state.overrides,
        ...Object.fromEntries(
          shifts.map((s) => [shiftKey(s.serviceProId, s.date), s]),
        ),
      },
    })),
}));

/**
 * Every shift (fixtures plus this session's edits) with a `shiftOf(pro,
 * day)` lookup for the board, Dispatch and the New route dialog.
 */
export function useShifts() {
  const query = useShiftsQuery();
  const overrides = useShiftStore((s) => s.overrides);

  const byKey = useMemo(() => {
    const map = new Map<string, Shift>();
    for (const shift of query.data ?? [])
      map.set(shiftKey(shift.serviceProId, shift.date), shift);
    for (const [key, shift] of Object.entries(overrides)) {
      if (shift) map.set(key, shift);
      else map.delete(key);
    }
    return map;
  }, [query.data, overrides]);

  const shiftOf = useCallback(
    (serviceProId: string, date: string) =>
      byKey.get(shiftKey(serviceProId, date)),
    [byKey],
  );

  const data = useMemo(
    () => (query.data ? [...byKey.values()] : undefined),
    [query.data, byKey],
  );

  return { ...query, data, shiftOf };
}

/**
 * Fill empty cells from each pro's default weekly schedule. Existing shifts
 * (including leave) are left alone. Returns the shifts it created.
 */
export function autofillShifts(
  pros: Technician[],
  dates: string[],
  templates: ShiftTemplate[],
  shiftOf: (serviceProId: string, date: string) => Shift | undefined,
) {
  const created: Shift[] = [];
  for (const pro of pros) {
    for (const date of dates) {
      if (shiftOf(pro.id, date)) continue;
      const templateId = pro.defaultSchedule?.[weekdayOf(date)];
      const template = templates.find((t) => t.id === templateId);
      if (!template) continue;
      created.push(shiftFromTemplate(pro.id, date, template));
    }
  }
  return created;
}
