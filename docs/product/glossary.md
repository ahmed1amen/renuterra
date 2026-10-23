# Glossary

**Canonical term** is what we use in code (types, hooks, files) and UI copy. Each row also gives the Aspyn origin and the current-CRM name, so specs can be translated in either direction.

## Organisation and people

| Canonical term | Aspyn | Current CRM / Evreka | Meaning in Renuterra |
| --- | --- | --- | --- |
| **Company** | — | `companies` (REN, CO2, CO3) | Legal entity / brand. Own invoice prefix, TRN, branding. Renuterra runs several. |
| **Service Center** | Service Center | branch (`company_branches`) | Operational depot/yard a fleet runs from. Has a timezone (`Asia/Dubai`), location and coverage radius. The office selector in the top bar. |
| **Area** | Area | pricing Zone A–D | Territory polygon (e.g. Deira, Al Quoz, JAFZA, DIP). Flags: can sell, can service. Also drives price zone. |
| **Zone** | Zone | Evreka zone | Dispatch sub-territory that teams and service pros are assigned to. |
| **Team** | Team | — | Group of service pros under a supervisor at a service center. |
| **Service Pro** | Service Pro / Technician (`User`) | Driver (Evreka) | Field worker: driver, crew/loader, or technician (maintenance, installation). Has skills, licences and shifts. *Replaces `Technician` in current mocks.* |
| **Route role** | `primary` / `secondary` / `trainee` | — | Primary = driver, secondary = loader/crew, trainee. |
| **Dispatcher**, **Ops Manager** | Dispatcher, Office Manager | Operations | Back-office operations roles. |
| **KAM** | — | Key Account Manager | Sales owner of a customer. |

## Customers and sites

| Canonical term | Aspyn | Current CRM / Evreka | Meaning |
| --- | --- | --- | --- |
| **Customer** | Account | `crm_customers`, Evreka "Entity" | B2B customer (hotel, hospital, mall, construction firm…). Number `REN-CUST-000001`. Tier: Platinum/Gold/Silver/Bronze. |
| **Contact** | Customer (person) | `customer_contacts` | Person at a customer. Role: Decision Maker, Sales, Finance, Operations, Technical, Billing. |
| **Billing Entity** | — | `billing_entities` | Alternative legal name/TRN/address used to invoice a service point. |
| **Service Point (SP)** | Address | `crm_service_points` | A physical collection site. Number `REN-SP-000123`. Name is always "Customer name - Location" (e.g. "Sobha Construction - Deira"). Geocoded. |
| **Site attribute** | Property attribute | SP notes | Access hazards and instructions: security badge needed, height restriction, loading-bay hours, locked gate. |
| **Customer flag** | Customer flag | — | `vip`, `new_customer`, `at_risk`, `do_not_service`, `past_due`. |

## Commercial

| Canonical term | Aspyn | Current CRM | Meaning |
| --- | --- | --- | --- |
| **Lead → Opportunity → Quote → Contract** | (Sales app) | same | Sales pipeline. Quote `SQ-000123`, Contract `SC-000123`. |
| **Service Item** | Product | `bc_service_items` | Catalogue line that combines stream, container and service. Examples: `REL 240L GEN`, `REC 1.1CBM`, `10CBM C&D`, `MED COLL`. Has required skills/vehicle class and a default duration. |
| **Contract line** | — | `contract_pricing_lines` | One contract × SP × service item. Holds price (collection fee, disposal fee, UOM), frequency, MOQ, rebate, rental, ownership. |
| **Subscription** | Subscription | (contract line + Evreka order settings) | The recurring service at a service point that Field Service schedules against. Created from a contract line. Has a **service interval** and a compliance window. |
| **Service interval** | Service interval | frequency_type + frequency_days | Cadence: Daily, Weekly (on chosen days), Monthly, On Call. Tolerance days early/late. |
| **Revenue type** | — | `MRR`, `One-Time`, `Yearly Subscription`, `SER Lump Sum` | MRR = monthly recurring revenue; SER = single event revenue. |
| **UOM** | — | `kg`, `ton`, `pcs`, `Trip`, `Skip` | Billing unit of a contract line. |
| **MOQ** | — | MOQ | Minimum billable quantity per period. |
| **Rebate** | — | rebate per ton | AED per ton credited back for recyclables. |
| **Invoice** | (Pay service) | `invoices` | Monthly invoice per customer or per SP. Number `{prefix}-{YYYYMM}-{0001}`. 5% VAT. Draft → Confirmed. |

