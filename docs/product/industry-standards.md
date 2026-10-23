# Industry standards and regulatory context

These are the waste-management norms the prototype should *look* aware of: the right documents, fields, statuses and reports. This is product context for a prototype, not legal advice. Verify specifics with Renuterra operations or compliance before anything customer-facing.

## UAE regulatory landscape

- **Federal:** Federal Law No. 12 of 2018 on Integrated Waste Management, overseen by the Ministry of Climate Change and Environment (MOCCAE). It sets the waste hierarchy (reduce → reuse → recycle → recover → dispose) and producer/carrier duties.
- **Emirate authorities** licence carriers and facilities and set local rules:
  - Dubai: Dubai Municipality, Waste Management Department.
  - Abu Dhabi: Tadweer.
  - Sharjah: Bee'ah.
  - Ajman and Umm Al Quwain: their municipalities.
- **Healthcare and pharmaceutical waste:** needs health-authority involvement: MOHAP, plus DHA in Dubai. The current CRM records `wds_permit` and `mohap_permit` on destruction certificate requests.
- **Hazardous waste:** classified, segregated and moved under manifest by licensed hazardous carriers to licensed treatment facilities. Cross-border movements fall under the Basel Convention.
- **Tax:** 5% VAT on services. Customers and companies carry a TRN (tax registration number). Invoices must show TRN, VAT amount and totals in AED.

What this means for screens and data:
- Customers, vehicles and service pros carry **permits/licences with expiry dates**. Show expiry warnings.
- Hazardous and medical streams require matching **vehicle class + crew licence** (a skill/licence check in dispatch).
- Every load out of a site has a **chain-of-custody** record.

## Operating standards

- **Chain of custody / duty of care.** Each collection produces evidence linking producer → carrier → facility:
  1. Waste transfer note or manifest per load: producer, carrier, vehicle, stream, quantity, destination.
  2. Weighbridge ticket at the facility: gross, tare, net.
  3. For hazardous, medical and pharmaceutical waste, a **certificate of destruction/treatment**.
- **Proof of Service (POS).** Every completed or failed visit records a timestamp, GPS, photos (before/after, container fill level), quantities and the customer signature or a "no-contact" flag. POS is aggregated monthly per service point and attached to invoices.
- **Failed visits are first-class.** Reasons are no waste, access blocked, service refused, bin not out, and contaminated. They need a photo and are usually billed the collection fee only.
- **Contamination.** Recyclables contaminated with general waste are rejected or downgraded, with a photo and a customer notification. This feeds into recycling-rate KPIs.
- **Collection windows.** Commercial collections often run at night or early morning (malls, hotels, city centre), with loading-bay time restrictions. Medical waste runs on fixed frequent schedules.
- **Segregation by stream.** Separate containers and often separate vehicles per stream. Never mix hazardous or medical waste with general waste on one route stop.
- **Vehicle capacity and tipping.** A route ends or pauses with **tipping trips** to a facility when payload or volume is reached. Planning respects payload (kg), compaction ratio, and facility opening hours.
- **Container lifecycle:** delivery → periodic service (empty/swap) → maintenance/wash → removal. Assets are tagged (barcode/RFID) and ownership is tracked (company vs customer). Rental is billed monthly.
- **Health and safety:** pre-trip vehicle checks, PPE, site hazards on the service point (low clearance, reversing restrictions, security badge), lone-worker and heat-stress rules (UAE midday break in summer, 12:30–15:00 for outdoor work, June–September).

## KPIs the screens should speak

| Area | KPIs |
| --- | --- |
| Operations | Completion rate, on-time rate (within window), failed-visit rate by reason, missed collections, average stops per route, km per stop, tonnes per route/hour, vehicle utilisation (payload %), route adherence. |
| Customer | Complaints and cases per 1,000 lifts, SLA breaches, reservice rate. |
| Commercial | MRR, SER, contract renewals due, revenue per route, unbilled collections (missing revenue), DSO. |
| ESG | Tonnes by stream, **diversion rate** (recycled ÷ total), landfill tonnes, CO₂e avoided/emitted (GHG Protocol style), per customer and per service point. This is a sales differentiator, so make the customer-facing reports look polished. |

## Data standards

- Weights in kg internally; display tonnes for totals. Net = gross − tare.
- Container sizes: 240L, 660L, 1100L (1.1 CBM) bins; 6/10/20/30/40 CBM skips and RORO; compactors by CBM.
- Billing UOMs: per lift/trip, per skip, per ton, per piece, plus monthly rental and MOQ.
- Every operational record carries **who** (service pro/vehicle), **when** (UTC, shown in Dubai time), **where** (GPS/service point) and **what** (stream, quantity). Audit history on routes, appointments and contracts.
