"use client";

import { create } from "zustand";

/**
 * Global switch that makes every mock request behave a certain way, so a
 * reviewer can see a screen's loading, empty and error states on demand.
 */
export const MOCK_SCENARIOS = ["default", "empty", "error", "loading"] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export const DEFAULT_MOCK_SCENARIO: MockScenario = "default";

export function isMockScenario(value: unknown): value is MockScenario {
  return MOCK_SCENARIOS.includes(value as MockScenario);
}

type MockScenarioState = {
  scenario: MockScenario;
  setScenario: (scenario: MockScenario) => void;
};

export const useMockScenarioStore = create<MockScenarioState>((set) => ({
  scenario: DEFAULT_MOCK_SCENARIO,
  setScenario: (scenario) => set({ scenario }),
}));
