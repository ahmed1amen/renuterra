# Domain model (prototype)

This is the target shape for mock data in `src/mocks/`. It is simplified for a prototype: keep the fields screens actually show and drop the rest. Terms are defined in [glossary.md](./glossary.md).

## Conventions for mock data

- **Field naming:** camelCase in TypeScript (matches the existing code), even though Aspyn's API uses snake_case.
- **IDs:**
  - Internal ids are prefixed short strings: `cust_01`, `sp_014`, `apt_0231`, `route_07`, `pro_3`.
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

- **ServiceCenter**: `id, name, code, timezone, lat, lng, address, status: "active" | "inactive"`. Seed with something like Al Quoz depot, Jebel Ali depot and Sharjah depot.
- **Area**: `id, name, serviceCenterId, priceZone: "A" | "B" | "C" | "D", canSell, canService`.
- **Team**: `id, name, serviceCenterId, supervisorId`.
- **ServicePro** (replaces `Technician`):
  - Identity: `id, name, initials, phone, role: "driver" | "loader" | "technician", serviceCenterId, teamId, zone`.
  - Capabilities: `skills: string[]`, `licences: { type, expiresOn }[]`. Licence types are `heavy_vehicle`, `hazmat`, `medical_waste`.
  - Live state: `status: "available" | "on-route" | "on-break" | "off-shift"`, `lat, lng`.
- **Vehicle**: `id, plate, vehicleClass: "compactor" | "skip-loader" | "hook-loader" | "tanker" | "medical-van", capacityKg, serviceCenterId, status: "in-service" | "maintenance" | "out-of-service"`.

### Customers and sites

- **Customer**:
  - Identity: `id, number, name, industry, tier: "platinum" | "gold" | "silver" | "bronze"`.
  - Status: `status: "active" | "passive"`, `flags: CustomerFlag[]`.
  - Commercial: `kamId, paymentTerms, creditLimit, trn`.
- **Contact**: `id, customerId, name, role, email, phone, isPrimary`.
- **ServicePoint**: `id, number, customerId, name ("Customer - Location"), address, lat, lng, areaId, status: "active" | "inactive", accessNotes, attributes: string[]`.
- **Container**: `id, servicePointId, type: "bin" | "skip" | "roro" | "compactor", sizeLabel ("1100L", "10CBM"), stream, ownership: "renuterra" | "customer", assetTag`.

### Commercial

- **Lead status:** `new, contacted, qualified, proposal-sent, negotiation, nurture, unqualified, lost, junk`.
- **Lead source:** `website, referral, cold-call, event, campaign, linkedin, other`.
- **Lead rating:** `hot, warm, cold`.
- **Opportunity stage:** `new, qualified, quoting, negotiation, won, lost`.
- **Quote:**
  - Status: `draft, sent, approved, rejected, converted, cancelled`.
  - Line fields: `serviceItem, servicePointId, collectionFee + uom, disposalFee + uom, frequency, days[], quantity, moq, rebatePerTon, rentalCharge, ownership`.
- **Contract:**
  - Status: `draft, active, signed, expired, terminated, superseded`.
  - Fields: `startDate, endDate, revenueType, value`.
  - Expiry rules: past `endDate` becomes `expired`; 30 days after that, if not renewed, it becomes `terminated`.
- **Subscription** (contract line, scheduled):
  - Links: `id, customerId, servicePointId, contractId, serviceItem, stream, containerIds`.
  - Schedule: `interval: { frequency: "daily" | "weekly" | "monthly" | "on-call", days: DayOfWeek[] }`, `window`, `nextTargetDate, nextWindowStart, nextWindowEnd, lastServicedAt`.
  - Status: `active | paused | frozen | cancelled`.
- **Invoice**: `id, number, customerId, servicePointId?, month "YYYY-MM", lines, subtotal, vat, total, status: "draft" | "confirmed" | "sent" | "paid" | "overdue"`.

### Operations

- **CalendarEvent** base fields: `id, type, calendarOwnerId, startAt, endAt`. `type` is one of `appointment | appointment_reservation | work_break | out_of_office | generic`.
- **Appointment** (replaces `Job`):
  - Identity and links: `id, ref, type: "initial" | "standard" | "reservice"`, `serviceType`, `customerId, servicePointId, subscriptionId, routeId | null, servicePro(s), stream`.
  - Scheduling: `windowType: "timed" | "AM" | "PM" | "AT" | "night"`, `scheduledWindowStart/End, startAt, endAt, durationMins, priority: "low" | "normal" | "high" | "urgent"`.
  - Status: `scheduled | confirmed | en-route | in-progress | paused | completed | failed | cancelled | rescheduled`.
  - Lifecycle timestamps: `confirmedAt, startedAt, completedAt, cancelledAt`.
  - Reasons and notes: `cancelReason, failedReason, notes`.
  - Transitions:
    - scheduled → confirmed → en-route → in-progress (↔ paused) → completed | failed
    - scheduled/confirmed → cancelled
    - cancelled → scheduled ("uncancel")
    - Rescheduling sets the old one to `rescheduled` and links the new one via `originalAppointmentId`.
  - **Cancel reasons:** `customer_request, rescheduled, service_pro_unavailable, vehicle_breakdown, weather, contract_cancelled, subscription_frozen, other`.
  - **Failed reasons:** `no_waste, access_blocked, service_refused, bin_not_out, contaminated, other`.
  - **Reschedule reasons:** `customer_request, service_pro_unavailable, vehicle_breakdown, weather, route_optimization, other`.
- **WorkOrder**: `id, ref, appointmentId, subscriptionId, serviceItem, containerId?, quantityPlanned, status: "created" | "scheduled" | "deferred" | "completed" | "cancelled"`.
- **Route**:
  - Identity and links: `id, name, date, serviceCenterId, vehicleId, color`.
  - Crew: `crew: { servicePro, role: "primary" | "secondary" | "trainee" }[]`.
  - Plan: `startTime, endTime (HH:mm), maxCapacity, appointmentIds (ordered)`.
  - Metrics: `estimatedKm, estimatedDriveMins, loadKg / capacityKg`.
  - Lock state: `lockedAt, lockedBy`.
  - Waste rule: the route can include **tipping trips** (disposal facility stops) when the load reaches vehicle capacity.
- **Shift**: `id, serviceProId, type, date, startTime, endTime, startServiceCenterId`.
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
