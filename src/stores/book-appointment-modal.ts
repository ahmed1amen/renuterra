"use client";

import { create } from "zustand";
import type { AppointmentType } from "@/mocks";

/** What the booking dialog opens pre-filled with. */
export type BookingPreset = {
  customerId?: string;
  servicePointId?: string;
  serviceLineId?: string;
  type?: AppointmentType;
  /** The failed or incomplete visit a reservice follows up. */
  originalAppointmentId?: string;
};

/**
 * Whether the book-appointment dialog is open. A store rather than local
 * state so customer, service point and appointment screens can all open it
 * with their own context.
 */
type BookAppointmentModalState = {
  open: boolean;
  preset: BookingPreset;
  openModal: (preset?: BookingPreset) => void;
  close: () => void;
};

export const useBookAppointmentModal = create<BookAppointmentModalState>(
  (set) => ({
    open: false,
    preset: {},
    openModal: (preset = {}) => set({ open: true, preset }),
    close: () => set({ open: false, preset: {} }),
  }),
);
