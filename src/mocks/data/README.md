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
| `jobs.json` | `Job[]` | `useJobs()` — Field Service work orders |

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
