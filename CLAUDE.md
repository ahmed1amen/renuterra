# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev                # Dev server at http://localhost:3000
pnpm build              # Production build (must pass with no env vars)
pnpm typecheck          # next typegen + tsc --noEmit
pnpm lint               # Biome check (lint:fix to write, format for formatter only)
pnpm test               # Vitest run (test:watch for watch mode)
pnpm test src/features/comments/threads.test.ts   # Single test file
pnpm test:e2e           # Playwright — builds and serves automatically
```

- Playwright needs a one-time `pnpm exec playwright install chromium`.
- Vitest picks up `src/**/*.test.{ts,tsx}` and `tests/unit/**`; Playwright specs live in `tests/e2e/`.
- Commits follow Conventional Commits by convention (not enforced); lint-staged runs Biome on staged files.

## Architecture

Frontend-only Next.js 16 App Router app (React 19, TypeScript strict, Tailwind v4 CSS-first, shadcn/ui on **Base UI** primitives, TanStack Query, Zustand, React Hook Form + Zod). No database or auth; data comes from an external API via `NEXT_PUBLIC_API_URL`.

**Thin routes, fat apps.** Files in `src/app/` are route definitions only — no data fetching or JSX beyond mapping a URL to a page module. Real screens live in `src/apps/<app>/` (`main`, `styleguide`). Adding an app = `src/apps/<name>/` + a route group in `src/app/` that imports from it.

**Registry-driven styleguide.** `/styleguide` is a catch-all route driven by a single array: add a page in `src/apps/styleguide/pages/` and register it in `src/apps/styleguide/sections.ts` — sidebar, routing, and static params derive from it.

**PM commenting** (`src/features/comments/` + `src/components/shared/comments/`): pages under `AppLayout` are wrapped in `CommentSurface`, which lets reviewers pin threaded comments onto the page (press `c`, click, type). Backed by Supabase (`supabase/migrations/0001_page_comments.sql`, browser client in `src/lib/supabase.ts`); positions are stored as % of the page content area, scoped by pathname, live-synced via Realtime, deep-linked with `?comment=<id>`. Without `NEXT_PUBLIC_SUPABASE_*` env vars the whole layer is hidden and pages render untouched — everything must keep working with no env vars set.

**Data layer.** Mock fixtures and `mockFetch` (artificial latency, scenario-aware) live in `src/mocks/`. Screens consume them only through TanStack Query hooks in `src/features/crm/hooks/`; `src/features/crm/api.ts` is the single file to change when the real API lands. Query keys are centralized in `src/features/crm/hooks/query-keys.ts`.

**Where things go** (mirrors the `cmp-ui` structure):

| Scope | Location |
| --- | --- |
| A screen | `src/apps/<app>/pages/<Page>/<Page>.tsx` + `index.ts` |
| Component used by one screen | `pages/<Page>/components/` |
| Component used across one app | `src/apps/<app>/components/` |
| Component used everywhere | `src/components/shared/` (kebab-case) |
| shadcn/ui primitives | `src/components/ui/` (vendored, editable) |
| Domain hooks spanning apps | `src/features/<domain>/hooks/` |
| API client / errors | `src/lib/api/` |

## Prototypes are prototypes, not product

This project builds **interactable prototypes only** — that's the rule. Screens should feel real to click through, but there is no real business logic behind them. Use mock data, localStorage, in-memory Zustand stores, or whatever is simplest to fake interactivity. Never build real validation, real API integration, auth, persistence guarantees, or production-grade logic into a prototype — if it looks and clicks right, it's done.

## Conventions and constraints

- Server Components by default; `"use client"` only where interactivity requires it.
- Import through barrels (`@/components/shared`, `@/hooks`, `@/constants`), not deep paths.
- shadcn/ui here sits on Base UI: compose with the `render` prop, **not** `asChild`. Add components with `pnpm dlx shadcn@latest add <component>` and document them in the styleguide. No new UI libraries.
- App screens may only use `src/components/ui`, `src/components/shared`, and theme tokens — no ad-hoc styling that bypasses the design system.
- Style with theme tokens (`bg-card`, `text-muted-foreground`), never hardcoded hex, so both themes stay correct. Primary buttons take dark text on lime (white fails contrast); links/info are navy; waste streams keep fixed colors (`bg-stream-recyclable` …). Brand tokens live in `src/app/globals.css`.
- Read env through `@/env` (T3 Env, validated at build), never `process.env` directly. Everything must work with no env vars set.
- Files kebab-case, components PascalCase; keep Biome clean.
