# Renuterra product context

Read this before speccing or building any screen. It explains what the prototype is, where its vocabulary comes from, and which doc to open next.

## What we're building

Renuterra is a B2B commercial waste collection, disposal and recycling company in the **UAE** (Dubai HQ, also Sharjah, Ajman and Umm Al Quwain). This repo is a **clickable prototype** of its next-generation platform. There are two tracks:

1. **Field Service ("Field Ops").** Scheduling, dispatch, routing and execution of collections. The product shape and vocabulary follow **Aspyn** (a pest-control field-service platform we know well), adapted to waste. Today Renuterra runs operations in Evreka/E360, outside the CRM. This module brings operations in-house.
2. **CRM revamp.** The current production CRM (`Renuterra-crm`: React/Vite + Express) will be rebuilt here. It covers sales (leads → opportunities → quotes → contracts), customers and service points, monthly invoicing, customer service cases, destruction certificates, ESG waste reports and a customer portal.

Both tracks share one domain model. A **contract line** in the CRM becomes a **subscription** that Field Service schedules, and completed **appointments** become billable quantities on the monthly **invoice**.

## Docs

| Doc | Use it for |
| --- | --- |
| [glossary.md](./glossary.md) | Every term we use, mapped Aspyn ⇄ Renuterra CRM ⇄ waste meaning. **Use these names in code and UI.** |
| [domain-model.md](./domain-model.md) | Entities, fields, status enums, lifecycles, IDs/numbering, time and money rules for mock data. |
| [screens.md](./screens.md) | Module and screen map for Field Service and the CRM revamp, plus the UI patterns to copy. |
| [industry-standards.md](./industry-standards.md) | UAE regulatory context and waste-industry operating standards that screens and data should reflect. |

## Naming rule

Use **Aspyn names for field-service concepts**: Service Center, Service Pro, Calendar Event, Appointment, Work Order, Route, Shift, Subscription, Backlog. Use **Renuterra names for commercial and waste concepts**: Customer, Service Point, Service Item, Contract, Quote, Waste Stream, Proof of Service, Destruction Certificate. When the two overlap, glossary.md decides.

## Sources (for humans; agents don't need to open them)

- Aspyn backend: `~/projects/aptive/aspyn/field-service/docs/*-reference.md` (appointments, scheduling, routing, subscriptions, service centers, auto-plan).
- Aspyn UI: `~/projects/aptive/aspyn/ui/src/apps/field-service`, `src/features/dispatch`.
- Current CRM: `~/projects/tifnex/Renuterra-crm/docs/PROJECT_DOCUMENTATION.md`, `server/db.js`.

Aspyn belongs to another company. We borrow its **vocabulary, product shape and UX patterns**, never its code or assets.

## Current prototype vs. target

The existing Field Service mocks (`src/mocks/types.ts`) still use `Job` and `Technician`. These map to **Appointment** and **Service Pro**. New work uses the target names. Rename the old ones when a screen is next touched, or in a dedicated pass.
