/** Hierarchical keys so a resource can be invalidated as a whole. */
export const fieldServiceKeys = {
  all: ["field-service"] as const,
  jobs: () => [...fieldServiceKeys.all, "jobs"] as const,
  technicians: () => [...fieldServiceKeys.all, "technicians"] as const,
  customers: () => [...fieldServiceKeys.all, "customers"] as const,
  customer: (id: string) => [...fieldServiceKeys.customers(), id] as const,
  servicePoints: () => [...fieldServiceKeys.all, "service-points"] as const,
  appointments: () => [...fieldServiceKeys.all, "appointments"] as const,
  serviceItems: () => [...fieldServiceKeys.all, "service-items"] as const,
  containerTypes: () => [...fieldServiceKeys.all, "container-types"] as const,
  containers: () => [...fieldServiceKeys.all, "containers"] as const,
};
