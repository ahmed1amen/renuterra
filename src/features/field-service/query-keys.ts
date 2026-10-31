/** Hierarchical keys so a resource can be invalidated as a whole. */
export const fieldServiceKeys = {
  all: ["field-service"] as const,
  technicians: () => [...fieldServiceKeys.all, "technicians"] as const,
  customers: () => [...fieldServiceKeys.all, "customers"] as const,
  customer: (id: string) => [...fieldServiceKeys.customers(), id] as const,
  servicePoints: () => [...fieldServiceKeys.all, "service-points"] as const,
  appointments: () => [...fieldServiceKeys.all, "appointments"] as const,
  serviceItems: () => [...fieldServiceKeys.all, "service-items"] as const,
  containerTypes: () => [...fieldServiceKeys.all, "container-types"] as const,
  containers: () => [...fieldServiceKeys.all, "containers"] as const,
  routeInstances: () => [...fieldServiceKeys.all, "route-instances"] as const,
  routes: () => [...fieldServiceKeys.all, "routes"] as const,
  routeAssignments: () =>
    [...fieldServiceKeys.all, "route-assignments"] as const,
  opsMasters: () => [...fieldServiceKeys.all, "ops-masters"] as const,
  vehicles: () => [...fieldServiceKeys.all, "vehicles"] as const,
  shifts: () => [...fieldServiceKeys.all, "shifts"] as const,
  shiftTemplates: () => [...fieldServiceKeys.all, "shift-templates"] as const,
};
