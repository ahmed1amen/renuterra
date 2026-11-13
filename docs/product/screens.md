# Screens and UI patterns

This is the module map for the prototype. Field Ops screens mirror Aspyn's field-service app, adapted to waste. CRM screens are the revamp of the current Renuterra CRM. Rows marked *(planned)* are not built yet; everything else exists.

## Field Ops (`src/app/field-service/`)

Nav groups: an unlabelled main group (Dashboard, Dispatch, Routes, Appointments, Shift board, Reports), **Organization** (Customers, Service pros, Fleet) and **Settings** (Service items, Container types, Shift templates, Lookups). Every nav entry is also reachable from the ⌘K command palette. There are no service centers, so screens aren't scoped by depot.

| Route | Screen | Purpose / key content |
| --- | --- | --- |
| `/field-service` | Dashboard | KPIs (each opens the rows behind it): runs today, unstaffed runs (next 7 days, opens Dispatch on the first such day), stops done today, kg collected today, backlog across all days, failed visits. Cards: today's runs, needs attention, tomorrow, runs this week by day, tonnage by stream this week. |
| `/field-service/dispatch` | Dispatch | Full-bleed daily board. Map above a timeline (draggable splitter), with a right panel holding Routes and Backlog tabs. See below. |
| `/field-service/shift-board` | Shift Board | Week grid (Sunday-first) of service pros × days, drivers and loaders grouped; shift blocks coloured by type; the route each pro is on; conflicts (on a route without a shift); coverage row (drivers on shift vs routes and stops); Autofill from default schedules, copy previous week. |
| `/field-service/appointments` | Appointments | KPI tiles that filter the list in place (today, in the field, failed, backlog, projected); filters also start from the link (`?period=`, `?status=`, `?backlog=1`, `?view=work-orders`). Period chips, status/stream filters, search; tabs **Appointments** / **Work orders** (status, handling method, stream; count and weight against plan). |
| `/field-service/appointments/[id]` | Appointment detail | Reschedule asks for a reason and who asked. Stacked cards (info + actions, work orders with per-order status / count / weight / evidence and on-site **Record** close-out by handling method, proof of service, notes, activity history) plus a sticky metadata sidebar. |
| `/field-service/routes` | Routes | Route templates: code, name, status, schedule, truck type, planned utilisation, score; **New route**. |
| `/field-service/routes/[id]` | Route detail | Tabs: Definition (with a **Capacity** card listing every truck limit on the busiest day and the binding one), Resources, Service lines (stop order; **Consumes** per line with its fill rate, the suggested rate from history and **Accept**), Schedule, **Performance** (planned vs actual by week on the binding limit as a bullet chart, fill level by weekday against the standard, missed and moved stops by reason, substitution tiles, and a trips-per-shift suggestion with Accept; `?tab=performance` opens it), History. |
| `/field-service/reports` | Reports | The six standard Route reports (spec section 11): KPI tiles (runs today, missed and moved stops, substitutions, expiring in 30 days), route utilisation planned vs actual over 4 weeks (links to each route's Performance tab), missed and rescheduled stops by reason, substitution log, expiring certifications and permits with the routes they affect, a link to Dispatch for the daily board, and route profitability (planned: needs CRM prices and Business Central costs). |
| `/field-service/service-pros` (+ `[id]`) | Service Pros | List with today's shift and route; profile with week schedule, default schedule, licences (with expiry), routes. |
| `/field-service/settings/shift-templates` | Shift templates | Reusable shift windows and which pros' default schedules use them. |
| `/field-service/customers` (+ `[id]`) | Customers | List; detail with tabs Overview (Next visits: route-scheduled visits plus ad-hoc jobs with their dispatch state and **Add to its run**), Service points (service lines and their projected visits), Appointments, Contacts. |
| `/field-service/fleet` | Fleet | Trucks by type, entity and status; registration and insurance expiry; pool trucks; detail in a sheet. *Waste-specific.* |
| `/field-service/service-points` (+ `[id]`) | Service Points *(planned)* | Operational view of a site: containers, upcoming and past appointments, access notes, map. Today service points live in the customer detail's Service points tab. |
| `/field-service/facilities` | Disposal Facilities *(planned)* | Facilities, weighbridge tickets, tonnage in by stream. Today sites appear on the Dispatch map and in Lookups. *Waste-specific.* |
| `/field-service/serviceability` | Serviceability *(planned)* | Map of area/zone polygons. |
| `/field-service/settings/service-items` | Service items | The service catalogue: code, stream, handling method, count unit, est. kg, container type, vehicle, weight source, compliance flags; archive instead of delete. |
| `/field-service/settings/container-types` | Container types | Bins, skips, RORO, compactors, tanks; tagged vs consumable; containers in use. |
| `/field-service/settings/ops-lists` | Lookups | Read-only lookup lists: entities, cities, depots, disposal sites, service types, truck types, skill codes, waste codes, shifts. |
| `/field-service/settings/*` | Other settings *(planned)* | Skills, arrival windows, cancel/failed/shortfall reasons, holidays. |

### Dispatch board (the flagship screen)

- **Header:** date strip (prev/next day and week, month picker) and day stats (routes, stops, unstaffed). Planning actions sit at the top of the right panel: **Generate**, **Auto-Plan** (Place backlog, Optimize all) and **Confirm ready**, under counts of routes, runs ready to confirm and runs **to close**. Auto-Plan also holds **Cancel the day** (every run not started, e.g. a public holiday).
- **Map:** one colour per route; polylines with numbered stops; backlog pins; vehicle markers. Stream filter, stop count, **Sites** and **Backlog** pills float on top; legend bottom-left. Depots and disposal sites are square badges (icon per site kind, tooltip with accepted waste codes), with a dashed leg from each tipping trip's stop to its facility; selecting a route highlights its own depot and sites and dims the rest; a **Sites** pill hides them. Clicking a pin selects the appointment (its card opens in the right panel).
- **Timeline:** one row per route (stops done / planned, run score) on an hour grid (04:00–24:00, since waste runs early and at night) with a now line. Appointment blocks show a tinted background, a stream-coloured left bar and a status icon. Blocks drag between rows and snap to 15 min. Breaks and tipping trips have their own blocks.
- **Routes panel:** route card with crew avatars, vehicle and class, a **stops done / planned** bar (progress, not capacity) and a **load bar** on the binding limit (worst case grey, forecast solid, actual filling in as stops complete; amber at 90%, red over 100%), the other limit when it's close behind, **Running heavy** and "Forecast at Confirm X%, now Y%" notes, an **Over capacity** box with its two fixes (move N stops to the run with room, or accept N extra trips), an eligibility line per crew member or truck that fails a check today (red blocks a plain Confirm, amber expires within 30 days), the score badge (hover: "This run" breakdown; the Route page's badge is the "Route design" score), km and drive time, lock state, skill/vehicle mismatch warning. Route menu: **Close run…** (once the day has come and work began), **Cancel run…** (not started, not closed; reason kept), Confirm (or Confirm anyway with blockers), Reopen, Optimize stop order, Change vehicle, Change driver, Send open stops to backlog. A closed run shows a **Closed** badge and a summary line (closed at, stops resolved, weighbridge vs stops, adjustments), and its menu offers only **Add adjustment…**.
- **Backlog panel:** the day's unrouted stops, each with its default route proposed (Add to its instance, Assign to route), then an **Overdue** section for earlier days. Tiers, filters and search are planned.
- **Selected appointment card:** picking a pin or a timeline block shows the appointment in the right panel: customer and site, stream, window, status, with assign / unassign / open.

