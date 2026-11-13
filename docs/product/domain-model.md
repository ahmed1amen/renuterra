# Domain model (prototype)

This is the target shape for mock data in `src/mocks/`. It is simplified for a prototype: keep the fields screens actually show and drop the rest. Terms are defined in [glossary.md](./glossary.md).

## Conventions for mock data

- **Field naming:** camelCase in TypeScript (matches the existing code), even though Aspyn's API uses snake_case.
- **IDs:**
  - Internal ids are prefixed short strings: `cust_01`, `sp_01`, `apt_20508`, `rt_01`, `tech_1`, `veh_1`.
  - Human-facing numbers go in a separate `ref` / `number` field:

  | Entity | Format |
  | --- | --- |
  | Customer | `REN-CUST-000123` |
  | Service point | `REN-SP-000123` |
  | Quote | `SQ-000123` |
  | Contract | `SC-000123` |
  | Work order | `WO-10412` |
  | Invoice | `REN-202609-0001` |
  | Case | `CASE-20260904-0001` |
  | Weighbridge ticket | `WB-…` |

- **Time:** store ISO-8601 UTC strings and display in `Asia/Dubai` (UTC+4, no DST). The mock "now" is `MOCK_NOW` (`2026-09-04T09:00:00Z`, a Friday). Route dates are plain `YYYY-MM-DD`. Shift and route clock times are `HH:mm` local.
- **Work week:** UAE work week is Monday–Friday, with Friday afternoon short. Waste collection runs 7 days, including nights.
- **Money:** AED, VAT 5%. Mock amounts are plain numbers in AED (2 dp); display with `Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" })`.
- **Units:** weight in kg (show tonnes when ≥ 1,000 kg); container volume in L or CBM; distance in km.
- **Phones:** UAE E.164, for example `+971 50 555 0118`.
- **Lifecycle status:** Aspyn derives status from timestamps (`startedAt`, `completedAt`…). In mocks, **store an explicit `status`** and keep the timestamps alongside it when the UI shows them. Reasons are enums; `other` requires a note.

## Entities and statuses

### Organisation

