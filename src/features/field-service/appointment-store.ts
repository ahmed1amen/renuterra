"use client";

import { useMemo } from "react";
import { create } from "zustand";
import {
  type Appointment,
  type AppointmentServiceType,
  type AppointmentType,
  type ArrivalWindow,
  MOCK_NOW,
  type ServiceItem,
  type ServiceLine,
} from "@/mocks";
import { useAppointmentsQuery } from "./hooks/use-appointments-query";
import { newWorkOrder } from "./work-orders";

/** What the booking dialog collects; the store fills in the rest. */
export type BookingInput = {
  customerId: string;
  servicePointId: string;
  serviceLine: ServiceLine;
  serviceItem: ServiceItem;
  type: AppointmentType;
  serviceType: AppointmentServiceType;
  window: ArrivalWindow;
  windowStart: string;
  windowEnd: string;
  /** `null` leaves it in the backlog for dispatch to route. */
  routeInstanceId: string | null;
  notes?: string;
  originalAppointmentId?: string;
};

let bookingSeq = 30000;

/** A new appointment from a booking — fake refs, one work order for the service line. */
function toAppointment(input: BookingInput): Appointment {
  const seq = bookingSeq++;
  const line = input.serviceLine;
  const item = input.serviceItem;
  const workOrder = newWorkOrder(item, line.quantity, line.containerIds);
  return {
    id: `apt_${seq}`,
    ref: `APT-${seq}`,
    customerId: input.customerId,
    servicePointId: input.servicePointId,
    serviceLineId: line.id,
    type: input.type,
    serviceType: input.serviceType,
    stream: item.stream,
    source: "customer-request",
    status: "scheduled",
    window: input.window,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    plannedStart: input.windowStart,
    durationMins: Math.max(
      10,
      Math.round(5 + item.minutesPerUnit * line.quantity),
    ),
    routeInstanceId: input.routeInstanceId,
    workOrders: [workOrder],
    startedAt: null,
    completedAt: null,
    failedReason: null,
    cancelReason: null,
    notes: input.notes,
    originalAppointmentId: input.originalAppointmentId,
    createdAt: MOCK_NOW,
    // The prototype's signed-in user.
    bookedBy: "usr_1",
  };
}

/**
 * Appointments booked and changed during this session. Prototype-grade like
 * the dispatch store: fixtures stay untouched and everything resets on reload.
 */
type AppointmentState = {
  /** Booked in this session, newest first. */
  booked: Appointment[];
  /** Field overrides per appointment id (status changes, reschedules…). */
  patches: Record<string, Partial<Appointment>>;
  /** Adds the booking and returns the appointment it became. */
  book: (input: BookingInput) => Appointment;
  /** Adds appointments made elsewhere — e.g. stops the dispatch engine generated. */
  addMany: (appointments: Appointment[]) => void;
  update: (id: string, patch: Partial<Appointment>) => void;
};

export const useAppointmentStore = create<AppointmentState>((set) => ({
  booked: [],
  patches: {},
  book: (input) => {
    const appointment = toAppointment(input);
    set((state) => ({ booked: [appointment, ...state.booked] }));
    return appointment;
  },
  addMany: (appointments) =>
    set((state) => ({ booked: [...appointments, ...state.booked] })),
  update: (id, patch) =>
    set((state) => ({
      patches: { ...state.patches, [id]: { ...state.patches[id], ...patch } },
    })),
}));

/** Fixtures plus this session's bookings and edits, soonest first. */
export function useAppointments() {
  const query = useAppointmentsQuery();
  const booked = useAppointmentStore((s) => s.booked);
  const patches = useAppointmentStore((s) => s.patches);

  const data = useMemo(() => {
    if (!query.data) return undefined;
    return [...booked, ...query.data]
      .map((a) => (patches[a.id] ? { ...a, ...patches[a.id] } : a))
      .sort((a, b) => a.plannedStart.localeCompare(b.plannedStart));
  }, [query.data, booked, patches]);

  return { ...query, data };
}

/** One appointment, `null` once loaded if the id is unknown. */
export function useAppointment(id: string) {
  const query = useAppointments();
  const appointment = useMemo(
    () =>
      query.data ? (query.data.find((a) => a.id === id) ?? null) : undefined,
    [query.data, id],
  );
  return { ...query, data: appointment };
}
