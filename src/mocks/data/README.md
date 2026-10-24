# Mock data

One JSON file per dataset. These are the dummy fixtures the prototype screens
render — edit them freely, no code changes needed.

| File | Shape (`src/mocks/types.ts`) | Used by |
| --- | --- | --- |
| `users.json` | `User[]` | owners/actors referenced by `ownerId` / `actorId` |
| `leads.json` | `Lead[]` | `useLeads()` |
| `contacts.json` | `Contact[]` | `useContacts()` |
| `deals.json` | `Deal[]` | `useDeals()` |
| `deal-stages.json` | `{ id: DealStage; label: string }[]` | pipeline column order |
| `activities.json` | `Activity[]` | `useActivities()` |
| `technicians.json` | `Technician[]` | `useTechnicians()` — Field Service crew |
| `jobs.json` | `Job[]` | `useJobs()` — dispatch board (legacy; being replaced by appointments) |
| `customers.json` | `Customer[]` | `useCustomers()`, `useCustomer(id)` — Field Ops customers with contacts |
| `service-points.json` | `ServicePoint[]` | `useServicePoints()` — sites with their contracted service lines |
| `service-items.json` | `ServiceItem[]` | `useServiceItems()` — service catalogue; each item's handling method drives its work orders |
| `container-types.json` | `ContainerType[]` | `useContainerTypes()` — container catalogue (bins, skips, RORO, bags…) |
| `containers.json` | `Container[]` | `useContainers()` — tagged containers at service points or in the depot |
| `appointments.json` | `Appointment[]` | `useAppointments()`, `useAppointment(id)` — visits around `MOCK_NOW` with their work orders, merged with session bookings/edits |

## Adding a dataset

1. Add `<name>.json` here.
2. Add its type to `src/mocks/types.ts`.
3. Add `src/mocks/<name>.ts`:
   ```ts
   import type { Thing } from "./types";
   import data from "./data/<name>.json";

   export const THINGS = data as Thing[];
   ```
4. Export it from `src/mocks/index.ts`, add a `listThings()` to the owning
   feature's `api.ts` (`src/features/<domain>/api.ts`), then a hook in that
   feature's `hooks/`.

Screens must reach this data through the hooks, never by importing JSON
directly — that keeps `api.ts` the single file to change when the real API lands.
