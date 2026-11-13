# Glossary

**Canonical term** is what we use in code (types, hooks, files) and UI copy. Each row also gives the Aspyn origin and the current-CRM name, so specs can be translated in either direction.

## Organisation and people

| Canonical term | Aspyn | Current CRM / Evreka | Meaning in Renuterra |
| --- | --- | --- | --- |
| **Company** | - | `companies` (REN, CO2, CO3) | Legal entity / brand. Own invoice prefix, TRN, branding. Renuterra runs several. |
| ~~Service Center~~ | Service Center | - | **Not used.** Renuterra has no service centers; don't add a service-center entity, selector or `serviceCenterId`. Screens are not scoped by depot. |
| **Area** | Area | pricing Zone A–D | Territory polygon (e.g. Deira, Al Quoz, JAFZA, DIP). Flags: can sell, can service. Also drives price zone. |
| **Zone** | Zone | Evreka zone | Dispatch sub-territory that teams and service pros are assigned to. |
| **Team** | Team | - | Group of service pros under a supervisor. |
| **Service Pro** | Service Pro / Technician (`User`) | Driver (Evreka) | Field worker: driver, crew/loader, or technician (maintenance, installation). Has skills, licences and shifts. *Replaces `Technician` in current mocks.* |
| **Route role** | `primary` / `secondary` / `trainee` | - | On an instance: the driver (primary) and helpers. On a Route: assignments are primary or ranked backup. |
| **Dispatcher**, **Ops Manager** | Dispatcher, Office Manager | Operations | Back-office operations roles. |
| **KAM** | - | Key Account Manager | Sales owner of a customer. |

## Customers and sites

| Canonical term | Aspyn | Current CRM / Evreka | Meaning |
| --- | --- | --- | --- |
| **Customer** | Account | `crm_customers`, Evreka "Entity" | B2B customer (hotel, hospital, mall, construction firm…). Number `REN-CUST-000001`. Tier: Platinum/Gold/Silver/Bronze. |
| **Contact** | Customer (person) | `customer_contacts` | Person at a customer. Role: Decision Maker, Sales, Finance, Operations, Technical, Billing. |
| **Billing Entity** | - | `billing_entities` | Alternative legal name/TRN/address used to invoice a service point. |
| **Service Point (SP)** | Address | `crm_service_points` | A physical collection site. Number `REN-SP-000123`. Name is always "Customer name - Location" (e.g. "Sobha Construction - Deira"). Geocoded. |
| **Site attribute** | Property attribute | SP notes | Access hazards and instructions: security badge needed, height restriction, loading-bay hours, locked gate. |
| **Customer flag** | Customer flag | - | `vip`, `new_customer`, `at_risk`, `do_not_service`, `past_due`. |

## Commercial

