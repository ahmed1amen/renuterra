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
  mockFetch,
  OPS_MASTERS,
  type OpsMasters,
  ROUTE_ASSIGNMENTS,
  ROUTE_INSTANCES,
  ROUTES,
  type Route,
  type RouteAssignment,
  type RouteInstance,
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

  listRouteInstances: (): Promise<RouteInstance[]> =>
    mockFetch(ROUTE_INSTANCES),

  listRoutes: (): Promise<Route[]> => mockFetch(ROUTES),

  listRouteAssignments: (): Promise<RouteAssignment[]> =>
    mockFetch(ROUTE_ASSIGNMENTS),

  getOpsMasters: (): Promise<OpsMasters> => mockFetch(OPS_MASTERS),

  listVehicles: (): Promise<Vehicle[]> => mockFetch(VEHICLES),

  listShifts: (): Promise<Shift[]> => mockFetch(SHIFTS),

  listShiftTemplates: (): Promise<ShiftTemplate[]> =>
    mockFetch(SHIFT_TEMPLATES),
};
