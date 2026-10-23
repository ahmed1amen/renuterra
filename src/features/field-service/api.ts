/**
 * Field Service data access used by the prototype screens.
 *
 * Today every function resolves from `@/mocks`. To point the screens at the
 * real backend, swap these bodies for `Api.*` calls — the hooks and screens
 * that consume them stay untouched.
 */
import {
  APPOINTMENTS,
  type Appointment,
  CUSTOMERS,
  type Customer,
  JOBS,
  type Job,
  mockFetch,
  SERVICE_POINTS,
  type ServicePoint,
  TECHNICIANS,
  type Technician,
} from "@/mocks";

export const fieldServiceApi = {
  listJobs: (): Promise<Job[]> =>
    mockFetch(
      [...JOBS].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    ),

  listTechnicians: (): Promise<Technician[]> => mockFetch(TECHNICIANS),

  listCustomers: (): Promise<Customer[]> =>
    mockFetch([...CUSTOMERS].sort((a, b) => a.name.localeCompare(b.name))),

  getCustomer: (id: string): Promise<Customer | null> =>
    mockFetch(CUSTOMERS.find((c) => c.id === id) ?? null),

  listServicePoints: (): Promise<ServicePoint[]> => mockFetch(SERVICE_POINTS),

  listAppointments: (): Promise<Appointment[]> => mockFetch(APPOINTMENTS),
};
