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
  CONTAINER_TYPES,
  CONTAINERS,
  type Container,
  type ContainerType,
  CUSTOMERS,
  type Customer,
  JOBS,
  type Job,
  mockFetch,
  ROUTES,
  type Route,
  SERVICE_ITEMS,
  SERVICE_POINTS,
  type ServiceItem,
  type ServicePoint,
  SHIFT_TEMPLATES,
  SHIFTS,
  type Shift,
  type ShiftTemplate,
  TECHNICIANS,
  type Technician,
  VEHICLES,
  type Vehicle,
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

  listServiceItems: (): Promise<ServiceItem[]> =>
    mockFetch([...SERVICE_ITEMS].sort((a, b) => a.code.localeCompare(b.code))),

  listContainerTypes: (): Promise<ContainerType[]> =>
    mockFetch(CONTAINER_TYPES),

  listContainers: (): Promise<Container[]> => mockFetch(CONTAINERS),

  listRoutes: (): Promise<Route[]> => mockFetch(ROUTES),

  listVehicles: (): Promise<Vehicle[]> => mockFetch(VEHICLES),

  listShifts: (): Promise<Shift[]> => mockFetch(SHIFTS),

  listShiftTemplates: (): Promise<ShiftTemplate[]> =>
    mockFetch(SHIFT_TEMPLATES),
};