- No **ServiceCenter** entity: Renuterra has no service centers, so nothing carries a `serviceCenterId`.
- **Area**: `id, name, priceZone: "A" | "B" | "C" | "D", canSell, canService`.
- **Team**: `id, name, supervisorId`.
- **ServicePro** (replaces `Technician`):
  - Identity: `id, name, initials, phone, role: "driver" | "loader"` (drivers can be a route's primary; loaders and trainees ride as crew), `employeeId, entity, teamId, zone`. Still typed `Technician` in the mocks.
  - Capabilities: `skills: string[]`, `skillCodes: { code, expiresOn | null }[]` (from the skill master: LIC-HGV, OP-REL, CITY-DXB, SHIFT-NIGHT…), `licences: { type, expiresOn }[]` with types `heavy_vehicle`, `hazmat`, `medical_waste`.
  - Live state: `status: "available" | "on-job" | "off-shift"`, `lat, lng`, `shift`.
- **Vehicle**: `id, plate, truckTypeId, entity | null (pool), permits (cities), registrationExpiry, insuranceExpiry, vehicleClass: "compactor" | "skip-loader" | "hook-loader" | "tanker" | "box-truck", capacityKg, status: "in-service" | "maintenance" | "out-of-service"`.

### Customers and sites

- **Customer**:
  - Identity: `id, number, name, industry, tier: "platinum" | "gold" | "silver" | "bronze"`.
  - Status: `status: "active" | "passive"`, `flags: CustomerFlag[]`.
  - Commercial: `kamId, paymentTerms, creditLimit, trn`.
- **Contact**: `id, customerId, name, role, email, phone, isPrimary`.
- **ServicePoint**: `id, number (REN-SP-000301), customerId, name ("Customer - Location"), location, address, emirate, area, lat, lng, status: "active" | "inactive", accessNotes, attributes: string[], serviceLines: ServiceLine[]`.
- **Container**: `id, tag, containerTypeId, servicePointId | null, stream, ownership: "renuterra" | "customer", location: "on-site" | "in-transit" | "at-facility" | "in-depot" | "maintenance", placedAt, lastServicedAt`. Only tracked container types become containers.
- **ServiceLine** (contracted service at a site; the Field Ops side of a contract line): `id, serviceItemId, quantity (per visit, in the item's count unit), frequency, days[], window, containerIds`. Prices stay on the CRM contract line.

### Catalogue (Field Service → Settings)

- **ContainerType**: `id, name, kind: "bin" | "skip" | "roro" | "compactor" | "tank" | "drum" | "sharps-box" | "bag", capacityLitres, vehicleClass, tracked, active`.
- **ServiceItem**: `id, code, name, stream, method: HandlingMethod, containerTypeId | null, countUnit, estKgPerUnit, minutesPerUnit, vehicleClass, weightSource | null, requiresSeals, requiresConsignmentNote, consumable | null, active, wasteCode` (the fine-grained stream the route rules match on). Archive, never delete: old work orders keep pointing at it.
- **Handling methods** and what each one captures on close-out:

  | Method | Example | Counted in | Weight from | Proof |
  | --- | --- | --- | --- | --- |
  | `empty-on-site` | 1100L general bin | lifts (ticked per tagged bin) | estimate, then the route's weighbridge ticket allocated | fill level, contamination flag |
  | `exchange` | 10 CBM skip, 30 CBM RORO | trips | weighbridge ticket | container taken / left, ticket no., facility |
  | `packaged` | medical bags, sharps boxes, drums | bags / boxes / drums | on-site scale | one seal per unit, consignment note, empties left |
  | `pump-out` | waste oil, grease trap | litres | tanker meter | manifest |
  | `logistics` | deliver / remove / check | containers | - | tag, placement photo |
  | `destruction` | pharmaceuticals | kg | scale | seals, consignment note → destruction certificate |

### Commercial

- Current CRM mocks (`Lead`, `Deal`, `Contact`, `Activity`) are generic placeholders (e.g. lead status `new | contacted | qualified | unqualified`, deal stages `prospecting` to `won | lost` in USD). The enums below are the **target**.
- **Lead status:** `new, contacted, qualified, proposal-sent, negotiation, nurture, unqualified, lost, junk`.
- **Lead source:** `website, referral, cold-call, event, campaign, linkedin, other`.
- **Lead rating:** `hot, warm, cold`.
- **Opportunity stage:** `new, qualified, quoting, negotiation, won, lost`.
- **Quote:**
  - Status: `draft, sent, approved, rejected, converted, cancelled`.
  - Line fields: `serviceItemId, servicePointId, collectionFee + uom, disposalFee + uom, frequency, days[], quantity, moq, rebatePerTon, rentalCharge, ownership`. Collection is usually priced per count unit and disposal per kg/ton: which is why work orders carry both count and weight.
- **Contract:**
  - Status: `draft, active, signed, expired, terminated, superseded`.
  - Fields: `startDate, endDate, revenueType, value`.
  - Expiry rules: past `endDate` becomes `expired`; 30 days after that, if not renewed, it becomes `terminated`.
- **Subscription** (contract line, scheduled):
  - Links: `id, customerId, servicePointId, contractId, serviceItemId, containerIds`.
  - Schedule: `interval: { frequency: "daily" | "weekly" | "monthly" | "on-call", days: DayOfWeek[] }`, `window`, `nextTargetDate, nextWindowStart, nextWindowEnd, lastServicedAt`.
  - Status: `active | paused | frozen | cancelled`.
- **Invoice**: `id, number, customerId, servicePointId?, month "YYYY-MM", lines, subtotal, vat, total, status: "draft" | "confirmed" | "sent" | "paid" | "overdue"`.

### Operations

- **CalendarEvent** base fields: `id, type, calendarOwnerId, startAt, endAt`. `type` is one of `appointment | appointment_reservation | work_break | out_of_office | generic`.
- **Appointment** (replaces `Job`):
  - Identity and links: `id, ref, type: "initial" | "standard" | "reservice"`, `serviceType: collection | delivery | swap | removal | inspection`, `source: recurring | customer-request`, `customerId, servicePointId, serviceLineId | null, routeInstanceId | null, stream`, `bookedBy` (a user id, or "system"). No service pro field: the pro is the instance's driver; `routeInstanceId: null` = backlog.
  - Scheduling: `window: "AM" | "PM" | "night" | "AT"`, `windowStart, windowEnd, plannedStart, durationMins`. A `timed` window and `priority` are planned.
  - Status: `scheduled | confirmed | en-route | in-progress | completed | failed | cancelled`. `paused` and `rescheduled` are planned.
  - Lifecycle timestamps: `startedAt, completedAt, createdAt` (`confirmedAt`, `cancelledAt` planned).
  - Reasons and notes: `cancelReason, failedReason, notes`.
  - Transitions:
    - scheduled → confirmed → en-route → in-progress → completed | failed (pausing is planned)
    - scheduled/confirmed → cancelled
    - cancelled → scheduled ("uncancel"): planned
    - A failed visit can be followed by a **reservice**: a new appointment linked via `originalAppointmentId`.
    - **Reschedule** moves the visit to another day and window and records `rescheduled { reason, requestedBy: customer | operations, fromDay, at }`. Reasons: `customer_request, access_issue, vehicle_full, ran_out_of_shift, weather, ops_decision` (report 3 groups by them). A `rescheduled` status is not used: the visit stays scheduled on its new day.
  - **Cancel reasons:** `customer_request, service_pro_unavailable, vehicle_breakdown, weather, other`.
  - **Failed reasons:** `no_waste, access_blocked, service_refused, bin_not_out, contaminated`.
  - **Reschedule reasons:** `customer_request, service_pro_unavailable, vehicle_breakdown, weather, route_optimization, other`.
- **WorkOrder** (embedded in the appointment):
  - What: `id, ref, serviceItemId` plus a snapshot `itemCode, itemName, stream, method, countUnit`; `origin: "planned" | "added-on-site"`; `containerIds`.
  - Progress: `countPlanned, countDone | null, weightEstKg, weightKg | null, weightSource | null, startedAt, completedAt`.
  - Status: `scheduled | in-progress | completed | partial | not-done | deferred | cancelled`. Outcome follows the count: all → completed, some → partial, none → not done; partial and not done need `reason: ShortfallReason` (failed reasons + `vehicle_full, container_damaged, overweight`).
  - Evidence (`evidence`): `fillLevelPct, contamination, containerOut, containerIn, weighbridgeTicket, facility, seals[], consignmentNote, consumablesLeft, photos`: which apply depends on the method.
  - With the appointment: check-in sets open work orders in progress; the visit completes once every work order is closed (failed visit if none was done); failing or cancelling the visit closes open work orders as not done / cancelled.
- **Route** (template; full rules in `specs/route-definition.md`): `id, code, name, entity, serviceType, city, zone, truckTypeIds (first = required), requiredSkills, wasteCodes, coCollection, schedule { pattern: daily | weekdays | weekly | alternate | custom, days, anchorDate }, shiftId: MORNING | NIGHT, startTime, endTime, depotId, disposalSiteIds, helpers, plannedTrips, plannedVisits, fillRate (0.8), status: draft | active | suspended | retired, validFrom, validTo, ownerId, version, colorIndex, serviceLineIds (stop order)`.
- **RouteAssignment**: `id, routeId, assetType: truck | driver | helper, assetId, role: primary | backup, rank, days, validFrom, validTo, status: active | suspended`.
- **RouteInstance** (generated; what Dispatch shows): `id ([RouteCode]-[YYYYMMDD]-[M|N]), routeId, routeVersion, name, date, shiftId, status, primaryServiceProId (driver) | null, crew (helpers), vehicleId, staffing { slot → primary | backup | pool | manual }, helpersRequired, flags (unstaffed, over-capacity with the binding `limit`, outside-window, contract-skipped, substitute, ineligible: an assigned asset skipped for a failed check), startTime, endTime, appointmentIds (stops, ordered), tippingTrips, estimatedKm, lockedAt (= confirmed), forecastSnapshot (a `CapacitySnapshot`, set at Confirm), closure (an `InstanceClosure`, set at Close run), cancellation { reason: public_holiday | vehicle_breakdown | weather | customer_closure | no_stops | other, note, at, by } | null (a cancelled run is kept, never deleted), extraTrips { count, acceptedBy, at } | null (trips added to resolve Over capacity)`.
- **ServiceLine** extras for routing: `entity, timeWindow { none | before to | after from | range from–to }, fillRate | null (override of the Route's standard; `null` = use the standard), contractStatus: active | expired | suspended | credit-hold`. Attached to exactly one Route (R10). The fill-rate override is the one line field Field Ops owns (accepting a suggested rate sets it); everything else is mastered in the CRM.
- **Masters** (`OpsMasters`, admin lookups): entities, cities, depots (+ lat/lng), disposal sites (+ kind, accepted waste codes, lat/lng), service types (capacity basis, default helpers, required skills), truck types (body m³, compression 1:5, payload, slots), skill codes (expiry tracked), waste codes (group, co-collect), shifts (Morning 05:00–15:00, Night 18:00–04:00).
- **RouteScore** (`route-score.ts`): `total, grade, base, penaltyPoints, metrics[] { key, label, value, unit, weight, score 0..1, explanation }, penalties[] { key, label, points, explanation }, stops, driveKm, driveMinutes, serviceMinutes`. Weights in `SCORE_WEIGHTS`; metrics with nothing to measure are left out of the average; no stops = 0.
- **Capacity** (`route-rules.ts`, operations-flow section 3.6): a truck has one or two **limits** `{ kind: volume | weight | slots | visits, unit, perTrip, perShift, perLoad? }` from its truck type (REL and tanker: volume + payload; skip and hook: visits + payload per container; medical and ADR box: payload + slots; flatbed: payload). A stop's **Load** is `{ volume, weight, slots, visits, heaviestKg }`. **Utilisation** = each limit's use plus the **binding** one (closest to full; a `perLoad` limit only binds once exceeded); it drives R11, R16 and the over-capacity flag, whose `limit` names the binding kind.
- **InstanceLoad** (`capacity-forecast.ts`): a run's `worst` (every container full), `forecast` (planned fill rates) and `actual` (completed work orders) utilisation, `forecastDone` (forecast of the completed stops), `doneStops / totalStops`, `binding`, and `runningHeavy` (actual ≥ 115% of `forecastDone`).
- **CapacitySnapshot** (on `RouteInstance.forecastSnapshot`, frozen at Confirm): `at, truckTypeId, limits[] { kind, unit, capacity, forecast, worstCase }, forecastPct, fillRates { appointmentId → rate }`. What forecast vs actual is measured against after the run.
- **InstanceClosure** (on `RouteInstance.closure`, R17, R18): `at, by, odometerOut, odometerIn, tipTickets[] { facility, ticket, netKg }, actual[] { kind, unit, value } (per truck limit, after the closing decisions), resolved[] { appointmentId, outcome: missed | rescheduled }, note, adjustments[] { at, by, note }`. A closed run is read-only; corrections are adjustments.
- **VisitRecord** (`visit-history.json`): one past visit of a service line before the live fixtures: `id, serviceLineId, servicePointId, serviceItemId, date, countPlanned, countDone, fillLevelPct | null (bins only, 5% steps), weightKg, weightSource`. Every due visit in the 8 weeks before the live fixtures. Feeds the **suggested fill rate** (last 12 visits, recency-weighted, from 4 visits, rounded to 5%), the weekly planned vs actual on the Performance tab and Reports, and, later, the forecasting assistant.
- **Reports** (`reports.ts`): `routeWeeklyUtilisation` (per week: runs, average daily planned and actual % on the binding limit), `fillByWeekday`, `missedAndRescheduled` (counts by failed or reschedule reason), `substitutionLog` (per Route: runs, backup, pool, manual, skipped), `expiringForRoutes` (skill certificates, registration and insurance expiring in 30 days or expired, with the routes the asset is assigned to).
- **Route instance status is derived from its stops** (`deriveInstanceStatus`): first stop en route → in-progress; all closed → completed, or partial if any failed/cancelled. The dispatcher's planned / unstaffed / confirmed stands until then.
- **ProjectedVisit** (`projected-visits.ts`): `date, customerId, servicePointId, serviceLineId, routeId, routeCode, shiftId, instanceId | null`.
- **Rules** live in `src/features/field-service/route-rules.ts` (R1 to R12, R14, R21, R22 and the section 4.2 checks), with R13 and R20 in `route-store.ts` and R15 and R16 in `dispatch-engine.ts`; all prototype-grade.
- **Shift**: `id, serviceProId, date, type: "morning" | "night" | "on-call" | "training" | "leave", startTime | null, endTime | null (end < start = past midnight), templateId, trainerId, note`. One per pro per day. A route's primary and crew need a working (non-leave) shift on the route's date; Dispatch flags it otherwise.
- **ShiftTemplate**: `id, name, type, startTime, endTime, active`.
- **ServicePro** extras: `defaultSchedule: Partial<Record<DayOfWeek, templateId>>`, `licences: { type: "heavy_vehicle" | "hazmat" | "medical_waste", expiresOn }[]`.
- **BacklogItem**: an appointment or subscription that is due but unrouted, plus `tier, dueStart, dueEnd, lastServiceDate, customerFlags`.
- **DisposalRecord**: `appointmentId, stream, quantity, uom, facilityId, weighbridgeTicketId?`.
- **WeighbridgeTicket**: `id, ref, facilityId, vehiclePlate, stream, grossKg, tareKg, netKg (= gross − tare), at`.
- **Facility**: `id, name, type: "landfill" | "transfer-station" | "mrf" | "treatment" | "incinerator"`. Seed with real-sounding UAE facility types, e.g. an MRF in Al Quoz, a landfill in Al Qusais or Jebel Ali, a medical waste incinerator.
- **ProofOfService**: `appointmentId, photos[], signatureName, gps, completedAt, quantities`.
- **Case**:
  - Classification: `id, ref, customerId, type: "service-request" | "complaint" | "sales-inquiry" | "billing-issue" | "other"`, `origin: "phone" | "email" | "portal" | "in-person"`.
  - State: `status: "open" | "in-progress" | "waiting-on-customer" | "resolved" | "closed"`, `priority`.
- **DestructionCertificate**: `id, customerId, materialDescription, weightKg, status: "draft" | "pending-ops" | "pending-payment" | "completed" | "rejected"`.

## How the tracks connect

```
Lead → Opportunity → Quote → Contract ─(lines)→ Subscription ─(interval)→ Backlog
                                                        ↓ scheduled
                                Route ← Auto-Plan / Dispatch ← Appointment (+ Work Orders)
                                                        ↓ completed / failed
                         Disposal records + Proof of Service → monthly Invoice (MOQ, rebates, VAT)
```
