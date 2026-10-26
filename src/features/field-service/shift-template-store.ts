"use client";

import { useMemo } from "react";
import { create } from "zustand";
import type { ShiftTemplate } from "@/mocks";
import { useShiftTemplatesQuery } from "./hooks/use-shifts-query";

/** Ids of templates created this session. */
export const NEW_TEMPLATE_PREFIX = "tpl_new_";

/**
 * Shift template edits made during this session: fixture templates patched by
 * id, plus templates added here. Prototype-grade: resets on reload.
 */

type TemplateState = {
  edits: Record<string, ShiftTemplate>;
  added: ShiftTemplate[];
  save: (template: ShiftTemplate) => void;
};

export const useShiftTemplateStore = create<TemplateState>((set) => ({
  edits: {},
  added: [],
  save: (template) =>
    set((state) => {
      if (state.added.some((t) => t.id === template.id))
        return {
          added: state.added.map((t) => (t.id === template.id ? template : t)),
        };
      if (template.id.startsWith(NEW_TEMPLATE_PREFIX))
        return { added: [...state.added, template] };
      return { edits: { ...state.edits, [template.id]: template } };
    }),
}));

/** Fixture templates plus this session's edits and additions. */
export function useShiftTemplates() {
  const query = useShiftTemplatesQuery();
  const edits = useShiftTemplateStore((s) => s.edits);
  const added = useShiftTemplateStore((s) => s.added);

  const data = useMemo(
    () =>
      query.data
        ? [...query.data.map((t) => edits[t.id] ?? t), ...added]
        : undefined,
    [query.data, edits, added],
  );

  return { ...query, data };
}
