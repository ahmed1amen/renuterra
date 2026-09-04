# Renuterra

Frontend-only Next.js application. No database or auth layer — data comes from an
external API via `NEXT_PUBLIC_API_URL`.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React Compiler) |
| UI runtime | React 19 |
| Language | TypeScript 5.9 (strict), `@/*` alias |
| Styling | Tailwind CSS v4 (CSS-first config) |
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

A living reference for the design system at
[`/styleguide`](http://localhost:3000/styleguide), reachable from the topbar.
Sections: Overview (tokens), Buttons, Forms, Cards, Dropdowns, Feedback, States,
Layout.

Every section is prerendered at `/styleguide/<id>`; an unknown id 404s. To add
one, drop a page in `src/apps/styleguide/pages/` and register it in
`src/apps/styleguide/sections.ts` — the sidebar, routing and static params all
derive from that array.

Build examples from theme tokens (`bg-card`, `text-muted-foreground`), never
hardcoded hex, so both themes stay correct.

Playwright browsers need a one-time `pnpm exec playwright install chromium`.

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
      Styleguide.tsx        Shell: sidebar, search, section switching
      sections.ts           Section registry (id, label, icon, component)
      components/           SectionHeader, Demo, Swatch
      pages/                One file per section
  assets/icons/             Static SVG/icon assets
  components/
    shared/                 Cross-app components (kebab-case)
    ui/                     shadcn/ui, vendored and yours to edit
  constants/                app.ts, storage.ts + barrel
  enums/
  features/<domain>/hooks/  Domain logic shared across apps
  hooks/                    Shared React hooks + barrel
  layouts/                  app-layout.tsx, app-topbar.tsx
  lib/
    api/                    client.ts, errors.ts
    query-client.ts         createQueryClient() factory
    utils.ts                cn()
  mocks/                    Fixture JSON
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
