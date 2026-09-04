# Renuterra

Frontend-only Next.js application. No database or auth layer — data comes from an
external API via `NEXT_PUBLIC_API_URL`.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React Compiler) |
| UI runtime | React 19 |
| Language | TypeScript 5.9 (strict), `@/*` alias |
| Styling | Tailwind CSS v4 (CSS-first config), Plus Jakarta Sans + Geist Mono |
| Components | shadcn/ui on Base UI primitives, lucide-react icons |
| Theming | next-themes (class strategy, system default) |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Forms | React Hook Form + Zod v4 |
| Env | T3 Env (validated at build time) |
| Lint/format | Biome 2 |
| Unit tests | Vitest + Testing Library (jsdom) |
| E2E | Playwright |
| Hooks | Husky + lint-staged + commitlint (conventional commits) |
| CI | GitHub Actions — typecheck → lint → test → build |
| Package manager | pnpm |

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server on http://localhost:3000 |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | Biome check (add `:fix` to write) |
| `pnpm format` | Biome formatter |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm test:e2e` | Playwright (builds and serves automatically) |

## Styleguide

A living reference for the Renuterra design system at
[`/styleguide`](http://localhost:3000/styleguide), reachable from the topbar.
It documents the brand tokens in `src/app/globals.css` and every component in
`src/components/ui` and `src/components/shared`, grouped as Foundations
(Brand, Color, Typography, Spacing), Components (Buttons, Inputs & forms,
Status badges & tags, Cards, Tables, Sidebar & top nav, KPI tiles & charts,
Empty/loading/error, Menus & toasts) and Screens (sample CRM screens).

Every section is prerendered at `/styleguide/<id>`; an unknown id 404s. To add
one, drop a page in `src/apps/styleguide/pages/` and register it in
`src/apps/styleguide/sections.ts` — the sidebar, routing and static params all
derive from that array. Sample content lives in `src/apps/styleguide/data.ts`.

Brand rules worth knowing: primary buttons take dark text on lime (white fails
contrast), links and info badges are navy, status tones are `success` /
`warning` / `info` / `destructive` / `neutral` and waste streams keep a fixed
colour everywhere (`bg-stream-recyclable` …). Build from theme tokens
(`bg-card`, `text-muted-foreground`), never hardcoded hex, so both themes stay
correct.

Playwright browsers need a one-time `pnpm exec playwright install chromium`.

## Prototypes

A playground at [`/prototypes`](http://localhost:3000/prototypes) for building
mobile CRM screens as real React pages on the design system, reviewed by PMs on
Vercel preview deployments with Toolbar comments.

- Screens live in `src/apps/prototypes/screens/` and are registered in
  `src/apps/prototypes/registry.ts` (`slug`, `title`, `description`, `status`,
  `component`). Adding a prototype = one screen file + one registry entry; the
  sidebar, index cards, static params and tests derive from the array.
- Screens render inside a device frame. `?device=iphone|android|bare` switches
  the chrome and `?scenario=empty|error|loading` forces every mock request into
  that state, so a review link captures exactly what the reviewer saw.
- Data comes from `src/mocks/` through TanStack Query hooks in
  `src/features/crm/`. `src/features/crm/api.ts` is the only file to change
  when the real API lands.
- Screens may only use `src/components/ui`, `src/components/shared` and theme
  tokens. If a component is missing, add it via shadcn and document it in the
  styleguide first.

## Layout

Mirrors the `cmp-ui` structure. Screens live in `src/apps/<app>/pages/`; the
App Router files in `src/app/` are thin route definitions that map a URL to a
page module and own nothing else.

```
src/
  api/                      Typed API surface (Orval-shaped)
    Api/<resource>/         One folder per resource + index barrel
    index.ts                export * as Api
  app/                      App Router — thin route files only
    layout.tsx              Root layout, mounts <AppProviders>
    page.tsx                / -> apps/main/pages/Dashboard
    error.tsx not-found.tsx
  apps/                     One folder per portal/app
    main/
      components/           Components local to this app
      constants/
      pages/
        Dashboard/          PascalCase page folder
          Dashboard.tsx     Implementation
          index.ts          Barrel
        index.ts
      utils/
    styleguide/             Living design-system reference at /styleguide
      Styleguide.tsx        Shell: header, grouped sidebar, section switching
      sections.ts           Section registry (id, label, number, group, component)
      data.ts               Sample CRM content used by the demos
      components/           SectionHeader, Demo, CrmFrame, KpiTile
      pages/                One file per section
    prototypes/             Mobile CRM prototype playground at /prototypes
      registry.ts           Prototype registry (slug, title, status, component)
      components/           Shell, phone frame, viewport/scenario switchers
      screens/              One file per prototype screen
  assets/icons/             Static SVG/icon assets
  components/
    shared/                 Cross-app components (kebab-case)
    ui/                     shadcn/ui, vendored and yours to edit
  constants/                app.ts, storage.ts + barrel
  enums/
  features/<domain>/hooks/  Domain logic shared across apps
    crm/                    CRM data access (api.ts) + TanStack Query hooks
  hooks/                    Shared React hooks + barrel
  layouts/                  app-layout.tsx, app-topbar.tsx
  lib/
    api/                    client.ts, errors.ts
    query-client.ts         createQueryClient() factory
    utils.ts                cn()
  mocks/                    Typed CRM fixtures, mockFetch, scenario store
  providers/                app-providers.tsx + barrel
  types/                    Shared types + barrel
  env.ts                    Validated environment variables
tests/
  setup.ts                  Vitest setup (jest-dom, matchMedia polyfill)
  e2e/                      Playwright specs
```

### Where things go

| Scope | Location |
| --- | --- |
| A screen | `src/apps/<app>/pages/<Page>/<Page>.tsx` + `index.ts` |
| Sub-view of a screen | `pages/<Page>/List/`, `View/`, `Detail/` |
| Component used by one screen | `pages/<Page>/components/` |
| Component used across one app | `src/apps/<app>/components/` |
| Component used everywhere | `src/components/shared/` |
| Domain hooks spanning apps | `src/features/<domain>/hooks/` |
| Endpoint bindings | `src/api/Api/<resource>/` |

Adding an app: create `src/apps/<name>/`, then a route group
`src/app/(<name>)/` whose files import from it.

## Conventions

- Server Components by default; add `"use client"` only where interactivity requires it.
- Route files stay thin — no data fetching or JSX beyond composing a layout and a page.
- Import through barrels (`@/components/shared`, `@/hooks`, `@/constants`), not deep paths.
- shadcn/ui is Base UI underneath: compose with the `render` prop, not `asChild`.
- Read env through `@/env`, never `process.env` directly, so validation is enforced.
- Adding UI: `pnpm dlx shadcn@latest add <component>`.
- Commit messages follow Conventional Commits; `commit-msg` hook enforces it.
