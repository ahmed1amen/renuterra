import { ApiError } from "@/lib/api/errors";
import { useMockScenarioStore } from "./scenario";

type MockFetchOptions = {
  /** Milliseconds to wait before resolving. Defaults to a random 350–900ms. */
  delay?: number;
};

/** Fixed "now" so relative timestamps in fixtures are stable across renders. */
export const MOCK_NOW = "2026-09-04T09:00:00Z";

function randomLatency() {
  return 350 + Math.floor(Math.random() * 550);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolves `data` after artificial latency, honouring the active mock scenario:
 *  - `empty`   resolves an empty array (or `null` for single records)
 *  - `error`   rejects with a 500 ApiError
 *  - `loading` never resolves
 */
export async function mockFetch<T>(
  data: T,
  { delay = randomLatency() }: MockFetchOptions = {},
): Promise<T> {
  const { scenario } = useMockScenarioStore.getState();

  if (scenario === "loading") {
    return new Promise<T>(() => undefined);
  }

  await wait(delay);

  if (scenario === "error") {
    throw new ApiError("Mock request failed", 500, null);
  }

  if (scenario === "empty") {
    return (Array.isArray(data) ? [] : null) as T;
  }

  return data;
}
