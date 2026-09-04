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
| Components | shadcn/ui on Radix primitives, lucide-react icons |
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

Playwright browsers need a one-time `pnpm exec playwright install chromium`.

## Layout

```
src/
  app/                    App Router routes, layout, globals.css
  components/
    providers/            Theme + TanStack Query providers
    ui/                   shadcn/ui components (vendored, yours to edit)
  hooks/                  Shared React hooks
  lib/
    api-client.ts         fetch wrapper, throws ApiError on non-2xx
    utils.ts              cn() class merger
  stores/                 Zustand stores
  types/                  Shared types
  env.ts                  Validated environment variables
tests/
  setup.ts                Vitest setup (jest-dom, matchMedia polyfill)
  e2e/                    Playwright specs
```

## Conventions

- Server Components by default; add `"use client"` only where interactivity requires it.
- Read env through `@/env`, never `process.env` directly, so validation is enforced.
- Adding UI: `pnpm dlx shadcn@latest add <component>`.
- Commit messages follow Conventional Commits; `commit-msg` hook enforces it.
