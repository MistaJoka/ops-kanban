# AI-First Operations Kanban MVP

A **runnable Next.js app** and landscaping operations blueprint. Status: **pilot staging ready** (P17 complete — see [`docs/roadmap/PROGRESS.md`](docs/roadmap/PROGRESS.md)).

One **Job Pipeline** board is the main workspace. Each card is a deep operational record for a property job from inquiry through paid and **archived**.

## Vertical

**Landscaping / lawn-care** — inquiries, site visits, estimates, crew scheduling, invoicing, and AI assist for field and office work.

See [`docs/product/VERTICAL_LANDSCAPING.md`](docs/product/VERTICAL_LANDSCAPING.md).

## Core product thesis

```txt
The board is the business.
The card is the source of truth.
Columns are job states.
Views are lenses over the same data.
AI is the operational copilot.
```

## Where to start

| Audience | Start here |
| -------- | ---------- |
| **AI / Cursor sessions** | [`context/START_HERE.md`](context/START_HERE.md) → [`AGENTS.md`](AGENTS.md) |
| **Canonical doc map** | [`docs/roadmap/DOC_INDEX.md`](docs/roadmap/DOC_INDEX.md) |
| **Live build status** | [`docs/roadmap/PROGRESS.md`](docs/roadmap/PROGRESS.md) |
| **Production pilot deploy** | [`docs/ops/PILOT_DEPLOY_CHECKLIST.md`](docs/ops/PILOT_DEPLOY_CHECKLIST.md) |
| **Pilot day-one ops** | [`docs/ops/PILOT_DAY_ONE.md`](docs/ops/PILOT_DAY_ONE.md) |

Full doc library: product, API, database, testing, and AI specs under `docs/` — indexed in [`DOC_INDEX.md`](docs/roadmap/DOC_INDEX.md).

## Recommended stack

- Next.js (App Router)
- TypeScript
- Tailwind + shadcn/ui
- Supabase (Auth, Postgres, Realtime)
- Gemini 2.5 Flash (`GEMINI_API_KEY`)

## Running locally

1. Copy `.env.example` → `.env.local` and fill Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`).
2. `npm install`
3. Apply migrations: `npm run db:migrate` (runs `001` through `021` in order).
4. `npm run dev` — opens at [http://localhost:3000](http://localhost:3000) (redirects to `/pipeline` when `DISABLE_AUTH=true`).
5. Verify env: [http://localhost:3000/api/health](http://localhost:3000/api/health) should return `"ok": true`.

### Common commands

| Command                    | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `npm run test:unit`        | Pipeline, money, AI unit tests                |
| `npm run test:integration` | Supabase integration (requires `.env.local`)  |
| `npm run test:e2e:smoke`   | Playwright smoke (`@smoke`)                   |
| `npm run check:doc-sync`   | Doc drift checks (routes, migrations, context) |
| `npm run build`            | Production build check                        |

Env vars are validated in `lib/env/` and consumed by Supabase clients in `lib/db/supabase/`. Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CRON_SECRET`, `SENTRY_DSN`) never use the `NEXT_PUBLIC_` prefix.

For production pilot: set `DISABLE_AUTH=false`, configure integrations in Settings, and set `CRON_SECRET` if using Vercel Cron for `/api/contracts/run-due`.

## Build history

Phases **P0–P17** are complete (scaffold through backend reliability). Task backlog: [`docs/roadmap/PHASE_TASKS.md`](docs/roadmap/PHASE_TASKS.md) (P0–P17). Build order and gates: [`docs/roadmap/DEVELOPMENT_ROADMAP.md`](docs/roadmap/DEVELOPMENT_ROADMAP.md).

## Primitive compression

```txt
Business = crew company
Board = job pipeline
Card = property job
Column = job state
AI = office + field copilot
Dashboard = today's jobs and money
```