| Canonical term | Aspyn | Current CRM | Meaning |
| --- | --- | --- | --- |
| **Lead → Opportunity → Quote → Contract** | (Sales app) | same | Sales pipeline. Quote `SQ-000123`, Contract `SC-000123`. |
| **Service Item** | Product | `bc_service_items` (Evreka copy, free-text names) | Catalogue entry we own, e.g. `REL-1100-GEN` "1100L bin collection: general", `MED-BAG`, `SKIP-10-GEN`. Has a stream, a **handling method**, a container type, a **count unit**, est. kg per unit, minutes per unit, vehicle class, where its weight comes from, and compliance flags (seals, consignment note). Contract lines and work orders point at its **id**, never its text: this replaces the CRM's name matching (`itemMatch.ts`) and `// kg` duplicate items. Managed in Field Service → Settings → Service items. **Naming:** the route spec's "service item" (a contracted bin at a site) is our **service line**; our service item is the catalogue entry it points at. |
| **Handling method** | - | (guessed from item names) | How the service pro physically handles an item: `empty-on-site` (bin emptied into the truck), `exchange` (skip/RORO/compactor taken, tipped, returned or swapped), `packaged` (sealed bags, sharps boxes, drums taken away), `pump-out` (tanker, litres), `logistics` (deliver/remove/check an empty container), `destruction` (witnessed destruction + certificate). Decides what is counted, where weight comes from and which proof is captured. |
| **Count unit** | - | `primary_uom` | What the service pro counts: `lift`, `trip`, `bag`, `box`, `drum`, `litre`, `container`, `kg`. Separate from the billing UOM, which stays on the contract line. |
| **Contract line** | - | `contract_pricing_lines` | One contract × SP × service item. Holds price (collection fee, disposal fee, UOM), frequency, MOQ, rebate, rental, ownership. |
| **Subscription** | Subscription | (contract line + Evreka order settings) | The recurring service at a service point that Field Service schedules against. Created from a contract line. Has a **service interval** and a compliance window. |
| **Service interval** | Service interval | frequency_type + frequency_days | Cadence: Daily, Weekly (on chosen days), Monthly, On Call. Tolerance days early/late. |
| **Revenue type** | - | `MRR`, `One-Time`, `Yearly Subscription`, `SER Lump Sum` | MRR = monthly recurring revenue; SER = single event revenue. |
| **UOM** | - | `kg`, `ton`, `pcs`, `Trip`, `Skip` | Billing unit of a contract line. |
| **MOQ** | - | MOQ | Minimum billable quantity per period. |
| **Rebate** | - | rebate per ton | AED per ton credited back for recyclables. |
| **Invoice** | (Pay service) | `invoices` | Monthly invoice per customer or per SP. Number `{prefix}-{YYYYMM}-{0001}`. 5% VAT. Draft → Confirmed. |

## Operations (field service)