## CRM (revamp of Renuterra-crm)

| Area | Screens |
| --- | --- |
| Sales (`/sales`) | Dashboard (targets vs actual, MRR/SER), Leads, Opportunities (board), Quotes + Quote Builder (catalogue items × service points, price per UOM, frequency/days, MOQ, rebate, rental), Contracts (lifecycle, renewals), Pipeline Tracker, Price Engine (cost-plus with margin badge). |
| Customers (`/customers`) | List; detail as tabbed sub-routes under a collapsible header with summary cards (balance, active SPs, contracts): Overview, Service Points, Contacts, Billing Entities, Contracts, Subscriptions, Appointments, Invoices, Documents, Proof of Service, Notes. Split the old 578 KB page into these tabs. |
| Finance (`/finance`) | Monthly invoicing run (pick company + month → preview → drafts → confirm → send), Invoices list, AR/DSO intelligence, Missing-revenue scan. |
| Customer Service (`/customer-service`) | Dashboard, Cases (list + detail with comments), Calls log. |
| Compliance & ESG | Destruction Certificates (request → ops → payment → completed), Waste Summary report (recycled / landfill / special, diversion rate, CO₂e), Orders/collections report. |
| Customer Portal (`/portal`) | Dashboard (tier banner, 12-month collections chart), Invoices, Collections, Reports/certificates, Support cases. |

## UI patterns to follow

- **Page shape:** breadcrumb, then `PageHeader` (title + actions), then content. Detail pages put stacked cards on the left and a sticky metadata sidebar on the right. Only map/board screens are full-bleed (`AppLayout fullWidth`).
- **Lists:** header with search, filters toggle, clear filters, refresh, primary "+" action. Column-header filters, sortable headers, pagination footer with totals. Keep list state in the URL (search params) so views are shareable.
- **Overlays:** full pages for entity detail; a **drawer** (Sheet) for quick-look detail; **popovers** on map/timeline items; **dialogs** for every mutation (assign, reschedule and cancel with a reason select + note). Bulk actions also use dialogs.
- **States:** a skeleton per screen for loading, `EmptyState` with a call to action, `ErrorState` with retry, and toast feedback after every fake mutation.
- **Status display:** `StatusPill` with consistent semantics across the app:

  | Tone | Statuses |
  | --- | --- |
  | Neutral / info | scheduled, confirmed |
  | Active | en-route, in-progress |
  | Warning | paused, at-risk, due-now |
  | Success | completed |
  | Danger | failed, overdue |
  | Neutral (closed) | cancelled |

  Never use colour alone; pair it with a label or icon.
- **Waste streams:** always shown with `StreamTag` and its fixed colour.
- **Time:** show in Dubai time with explicit windows ("08:00–10:00"). Use relative time ("in 25 min", "2 h ago") for live ops.
- **Maps:** OpenStreetMap via the existing `osm-map` component; route colours, numbered stops, legend.
- **Prototype feedback:** label Alpha/Beta screens with a badge when they're deliberately partial.
