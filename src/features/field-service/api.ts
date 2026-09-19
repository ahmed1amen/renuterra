/**
 * Field Service data access used by the prototype screens.
 *
 * Today every function resolves from `@/mocks`. To point the screens at the
 * real backend, swap these bodies for `Api.*` calls — the hooks and screens
 * that consume them stay untouched.
 */
import {
  JOBS,
  type Job,
  mockFetch,
  TECHNICIANS,
  type Technician,
} from "@/mocks";

export const fieldServiceApi = {
  listJobs: (): Promise<Job[]> =>
    mockFetch(
      [...JOBS].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    ),

  listTechnicians: (): Promise<Technician[]> => mockFetch(TECHNICIANS),
};
