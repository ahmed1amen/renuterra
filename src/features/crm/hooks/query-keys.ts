/** Hierarchical keys so a resource can be invalidated as a whole. */
export const crmKeys = {
  all: ["crm"] as const,
  leads: () => [...crmKeys.all, "leads"] as const,
  lead: (id: string) => [...crmKeys.leads(), id] as const,
  contacts: () => [...crmKeys.all, "contacts"] as const,
  deals: () => [...crmKeys.all, "deals"] as const,
  activities: () => [...crmKeys.all, "activities"] as const,
};