| Canonical term | Aspyn | Current CRM / Evreka | Meaning |
| --- | --- | --- | --- |
| **Calendar Event** *(planned)* | CalendarEvent | - | Anything on a calendar. Types: `appointment`, `appointment_reservation`, `appointment_request`, `work_break`, `out_of_office`, `generic`. |
| **Appointment** | Appointment | Evreka Order / Task | One scheduled visit to a service point. *Replaced the old `Job` type.* Types: `initial` (first service / container delivery), `standard` (recurring collection), `reservice` (return visit after a failed or incomplete one). |
| **Work Order** | Work Order | order item | One service item on an appointment, e.g. "lift 8 × 1100L general", "exchange 1 × 10 CBM skip", "collect 10 medical bags". Ref `WO-10412`. Tracks **count** (done / planned, in the count unit) and **weight** (actual / estimated kg, with its source) side by side. Status: `scheduled`, `in-progress`, `completed`, `partial`, `not-done`, `deferred`, `cancelled`. Partial and not done need a **shortfall reason**. Can be **added on site** (flagged for billing approval). |
| **Weight source** | - | - | Where a work order's kg come from: `estimated` (units × kg per unit), `allocated` (route weighbridge ticket split across stops (bin rounds), `weighbridge` (exchange), `scale` (on-site scale) packaged, destruction), `metered` (tanker). |
| **Seal** | - | - | Numbered tamper seal on each medical/hazardous unit, scanned on pickup. Part of chain of custody. |
| **Service type** | (service phase) | - | `collection`, `delivery` (place container), `swap`, `removal` (retrieve container), `inspection`. `maintenance` and `destruction` are planned. |
| **Route** | Route | Evreka route/tour | A **standing template** for a recurring run (spec: `docs/product/specs/route-definition.md`). Code `[Entity]-[City]-[ServiceType]-[NNN]` e.g. `RWC-DXB-REL-001`, immutable once Active. One entity, one service type, one city, one shift; required truck type(s), driver skills, accepted waste codes, schedule, depot, disposal sites, helper count, capacity. Status `draft → active → suspended → retired`; editing a matching attribute on an Active route makes a new version. Never deleted. |
| **Route instance** | Route (per day) | Evreka daily route | One Route on one date and shift: what the driver works and Dispatch shows. Id `[RouteCode]-[YYYYMMDD]-[M|N]`. Generated by the **dispatch engine** (nightly, or **Generate** on Dispatch up to 7 days ahead): copies due stops, fills truck / driver / helpers (primary → backups by rank → pool → **Unstaffed**), sequences by time window then proximity, flags over-capacity and window misses. Status `planned, unstaffed, confirmed, in-progress, completed, partial, cancelled`. |
| **Route score** | Route score (cluster score) | - | 0–100 with a grade (Excellent ≥ 80, Good ≥ 65, Fair ≥ 50, Poor). Weighted metrics: neighbourhood (nearest-stop km), tightness (km from centre), drive share incl. tipping, capacity use in the route's own basis (70–90% is best), window fit, trip efficiency: minus penalties (over capacity, stops outside window, unstaffed slots, substitutes). Scored for the Route template (design quality) and for each instance (the day's run). Same mechanism as Aspyn's; the metrics are ours. |
| **Optimize** | Route optimization | - | Phase 1: re-sequence an instance's open stops by time window, then nearest next stop, and show the score before → after with Undo. Phase 2 (later): real cycle times from GPS. |
| **Projected visit** | - | - | When a service line will next be collected, derived from its frequency and its Route's schedule, before the day is generated. Shown as "Scheduled by route …" on customer screens. |
| **Assignment** | User route assignment | - | Staffs a Route: truck, driver or helper; `primary` or ranked `backup`; optional day set and valid dates. A driver can be primary on several routes if days or shifts don't overlap (R6). |
| **Entity** | - | `companies` | Operating company: **RWC** (Renuterra Waste Collection), **GGH** (Golden Gate Hazardous), **GGM** (Golden Gate Medical). Routes, trucks and service lines belong to one. |
| **Service type** (route) | - | Evreka order type | How a route collects: `REL`, `SKIP`, `HOOK`, `COMP`, `MED`, `HAZ`, `WWT`. Drives truck-type and skill matching. Not the same as an appointment's service type (collection / delivery…). |
| **Waste code** | - | material mapping | Fine-grained stream (`GEN`, `FOOD`, `MDR`, `CARD`, `CND`, `MED`, `HAZ-S`, `HAZ-L`…) with a colour **group** (our 6 streams) and co-collection rules. Routes accept codes; service items carry one. |
| **Vehicle** | - (not in Aspyn) | plate (Evreka) | Truck with a **vehicle class**: `MSW Compactor`, `Skip Loader`, `Hook Loader / RORO`, `Tanker` (HAT), `Box truck` (medical / hazardous packaged waste). Payload capacity in kg. **Waste-specific addition.** |
| **Container type** | - | price-engine service profiles | Catalogue entry: 240/660/1100L bins, 240L medical storage bin, 10/20 CBM skips, 30/40 CBM RORO, 15/20 CBM static compactors, waste-oil tank, plus untracked types (yellow bag, sharps box, 200L drum). Capacity and vehicle class. **Waste-specific addition.** |
| **Container** | - (not in Aspyn) | - (only in Evreka) | One **tagged** physical container (`RT-1100-00412`) of a container type. Placed at a service point or in the depot; location `on-site`, `in-transit`, `at-facility`, `in-depot`, `maintenance`. Ownership: Renuterra (rental) or Customer. Bags, sharps boxes and drums are *not* containers: they're counted on the work order. **Waste-specific addition.** |
| **Shift** | Shift | - | A service pro's availability on one day; only pros with a working shift that day can be on a route (primary or crew). Types: `morning`, `night` (runs past midnight, e.g. 20:00–04:00), `on-call`, `training` (with a trainer), `leave` (not available). One shift per pro per day. |
| **Shift template** | ShiftTemplate | - | Reusable window, e.g. "Day long 06:00–18:00", "Night 20:00–04:00". |
| **Default schedule** | User default schedule | - | Each pro's weekday → shift template pattern; **Autofill** on the Shift board generates shifts from it. |
| **Route slot** | RouteSlot | - | Open gap on a route where an appointment fits. |
| **Reservation** | Appointment reservation | - | Temporary hold on a slot (default 30 min). |
| **Backlog** | Backlog | - | Open ad-hoc jobs not yet on a route instance (the site's default route, i.e. the Route its line is attached to, is proposed). Built: the day's backlog plus an **Overdue** section. Planned tiers: `due_now`, `scheduled_out_of_compliance`, `scheduled_not_notified`, `upcoming`. |
| **Auto-Plan** | Auto-Plan preview | - | Proposed assignment of the backlog to routes. Dispatcher reviews, then commits. |
| **Optimize** | Route optimization | - | Re-sequence the stops on a route (VROOM-style). |
| **Arrival window** | Appointment window | shift `Day` | `AM`, `PM`, `night` (city-centre and mall collections), `AT` (anytime). `timed` is planned; exact times live on the service line's time window. |
| **Failed visit** | (cancel reason `NO_SHOW`) | failed visit | Visit attempted but not serviced: `no_waste`, `access_blocked`, `service_refused`, `bin_not_out`, `contaminated`. Billed the collection fee only. |
| **Disposal site** | - | disposal / transfer site (Evreka) | Where a route tips: landfill, transfer station, MRF, organics, C&D, treatment or wastewater plant. Accepts a set of waste codes; each accepted stream on a Route maps to one. Shown on the Dispatch map as a square badge. |
| **Tipping trip** | - | - | A run to a disposal site in the middle of a route instance, after a given stop; drawn on the map as a dashed leg from that stop to the facility. |
| **Capacity limit** | - | - | One physical limit of a truck: volume (body m³ × compression), payload (kg), secured container slots, or visits per shift. Most trucks have two. |
| **Binding limit** | - | - | The truck limit closest to full on a run. It decides utilisation, the R11 warning or block, and the R16 **Over capacity** flag ("Over capacity 112% (payload)"). |
| **Fill rate** | - | - | Share of a bin's volume a lift actually collects. The Route carries the standard (80%); a service line can override it. Bins only. |
| **Suggested fill rate** | - | - | The fill rate a line's recent visits point to (recency-weighted, from 4 visits). Shown next to the planned rate; the dispatcher **Accepts** it or not, it never applies itself (spec section 8.2). |
| **Worst case / forecast / actual** | - | - | The three load layers on a Dispatch route card: every container 100% full; the planned fill rates; what completed work orders recorded. **Running heavy** = actuals 15%+ over the forecast for the same stops. |
| **Close run** | - | - | The dispatcher's end-of-run step (R17): resolve every open stop (missed with a reason, or rescheduled), add weighbridge tickets and odometer, lock the actuals. A closed run is read-only. |
| **Reschedule reason** | - | - | Why a visit moved to another day: customer request, access issue, vehicle full, ran out of shift, weather, operations decision; plus who asked. Feeds report 3. |
| **Cancelled run** | - | - | A route instance called off with a reason (e.g. public holiday). Kept, never deleted; its open stops return to the backlog. |
| **Adjustment** | - | - | A dated correction to a closed run (R18), kept with it; the run's record itself never changes. |
| **Forecast snapshot** | - | - | The forecast frozen on a route instance when it is confirmed, so forecast vs actual can be measured after the run. |
| **Visit history** | - | - | Past visits per service line (fill level, kg, count): what the suggested fill rate and the planned forecasting assistant learn from. |
| **Disposal record** | Pesticide record | order item record | What was collected and where it went: stream, quantity (kg/pcs/trips), disposal facility. |
| **Weighbridge Ticket** | - | `dc_inbound_tickets` | Facility gate ticket: gross, tare and net weight, vehicle, stream, facility. |
| **Service report** | Inspection | - | On-site findings with photos: contamination, damaged container, overfilled, safety issue, upsell opportunity. |
| **Proof of Service (POS)** | Service slip | E360 POS PDF | Evidence of the visit: time, GPS, photos, signature, quantities. Monthly POS PDF per SP. |
| **Destruction Certificate (DC)** | - | `dc_requests` | Certificate of destruction for pharma/expired goods/confidential material. |
| **Waste Transfer Note / Manifest** | - | - | Chain-of-custody document per load (see industry-standards.md). |

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
