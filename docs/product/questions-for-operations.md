# Questions for the business team

Open points from building the Field Ops prototype against the Route spec (`specs/route-definition.md`, 28 October 2026). Each question says what the spec says, what the prototype does today (our working assumption), and why the answer changes the design. Where the prototype had to pick something, the pick is marked **Today**; it is a placeholder until you answer, not a decision.

How to answer: reply per question id (Q1, Q2, ...). "Keep as today" is a valid answer. If a question needs a workshop, say so and we'll prepare the options with screens.

The capacity questions already listed in `operations-flow.md` section 3.6 (COMP truck type, stream densities, container slots) are repeated here as Q26 to Q28 so this file is the single list.

---

## A. Route templates and versions

**Q1. Why do we need route versions, and what should a version change?**
Spec: section 3 design notes and R13 say that changing a matching attribute (service type, city, truck type, skills, streams, shift) on an Active route creates a new version; open instances keep the old version, the next generated instance uses the new one.
Today: exactly that. Editing a route's name, owner, zone, times, helpers, planned trips or fill rate does not create a version; editing any of the six matching attributes does, and the version number shows on the route and its instances.
Why it matters: a version is only useful if someone reads it later (costing, reports, disputes). If nobody will, a plain audit log of changes is simpler. If versions are wanted, confirm the list of attributes that trigger one. For example, should changing the start time, the depot or the disposal site also create a version, since they change the run's cost?

