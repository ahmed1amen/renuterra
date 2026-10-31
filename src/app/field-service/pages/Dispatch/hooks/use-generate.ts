"use client";

import { useCallback } from "react";
import {
  type GenerationSummary,
  useInstanceGenerator,
  useRouteInstanceStore,
} from "@/features/field-service";

/** Flags a dispatcher has to look at before the shift. */
const ATTENTION = new Set([
  "unstaffed",
  "over-capacity",
  "outside-window",
  "contract-skipped",
]);

export type GenerationResult = GenerationSummary & {
  /** First day in the run with something to resolve, else the first day. */
  firstAffectedDay: string;
};

/**
 * Wraps the engine run for the board: generate, then find the first day
 * whose new instances carry a flag so the summary can jump straight there.
 */
export function useGenerate() {
  const { generate, ready } = useInstanceGenerator();

  const run = useCallback(
    (days: string[]): GenerationResult | null => {
      const summary = generate(days);
      if (!summary) return null;
      // The generator writes synchronously, so the store already has them.
      const created = useRouteInstanceStore
        .getState()
        .added.filter((i) => days.includes(i.date));
      const flagged = created
        .filter((i) => i.flags.some((f) => ATTENTION.has(f.kind)))
        .map((i) => i.date)
        .sort();
      return {
        ...summary,
        firstAffectedDay: flagged[0] ?? days[0],
      };
    },
    [generate],
  );

  return { run, ready };
}
