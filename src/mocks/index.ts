/**
 * Typed fake CRM data for prototypes and tests.
 *
 * Nothing here talks to the network; `mockFetch` only adds latency and honours
 * the active `MockScenario` so screens can demo their loading/empty/error UI.
 */
export { ACTIVITIES } from "./activities";
export { CONTACTS } from "./contacts";
export { DEAL_STAGES, DEALS } from "./deals";
export { LEADS } from "./leads";
export { MOCK_NOW, mockFetch } from "./mock-fetch";
export {
  DEFAULT_MOCK_SCENARIO,
  isMockScenario,
  MOCK_SCENARIOS,
  type MockScenario,
  useMockScenarioStore,
} from "./scenario";
export type * from "./types";
export { findUser, USERS } from "./users";