## Operations (field service)

| Canonical term | Aspyn | Current CRM / Evreka | Meaning |
| --- | --- | --- | --- |
| **Calendar Event** | CalendarEvent | — | Anything on a calendar. Types: `appointment`, `appointment_reservation`, `appointment_request`, `work_break`, `out_of_office`, `generic`. |
| **Appointment** | Appointment | Evreka Order / Task | One scheduled visit to a service point. *Replaces `Job` in current mocks.* Types: `initial` (first service / container delivery), `standard` (recurring collection), `reservice` (return visit after a failed or incomplete one). |
| **Work Order** | Work Order | order item | A unit of work on an appointment, e.g. "empty 3 × 1100L general", "swap 10CBM skip". Ref `WO-10412`. Status: created, scheduled, deferred, completed, cancelled. |
| **Service type** | (service phase) | — | `collection`, `delivery` (place container), `swap`, `removal` (retrieve container), `maintenance`, `inspection`, `destruction`. |
| **Route** | Route | Evreka route/tour | One vehicle's day at a service center: ordered appointments, assigned crew, vehicle, capacity. Can be locked. |
| **Vehicle** | — (not in Aspyn) | plate (Evreka) | Truck with a **vehicle class**: `MSW Compactor`, `Skip Loader`, `Hook Loader / RORO`, `Tanker` (HAT), `Medical Van`. Payload capacity in tonnes. **Waste-specific addition.** |
| **Container** | — (not in Aspyn) | service item size | Bin, skip, RORO or compactor at a service point. Sizes 240L, 660L, 1100L (1.1CBM), 6/10/20/30/40CBM. Ownership: Renuterra or Customer. **Waste-specific addition.** |
| **Shift** | Shift | — | Service pro availability window. Types: `standard`, `initial`, `on_call`, `training`, `manual`, `time_off`. |
| **Route slot** | RouteSlot | — | Open gap on a route where an appointment fits. |
| **Reservation** | Appointment reservation | — | Temporary hold on a slot (default 30 min). |
| **Backlog** | Backlog | — | Due work not yet on a route. Tiers: `overdue`, `due_now`, `scheduled_out_of_compliance`, `scheduled_not_notified`, `upcoming`. |
| **Auto-Plan** | Auto-Plan preview | — | Proposed assignment of the backlog to routes. Dispatcher reviews, then commits. |
| **Optimize** | Route optimization | — | Re-sequence the stops on a route (VROOM-style). |
| **Arrival window** | Appointment window | shift `Day` | `timed`, `AM`, `PM`, `AT` (anytime). Waste also has `night` for city-centre / mall collections. |
| **Failed visit** | (cancel reason `NO_SHOW`) | failed visit | Visit attempted but not serviced: `no_waste`, `access_blocked`, `service_refused`, `bin_not_out`, `contaminated`. Billed the collection fee only. |
| **Disposal record** | Pesticide record | order item record | What was collected and where it went: stream, quantity (kg/pcs/trips), disposal facility. |
| **Weighbridge Ticket** | — | `dc_inbound_tickets` | Facility gate ticket: gross, tare and net weight, vehicle, stream, facility. |
| **Service report** | Inspection | — | On-site findings with photos: contamination, damaged container, overfilled, safety issue, upsell opportunity. |
| **Proof of Service (POS)** | Service slip | E360 POS PDF | Evidence of the visit: time, GPS, photos, signature, quantities. Monthly POS PDF per SP. |
| **Destruction Certificate (DC)** | — | `dc_requests` | Certificate of destruction for pharma/expired goods/confidential material. |
| **Waste Transfer Note / Manifest** | — | — | Chain-of-custody document per load (see industry-standards.md). |

## Waste streams

Fixed set with fixed UI colours (`StreamTag`, `bg-stream-*`):

| Stream id | Label | CRM waste type / item prefix |
| --- | --- | --- |
| `general` | General waste | `REL` (Dubai REL), MSW |
| `recyclable` | Recyclables | `REC` (Dubai Recycling): cardboard, PET, glass, metal, e-waste |
| `food` | Food / organic | food, grease |
| `cd` | Construction & demolition | `C&D`, RORO/skip |
| `hazardous` | Hazardous | Dubai Hazardous Waste, HAT (oil, sludge, chemical) |
| `medical` | Medical / clinical | `MED`, sharps, pharmaceutical |

ESG reporting groups outcomes into **recycled**, **landfill** and **special treatment**.
