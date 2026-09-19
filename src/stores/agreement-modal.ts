"use client";

import { create } from "zustand";

/**
 * Whether the new-agreement wizard is open. It lives outside the Sales app so
 * the sidebar's primary action can open it without the layout importing a
 * screen — the Sales pages mount the modal itself.
 */
type AgreementModalState = {
  open: boolean;
  /** Lead the agreement starts from, when opened off a lead row. */
  leadId?: string;
  openModal: (leadId?: string) => void;
  close: () => void;
};

export const useAgreementModal = create<AgreementModalState>((set) => ({
  open: false,
  openModal: (leadId) => set({ open: true, leadId }),
  close: () => set({ open: false, leadId: undefined }),
}));
