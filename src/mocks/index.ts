/**
 * Typed fake data for the app screens and tests.
 *
 * Every fixture is a JSON file in `./data` — edit those, not this. Nothing here
 * talks to the network; `mockFetch` only adds latency and honours the active
 * `MockScenario` so screens can demo their loading/empty/error UI.
 */
export { ACTIVITIES } from "./activities";
export { APPOINTMENTS } from "./appointments";
export { CONTACTS } from "./contacts";
export { CONTAINER_TYPES } from "./container-types";
export { CONTAINERS } from "./containers";
export { CUSTOMERS, findCustomer } from "./customers";
export { DEAL_STAGES, DEALS } from "./deals";
export { JOBS } from "./jobs";
export { LEADS } from "./leads";
export { MOCK_NOW, mockFetch } from "./mock-fetch";
export {
  DEFAULT_MOCK_SCENARIO,
  isMockScenario,
  MOCK_SCENARIOS,
  type MockScenario,
  useMockScenarioStore,
} from "./scenario";
export { findServiceItem, SERVICE_ITEMS } from "./service-items";
export { findServicePoint, SERVICE_POINTS } from "./service-points";
export { findTechnician, TECHNICIANS } from "./technicians";
export type * from "./types";
export { findUser, USERS } from "./users";
