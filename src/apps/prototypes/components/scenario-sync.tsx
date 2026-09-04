"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { crmKeys } from "@/features/crm";
import { useMockScenarioStore } from "@/mocks";
import { usePlaygroundParams } from "../hooks";

/**
 * Pushes the `?scenario=` param into the mock store and resets CRM queries when
 * it changes. Render it *before* the prototype in tree order so its effect runs
 * ahead of the screen's first fetch.
 */
export function ScenarioSync() {
  const { scenario } = usePlaygroundParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const store = useMockScenarioStore.getState();
    if (store.scenario === scenario) return;
    store.setScenario(scenario);
    queryClient.resetQueries({ queryKey: crmKeys.all });
  }, [scenario, queryClient]);

  return null;
}
