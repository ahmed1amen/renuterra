"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  DEFAULT_MOCK_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/mocks";
import { DEFAULT_VIEWPORT, isViewport, type Viewport } from "../viewports";

const DEVICE_PARAM = "device";
const SCENARIO_PARAM = "scenario";

/**
 * Playground state lives in the URL so a review link captures exactly what the
 * reviewer saw: `?device=android&scenario=empty`. Defaults are omitted.
 */
export function usePlaygroundParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawDevice = searchParams.get(DEVICE_PARAM);
  const device: Viewport = isViewport(rawDevice) ? rawDevice : DEFAULT_VIEWPORT;

  const rawScenario = searchParams.get(SCENARIO_PARAM);
  const scenario: MockScenario = isMockScenario(rawScenario)
    ? rawScenario
    : DEFAULT_MOCK_SCENARIO;

  const setParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      const next = new URLSearchParams(searchParams);
      if (value === defaultValue) next.delete(key);
      else next.set(key, value);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setDevice = useCallback(
    (next: Viewport) => setParam(DEVICE_PARAM, next, DEFAULT_VIEWPORT),
    [setParam],
  );

  const setScenario = useCallback(
    (next: MockScenario) =>
      setParam(SCENARIO_PARAM, next, DEFAULT_MOCK_SCENARIO),
    [setParam],
  );

  /** Append the current playground params to a playground href. */
  const withParams = useCallback(
    (href: string) => {
      const query = searchParams.toString();
      return query ? `${href}?${query}` : href;
    },
    [searchParams],
  );

  return { device, setDevice, scenario, setScenario, withParams };
}
