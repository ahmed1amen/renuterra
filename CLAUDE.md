# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                # Dev server at http://localhost:3000
pnpm build              # Production build (must pass with no env vars)
pnpm typecheck          # next typegen + tsc --noEmit
pnpm lint               # Biome check (lint:fix to write, format for formatter only)
pnpm test               # Vitest run (test:watch for watch mode)
pnpm test src/features/comments/threads.test.ts   # Single test file
pnpm test:e2e           # Playwright: builds and serves automatically
```

- Playwright needs a one-time `pnpm exec playwright install chromium`.
- Vitest picks up `src/**/*.test.{ts,tsx}` and `tests/unit/**`; Playwright specs live in `tests/e2e/`.
- Commits follow Conventional Commits by convention (not enforced); lint-staged runs Biome on staged files.

## Product context

Renuterra is a UAE B2B waste collection/recycling company. This repo prototypes its next platform: a **Field Ops** module that **replaces Evreka** (today's operations system), modelled on Aspyn's field-service product (Service Pros, Calendar Events/Appointments, Work Orders, Routes, Shifts, Dispatch, Backlog) and a **revamp of the current Renuterra CRM** (leads → quotes → contracts, customers & service points, invoicing, cases, destruction certificates, ESG reports). Read `docs/product/` before speccing or building a screen:

- `docs/product/glossary.md`: canonical names. Use these exactly in types, hooks, files and UI copy.
- `docs/product/domain-model.md`: entities, status enums, IDs/numbering, time (UTC stored, `Asia/Dubai` shown) and money (AED, 5% VAT).
- `docs/product/screens.md`: module and screen map plus UI patterns.
- `docs/product/industry-standards.md`: UAE regulation and waste-ops norms (chain of custody, proof of service, failed visits, ESG KPIs).
- `docs/product/operations-flow.md`: how Field Ops runs end to end (setup, daily cycle, capacity, backlog), with what is built vs planned.
- `docs/product/specs/route-definition.md`: **the business's own Route spec** (from the Managing Director; the original with inline images is `Route Definition and Resource Allocation - Operations System Specification.md` at the repo root). It is the **source of the goals and rules** for anything touching routes, assignments, instances, dispatch, capacity or ad-hoc jobs. Always check it, and cite its section (e.g. section 8.2, rule R11) in docs and code comments. But it is a statement of intent, not a design to copy: its tables, examples and wording are illustrative. Meet every goal and rule with a clean, consistent structure, and where the spec is inconsistent or under-specified, choose the sound design, note how it maps back to the spec, and list the decision as an open question for operations (see section 3.6 of `operations-flow.md` for the pattern).

## Architecture

Frontend-only Next.js 16 App Router app (React 19, TypeScript strict, Tailwind v4 CSS-first, shadcn/ui on **Base UI** primitives, TanStack Query, Zustand, React Hook Form + Zod). No database or auth; all data is mock JSON served through `mockFetch`, and `NEXT_PUBLIC_API_URL` is reserved for the future API.

**Writing style.** In everything written for this project (docs, code comments, UI copy, commit messages, agent output, replies), never use the section sign `§` or em dashes. Write "section 8.2" instead of "§8.2", and use a colon, comma, semicolon or parentheses where an em dash would go.

**No reference-product names in the codebase.** Aspyn, Evreka and any other product or company this prototype borrows from or replaces may be named only in `docs/` (and in this file). Never in source code, code comments, test names, UI copy, mock data, commit messages or file names. Describe the behaviour itself instead ("Phase-1 route optimisation", not "VROOM-style"; "the existing operations system", not "Evreka"). Real places a customer would recognise in mock data (e.g. a disposal facility's name) are fine.

**Thin routes, fat apps.** Each app lives in `src/app/<app>/` (`main`, `field-service`, `sales`, `styleguide`) and holds both its routes and its screens. `page.tsx` files are route definitions only: metadata plus `<AppLayout><Screen /></AppLayout>`, no data fetching or other JSX. Screens live in `src/app/<app>/pages/<Page>/` and are imported via `@/app/<app>/pages`. `main` has no routes of its own; its screens back `/` and `/dashboard`. Adding an app = `src/app/<name>/` + an entry in `APP_NAVS` (`src/layouts/nav.ts`), which drives the sidebar and the primary action.

**Registry-driven styleguide.** `/styleguide` is a catch-all route driven by a single array: add a page in `src/app/styleguide/pages/` and register it in `src/app/styleguide/sections.ts`: sidebar, routing, and static params derive from it.

**PM commenting** (`src/features/comments/` + `src/components/shared/comments/`): pages under `AppLayout` are wrapped in `CommentSurface`, which lets reviewers pin threaded comments onto the page (press `c`, click, type). Backed by Supabase (`supabase/migrations/0001_page_comments.sql` and `0002_page_comment_images.sql`, browser client in `src/lib/supabase.ts`); positions are stored as % of the page content area, scoped by pathname, live-synced via Realtime, deep-linked with `?comment=<id>`. Without `NEXT_PUBLIC_SUPABASE_*` env vars the whole layer is hidden and pages render untouched: everything must keep working with no env vars set.

**Data layer.** Mock fixtures are JSON in `src/mocks/data/` (see its README for adding a dataset); `mockFetch` (artificial latency, honours the global `default | empty | error | loading` scenario in `src/mocks/scenario.ts`) lives in `src/mocks/`. Screens consume data only through TanStack Query hooks in `src/features/<domain>/hooks/`; each domain's `api.ts` is the single file to change when the real API lands. Query keys are centralized per domain (`src/features/crm/hooks/query-keys.ts`, `src/features/field-service/query-keys.ts`). Client-only UI state (e.g. dispatch board) goes in a Zustand store next to the feature.

**Field Ops business rules** live as pure functions in `src/features/field-service/`: `route-rules.ts` (spec rules R1 to R12, R14, R21, R22, truck capacity limits and the binding limit; R13 and R20 sit in `route-store.ts`, R15 and R16 in `dispatch-engine.ts`), `capacity-forecast.ts` (worst case / forecast / actual load, suggested fill rate, the snapshot frozen at Confirm), `dispatch-engine.ts` (instance generation), `reports.ts` (the spec section 11 reports and the Performance tab), `route-score.ts` and `route-optimizer.ts`. Screens call these rather than re-deriving numbers, so the board, the Route page and the engine always agree.

**Where things go** (mirrors the `cmp-ui` structure):

| Scope | Location |
| --- | --- |
| A route | `src/app/<app>/<segment>/page.tsx` |
| A screen | `src/app/<app>/pages/<Page>/<Page>.tsx` + `index.ts`, exported from `pages/index.ts` |
| Component used by one screen | `pages/<Page>/components/` |
| Component used across one app | `src/app/<app>/components/` |
| App constants / helpers | `src/app/<app>/constants/`, `src/app/<app>/utils/` |
| Component used everywhere | `src/components/shared/` (kebab-case) |
| shadcn/ui primitives | `src/components/ui/` (vendored, editable) |
| Domain hooks spanning apps | `src/features/<domain>/hooks/` |
| API client / errors | `src/lib/api/` |
| Cross-app modal stores | `src/stores/` |
| App shell (sidebar, topbar, nav, ⌘K palette) | `src/layouts/` |

## Prototypes are prototypes, not product

This project builds **interactable prototypes only**: that's the rule. Screens should feel real to click through, but there is no real business logic behind them. Use mock data, localStorage, in-memory Zustand stores, or whatever is simplest to fake interactivity. Never build real validation, real API integration, auth, persistence guarantees, or production-grade logic into a prototype; if it looks and clicks right, it's done.

## Conventions and constraints

- Server Components by default; `"use client"` only where interactivity requires it.
- Import through barrels (`@/components/shared`, `@/hooks`, `@/constants`), not deep paths.
- shadcn/ui here sits on Base UI: compose with the `render` prop, **not** `asChild`. Add components with `pnpm dlx shadcn@latest add <component>` and document them in the styleguide. No new UI libraries.
- App screens may only use `src/components/ui`, `src/components/shared`, and theme tokens: no ad-hoc styling that bypasses the design system.
- Selects are `Combobox` / `MultiCombobox` (`@/components/ui/combobox`, searchable): never `NativeSelect`. Forms use default control sizes (40px); toolbar rows use `size="sm"` (36px) throughout; don't hard-code control heights.
- UI look and layout follow Aspyn (`~/projects/aptive/aspyn/ui`, read-only reference): its styleguide for list/detail/form pages, `src/features/dispatch` for map boards.
- Style with theme tokens (`bg-card`, `text-muted-foreground`), never hardcoded hex, so both themes stay correct. Primary buttons are navy with white text (`variant="default"`); lime is a brand accent; links/info are navy; waste streams keep fixed colors (`bg-stream-recyclable` …). Brand tokens live in `src/app/globals.css`.
- Read env through `@/env` (T3 Env, validated at build), never `process.env` directly. Everything must work with no env vars set.
- Files kebab-case, components PascalCase; keep Biome clean.
- **Desktop only for now.** Don't build, review, test or report on mobile/responsive layouts until this rule is lifted.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
