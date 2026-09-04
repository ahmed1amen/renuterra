/**
 * CRM data access used by the prototype screens.
 *
 * Today every function resolves from `@/mocks`. To point the screens at the
 * real backend, swap these bodies for `Api.*` calls — the hooks and screens
 * that consume them stay untouched.
 */
import { ApiError } from "@/lib/api/errors";
import {
  ACTIVITIES,
  type Activity,
  CONTACTS,
  type Contact,
  DEALS,
  type Deal,
  LEADS,
  type Lead,
  mockFetch,
} from "@/mocks";

export const crmApi = {
  listLeads: (): Promise<Lead[]> => mockFetch(LEADS),

  getLead: async (id: string): Promise<Lead> => {
    const lead = await mockFetch(LEADS.find((l) => l.id === id) ?? null);
    if (!lead) throw new ApiError(`Lead ${id} not found`, 404, null);
    return lead;
  },

  listContacts: (): Promise<Contact[]> => mockFetch(CONTACTS),

  listDeals: (): Promise<Deal[]> => mockFetch(DEALS),

  listActivities: (): Promise<Activity[]> =>
    mockFetch(
      [...ACTIVITIES].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    ),
};
