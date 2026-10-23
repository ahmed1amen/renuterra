# Screens and UI patterns

This is the module map for the prototype. Field Ops screens mirror Aspyn's field-service app, adapted to waste. CRM screens are the revamp of the current Renuterra CRM. Build in roughly this order; each row is one screen spec.

## Field Ops (`src/app/field-service/`)

Nav groups: **Operate** · **Organization** · **Settings**. A **Service Center selector** sits in the top bar and scopes every screen.

| Route | Screen | Purpose / key content |
| --- | --- | --- |
| `/field-service` | Dashboard | KPI cards for the selected center and period: scheduled, completed, completion rate, failed visits, tonnage by stream, active routes, vehicle utilisation; charts by stream and by day. |
| `/field-service/dispatch` | Dispatch | Full-bleed daily board. Map above a timeline (draggable splitter), with a right panel holding Routes and Backlog tabs. See below. |
| `/field-service/shift-board` | Shift Board | Week grid of service pros × days with shift blocks (coloured by shift type), capacity vs demand, Autofill. |
| `/field-service/appointments` | Appointments | Table with column filters (customer, SP, service pro, window, stream, type, status), date range, tabs Appointments / Work Orders. |
| `/field-service/appointments/[id]` | Appointment detail | Stacked cards (info + actions, work orders, disposal records, service report with photos, proof of service, notes, activity history) plus a sticky metadata sidebar. |
| `/field-service/routes/[id]` | Route detail | Ordered stops, crew, vehicle, load vs capacity, tipping trips, history. |
| `/field-service/service-pros` (+ `[id]`) | Service Pros | Profile: info, home center, skills, licences (with expiry), default schedule, shifts, performance. |
| `/field-service/vehicles` (+ `[id]`) | Fleet | Vehicles by class, status, capacity, assigned routes, maintenance. *Waste-specific.* |
| `/field-service/service-points` (+ `[id]`) | Service Points | Operational view of a site: containers, subscriptions, upcoming and past appointments, access notes, map. |
| `/field-service/facilities` | Disposal Facilities | Facilities, weighbridge tickets, tonnage in by stream. *Waste-specific.* |
| `/field-service/service-centers` (+ `[id]`) | Service Centers | Depot config: timezone, location, areas, teams, holidays/exclusions. |
| `/field-service/serviceability` | Serviceability | Map of area/zone polygons. |
| `/field-service/settings/*` | Settings | Skills, service items & durations, arrival windows, shift templates, cancel/failed reasons, holidays. |

### Dispatch board (the flagship screen)

- **Header:** date nav (prev/today/next, holiday label), service center select, team filter, stream filter, auto-refresh, and actions Auto-Plan, Optimize All, Generate Routes.
- **Map:** one colour per route; polylines with numbered stops; backlog pins; vehicle markers; area boundaries; facility markers for tipping. Dropping a backlog pin on a route assigns it.
- **Timeline:** one row per route on an hour grid (04:00–24:00, since waste runs early and at night) with a now line. Appointment blocks show a tinted background, a stream-coloured left bar and a status icon. Blocks drag between rows and snap to 15 min. Breaks and tipping trips have their own blocks.
- **Routes panel:** route card with crew avatars, vehicle and class, capacity bar (stops and kg), km and drive time, lock state, skill/vehicle mismatch warning. Route menu: Optimize, Lock/Unlock, Duplicate, Move appointments, Assign/Swap crew, Change vehicle, Unassign all, History.
- **Backlog panel:** tiers (overdue, due now, out of compliance, not notified) with filters and search.
- **Appointment popover:** customer and SP, stream, containers, window, last service, flags; actions assign, unassign, reschedule, cancel, open.

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
