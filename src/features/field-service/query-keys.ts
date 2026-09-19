/** Hierarchical keys so a resource can be invalidated as a whole. */
export const fieldServiceKeys = {
  all: ["field-service"] as const,
  jobs: () => [...fieldServiceKeys.all, "jobs"] as const,
  technicians: () => [...fieldServiceKeys.all, "technicians"] as const,
};