**Q2. When a template changes, which instances should follow it: already generated ones, or only new ones?**
Spec: open instances keep the old version.
Today: instances already generated (tomorrow's, or up to 7 days ahead if pre-generated) keep the old definition. There is no "regenerate" action; the dispatcher would cancel the run and generate the day again.
Why it matters: a dispatcher who fixes a truck type at 15:00 for tomorrow's run expects tomorrow to use it. Options: (a) keep as today, (b) offer "apply to generated instances that haven't started", (c) always regenerate unconfirmed instances when the template changes.

**Q3. What should be allowed to change on a route after it is Active?**
Spec: the route code is immutable once Active; renaming is allowed.
Today: the code is locked once Active; everything else is editable (with versioning per Q1). A route cannot move to another city or entity; that needs a new route.
Why it matters: tell us if operations re-codes routes in practice (for example when a route moves from Al Quoz to Jebel Ali) so we design "retire and clone" properly.
Route Template
 - Entity
 - City
 - Route Type
 Active Route 
 - Driver
 - Vechile
 - Disposal Sites 

**Q4. Suspended routes: what happens to their service lines and assignments?**
Spec: status Suspended exists; retirement is never physical (R20).
Today: a suspended route keeps its service lines and assignments, generates no instances, and its lines cannot be attached elsewhere until they are moved (R10). Nothing warns that the customers on it are not being collected.
Why it matters: if "suspended" means "temporarily stopped" (Ramadan hours, vehicle off-road for a month), the lines should probably be moved or the customers told. Should suspension release the lines, or should the system list uncovered lines on the dashboard?

**Q5. Valid-to date reached: what happens?**
Spec: a route with no valid-to runs indefinitely.
Today: when valid-to passes, the route generates no more instances but stays Active with its lines attached; no one is alerted.
Why it matters: same as Q4. Should the route auto-retire, and should its lines be flagged as uncovered?

**Q6. What is the route owner alerted about, and how?**
Spec: section 4.3 says an unstaffed instance raises an alert to the route owner.
Today: unstaffed runs appear on the dispatch board and the dashboard's "Needs attention" list. No email, SMS or push.
Why it matters: tell us the channel (email, WhatsApp, in-app) and whether over-capacity, expiring skills or uncovered lines should also alert the owner.

**Q7. One route per service type and entity: how are shared sites handled?**
Spec: a customer needing two service types at one site is served by two routes; medical never shares a route with other streams.
Today: implemented as stated. A hospital with general bins (RWC) and medical bags (GGM) has two service lines on two routes.
Why it matters: confirm the entity assignment of each service line comes from the CRM contract (the contract's company), not from the route. Today the prototype infers it from the waste stream.

- client will put what with what

## B. Schedules and generation

**Q8. Generation time and review window.**
Spec: generate at D-1 20:00; the dispatcher reviews and confirms.
Today: generation is a button on the dispatch board (standing in for the nightly job); there is no cutoff for confirmation.
Why it matters: morning routes start at 05:00. Who confirms between 20:00 and 05:00, and can a driver start an unconfirmed run? Should confirmation be automatic for runs with no flags?

**Q9. Routes due with nothing to collect that day.**
Spec: an instance is generated for every Active route due under its schedule.
Today: if none of the route's service lines is due that day (for example a Saturday medical route whose clinics are all Mon/Wed/Fri), no instance is made and the day's summary lists it under "Nothing due". The crew and truck are left free for the engine to use elsewhere.
Why it matters: confirm this is right. The alternative (generate an empty run) keeps the crew booked to the route and idle.

- At least One stop point should be served 


**Q10. Which day does a night run belong to?**
Spec: Night shift 18:00 to 04:00.
Today: a night run is dated by the day it starts (the Sunday 18:00 to Monday 04:00 run is "Sunday"). Service lines with a window "after 22:00" are due on that start day.
Why it matters: affects how customers are told "your collection is on Sunday night", how shifts are counted, and how the closure of a run that ends at 04:00 is dated.

**Q11. Weekdays, alternate days and holidays.**
Spec: Weekdays = Monday to Saturday, Friday excluded only if the day set says so; alternate days count from an anchor date; public holidays are generated unless the route says "skip holidays".
Today: Weekdays = every day except Sunday; alternate = every second day from the anchor; no holiday calendar yet.
Why it matters: (a) confirm Sunday is the only non-weekday for RWC; (b) is the UAE public-holiday list the one to use, and does it differ by entity or city; (c) should "skip holidays" be on by default?

- Predefinie by admin select days compleltly off of service 


**Q12. Monthly service lines.**
Spec: section 5 rule 2 says a line's frequency must be achievable by the route's schedule.
Today: a "monthly" line is due on its chosen weekday within the first 7 days of the month (for example "first Wednesday"). Nothing supports "the 15th" or "last Friday".
Why it matters: tell us which monthly patterns the contracts actually use.

- Canncelld 


**Q13. Pre-generating up to 7 days ahead.**
Spec: section 6.2 rule 6.
Today: supported; pre-generated days use the template as it was when generated (see Q2) and shifts and leave as known at that time.
Why it matters: a driver who books leave after Monday's pre-generation stays on Wednesday's run. Should the engine re-check staffing nightly for already generated days (R5 says nightly re-check for skills; we would extend it to leave and workshop status)?



**Q14. A customer pauses or skips one collection.**
Spec: covers expired, suspended or credit-hold contracts (R15), not a one-off skip.
Today: the dispatcher cancels that stop with a reason ("customer request"); the service line and route are unchanged.
Why it matters: should a customer pause for a date range be recorded on the service line (so stops are not generated at all), and does it change billing (MOQ)?

- On Hold Based On Crm so crm will make an service point on Hold Based on that field-service will skip it

## C. Staffing and substitution

**Q15. Long absences: daily substitution or a dated assignment?**
Spec: section 4.1 assignments carry valid-from and valid-to dates; section 4.3 fills from backups by rank when the primary is unavailable.
Today: both exist. A driver on two weeks' leave is substituted day by day by the backup, and each run shows a "Backup driver" flag.
Why it matters: do you want the flag every day for a planned absence, or should operations create a dated assignment so the backup becomes the planned driver for that period and the flag disappears?
- Vechile Problem
- Driver
- Check in List for dirver and for vechile before start route 
- If we have late start route by service pro just should be reported

**Q16. Pool search: fill automatically or only propose?**
Spec: section 4.3 step 3 says a pool asset is "proposed to the dispatcher for confirmation".
Today: the engine fills the slot from the pool, marks it "Pool", and the dispatcher confirms the whole run. There is no separate accept step for the pool asset.
Why it matters: if operations wants to approve pool use explicitly (for example because a pool truck belongs to another entity), we add a step.

**Q17. Can a run go out short of a helper?**
Spec: R21, an instance stays Unstaffed until every helper slot is filled.
Today: the dispatcher can "Confirm anyway" on an unstaffed run; it is recorded as an override.
Why it matters: is this override allowed, and who may do it (dispatcher, route owner, operations manager)?

**Q18. Does a trainee count as a helper?**
Spec: helpers are mandatory; section 7.3 has no trainee skill.
Today: a trainee rides as crew and fills a helper slot.
Why it matters: tell us if a trainee is extra to the helper count, and whether a route can have a "trainee allowed" flag.

- Should Skills



**Q19. Rest between shifts.**
Spec: R6 checks clashes per day and shift; a truck can be primary on a morning route and backup on a night route.
Today: the same person can be night primary (ends 04:00) and morning backup (starts 05:00); nothing enforces rest hours.
Why it matters: tell us the minimum rest you apply (and whether it is HR policy or law) so the engine can treat it as "unavailable".

- Uncontrollable till now


**Q20. Expired licence or certificate on an existing assignment.**
Spec: R5, nightly re-check; expiring within 30 days is a warning.
Today: at generation, a driver whose required skill has expired is skipped (the run becomes Unstaffed or takes a backup); 30-day expiries are warnings on the dashboard.
Why it matters: confirm the 30-day window, and whether an expired skill should block only the skill's own service type (for example expired ADR blocks hazardous routes but not REL).

**Q21. Helpers and city eligibility.**
Spec: CITY-xxx is a driver skill.
Today: helpers are checked for the city skill only (no licence or operation skill).
Why it matters: confirm helpers need a city permit, and whether medical and hazardous routes need helpers with MED-IC or HAZ-ADR.

**Q22. Trucks shared between entities.**
Spec: section 4.2 check 2: truck registered to the route's entity or in the shared pool.
Today: a truck has an entity or is "pool"; pool trucks can be used by any entity.
Why it matters: which trucks are really shared, and does using a pool truck create an inter-company charge the costing must record?

- they can't know the shread or where .
## D. Service lines, stops and windows

**Q23. The default route for an ad-hoc job.**
Spec: section 5 rule 7, a service point can carry a default route.
Today: the default route is the route the requested service line is attached to (a site with general bins on REL-001 and recyclables on REL-002 defaults by the line, not the site).
Why it matters: confirm per-line is what you meant. If a site should have one default route regardless of the item, say so.

- Ad-hoc On Call Route

**Q24. Transfers with an effective date (R10).**
Spec: moving a service line to another route is a dated transfer.
Today: attaching a line that is on another active route moves it immediately; the old route loses it from the next generation.
Why it matters: do you need future-dated transfers ("from 1 November, this site moves to REL-005")?

**Q25. What a time window means.**
Spec: section 5.1, formats before, after, range, none.
Today: "before 06:00" means planned arrival before 06:00 (the stop may finish after); a stop that cannot be placed inside its window is flagged on the run (R25) and left for the dispatcher. The customer is not told.
Why it matters: confirm "arrival" is the right reading, and what should happen when a window cannot be met (call the customer, skip, serve late and note it).

**Q26. Stream densities.**
Spec: section 8.2 wants fill rate suggested from actual weights.
Today: the suggestion uses the driver's reported fill level; weight-based suggestion needs a density per waste stream (kg per m³ loose), which doesn't exist yet.
Why it matters: give us typical loose densities for general, food, recyclables and C&D, or tell us to keep the driver's fill level.


**Q27. COMP (compactor / bulk) truck type.**
Spec: section 8.1 treats COMP as a compacting (volume) truck; section 7.2 lists only the flatbed for it.
Today: capacity belongs to the truck type, so a COMP route is weight-based until a compactor truck with a body size is added to the truck-type list.
Why it matters: tell us which truck actually runs COMP routes.


**Q28. Container slots on medical and hazardous trucks.**
Spec: section 8.1, "secured container slots".
Today: one sharps box or drum takes one slot; bags take none (they ride in the truck's own carts).
Why it matters: confirm, and give the slot count per truck type.

**Q29. Over capacity on the day: who decides?**
Spec: R11 (attach) override by the route owner; R16 (generation) the dispatcher must resolve.
Today: the dispatcher can move stops to another run or accept extra trips; "Confirm anyway" is also available and is recorded.
Why it matters: does accepting an extra trip need approval (overtime, fuel), and should the route owner rather than the dispatcher approve it?

**Q30. Does the day's stop order feed back into the template?**
Spec: section 5 rule 5, the dispatcher can reorder stops; phase 2 learns from GPS.
Today: Optimize and manual reordering change the day's run only; the template's stop order is edited separately on the route.
Why it matters: should a reorder the dispatcher repeats every day be offered as "make this the route's order"?

**Q31. Credit-hold contracts.**
Spec: R15, skipped at generation and listed in the exception report.
Today: the stop is skipped and flagged on the run; ad-hoc bookings for that site are still allowed; customer service is not told.
Why it matters: should credit hold also block ad-hoc bookings and container deliveries, and should customer service see the skip?

## E. Instances, closing and cancelling

**Q32. Changes after Confirm.**
Spec: the dispatcher reviews and confirms; the instance is what the driver executes.
Today: a confirmed run is locked. To add an ad-hoc job or move a stop, the dispatcher reopens it, changes it, and confirms again.
Why it matters: once the driver app exists, a change after the driver has started must reach the device. Is "reopen" acceptable, or do you want "add stop to a live run" without reopening?
- access block 
- Complete Charge 
- Conditions client canclaitoin 

**Q33. Who closes a run, and by when?**
Spec: section 6.1, closed by the dispatcher, same day; closure locks actuals (R18).
Today: Close run is available once work began or the day is over; weighbridge tickets and odometer are optional; a night run can be closed the next morning.
Why it matters: should a run be closable without weighbridge tickets, and should unclosed runs block the next day's generation or billing?

**Q34. Missed stops at closure.**
Spec: R17, every stop must be completed, missed with a reason, or rescheduled.
Today: "Missed" becomes a failed visit with a reason; "Reschedule" sends it to the next day's backlog with the same window. Missed because of us (vehicle full, breakdown) and missed because of the customer (access blocked, bin not out) are recorded with the reason but treated the same operationally.
Why it matters: should our-fault misses auto-book a return visit, and which reasons are billable (collection fee only) versus free? This is the billing rule we still need.

**Q35. Partial versus completed run.**
Spec: statuses Completed and Partially completed.
Today: a run with any failed or cancelled stop is Partially completed.
Why it matters: confirm, or define a threshold.

**Q36. Cancelling a whole day (holiday, city closure).**
Spec: section 6.2 rule 5 and 8.
Today: Cancel the day keeps the runs with a reason and sends open stops back to the backlog for the dispatcher to place.
Why it matters: should weekly collections missed on a holiday be added to the next run (double load) or dropped until the next scheduled day? Does the customer's contract (MOQ) change?

## F. Scoring and optimisation

**Q37. Route score: wanted, and for whom?**
Spec: not in the spec; phase 1 and 2 optimisation are.
Today: every route and run has a score (0 to 100) from neighbourhood, tightness, drive share including tipping, capacity use, window fit and trip efficiency, with penalties for over capacity, missed windows, unstaffed slots and substitutes. It is shown to operations only.
Why it matters: tell us which of these matter to you, whether drivers should see it, and whether a low score should block anything (today it blocks nothing).

**Q38. Phase 2 inputs.**
Spec: full optimisation from GPS and actual cycle times.
Today: straight-line estimates.
Why it matters: which telematics system is on the trucks, and can we get GPS tracks and odometer per run?

## G. Entities, naming and master data

**Q39. Naming on screens.**
Today: the spec's "service item" (a contracted bin at a site) is called a **service line** in the prototype, because "service item" already means the catalogue entry (`REL-1100-GEN`) in the CRM and the current operations system. Helpers are called **Helper** (not loader); a day's instance is called a **run** in places.
Why it matters: tell us the words your teams use day to day so screens and the driver app match them.

**Q40. Zones and areas.**
Spec: zone is an optional lookup.
Today: free text on the route.
Why it matters: give us the zone list per city if you want it as a filter and a planning unit.

**Q41. Cities without routes.**
Spec: seven cities.
Today: routes, depots and disposal sites exist only for Dubai, Sharjah and Ajman.
Why it matters: do Abu Dhabi, Fujairah, RAK and UAQ have routes today, and which depots and disposal sites serve them?

**Q42. Who maintains the master lists?**
Spec: section 7, admin-maintained tables.
Today: read-only lookups (entities, cities, depots, disposal sites, service types, truck types, skill codes, waste codes, shifts).
Why it matters: who owns each list (Operations, HR, Fleet, Finance), and do changes need approval?

**Q43. People and entities.**
Today: each service pro belongs to an entity, but a GGM driver can be assigned to an RWC route if skills allow.
Why it matters: is cross-entity staffing allowed, and does it need a charge between companies?

## H. The CRM and the driver app

**Q44. Who is master for the time window and access notes?**
Spec: section 5, clients and service points are mastered in the CRM; section 5.1, the dispatcher sees and edits the window on the service item.
Today: the window and fill-rate override live on the service line (CRM contract data) but are edited in Field Ops.
Why it matters: should a window change in Field Ops write back to the CRM contract, or is the window an operations field that the CRM only reads?

**Q45. Proof requirements per stream.**
Spec: "the proof required (photo, weight, signature)" per stop.
Today: the handling method decides what the driver records (fill level and contamination for bins; container tags, ticket and facility for exchanges; seals, consignment note and empties for medical and hazardous; litres and manifest for pump-outs). Photos are always expected; a signature only for packaged waste.
Why it matters: confirm per stream what is mandatory to close a stop, and what the customer must receive (consignment note copy, monthly proof of service).

**Q46. Offline and timing in the driver app.**
Why it matters: do drivers have connectivity at disposal sites and inside malls, and must the app work offline? When does a stop count as "arrived" (GPS inside a radius, or the driver taps)?

---

## Assumptions we made without asking

Short list of design choices in the prototype that the spec did not state. Say "no" to any of them.

| # | Assumption | Where |
| --- | --- | --- |
| A1 | A service line sits on exactly one active route; attaching to another is a transfer (R10), effective immediately | Route detail, Service lines tab |
| A2 | Routes with nothing due are not generated (Q9) | Generate summary |
| A3 | A night run is dated by its start day (Q10) | Dispatch, Shift board |
| A4 | Weekdays = every day except Sunday (Q11) | Route schedule |
| A5 | "Monthly" = chosen weekday in the first week of the month (Q12) | Service lines |
| A6 | A trainee fills a helper slot (Q18) | Staffing |
| A7 | Pool assets are filled by the engine and only flagged (Q16) | Generate |
| A8 | Confirm anyway is allowed for unstaffed or over-capacity runs and is recorded (Q17, Q29) | Dispatch |
| A9 | A run with any failed or cancelled stop is Partially completed (Q35) | Instance status |
| A10 | Capacity belongs to the truck type, with two limits and a binding one (section 3.6 of operations-flow.md) | Capacity |
| A11 | The default route of an ad-hoc job is the route of the requested service line (Q23) | Backlog |
| A12 | Entity of a service line is inferred from the waste stream until the CRM provides it (Q7) | Mock data |
