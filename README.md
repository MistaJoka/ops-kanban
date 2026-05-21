# AI-First Operations Kanban MVP

A production-oriented MVP blueprint for a **landscaping SMB job pipeline** on a single universal Kanban board.

This is not a basic Trello clone. The app uses one **Job Pipeline** board as the main workspace. Each card is a deep operational record for a property job from inquiry through paid and **archived**.

## Vertical

**Landscaping / lawn-care** — inquiries, site visits, estimates, crew scheduling, invoicing, and AI assist for field and office work.

See `docs/product/VERTICAL_LANDSCAPING.md`.

## Core product thesis

```txt
The board is the business.
The card is the source of truth.
Columns are job states.
Views are lenses over the same data.
AI is the operational copilot.
```

## Development roadmap (start here to build)

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](AGENTS.md) | **AI/agent entry** — session loop |
| [AI_BUILD_PROTOCOL.md](docs/roadmap/AI_BUILD_PROTOCOL.md) | Phases for AI + mandatory progress/trouble/learning updates |
| [PROGRESS.md](docs/roadmap/PROGRESS.md) | Live build dashboard (read first each session) |
| [PROBLEM_REGISTRY.md](docs/roadmap/PROBLEM_REGISTRY.md) | Troubles → root cause → fix (problem sourcing) |
| [BUILD_KNOWLEDGE.md](docs/roadmap/BUILD_KNOWLEDGE.md) | LEARN-* patterns for reinforced learning |
| [DEVELOPMENT_ROADMAP.md](docs/roadmap/DEVELOPMENT_ROADMAP.md) | Phases, sprints, gates, how to extend safely |
| [MVP_CAPTURE.md](docs/roadmap/MVP_CAPTURE.md) | Frozen Wave 0 scope |
| [PHASE_TASKS.md](docs/roadmap/PHASE_TASKS.md) | Task IDs P0–P10 (backlog) |
| [DEFINITION_OF_DONE.md](docs/roadmap/DEFINITION_OF_DONE.md) | Completion criteria per phase |
| [DEVELOPMENT_LOG.md](docs/roadmap/DEVELOPMENT_LOG.md) | Chronological build log |
| [ARCHITECTURE_PRINCIPLES.md](docs/roadmap/ARCHITECTURE_PRINCIPLES.md) | Stable layering for future fixes |
| [NO_MOCK_DATA_POLICY.md](docs/product/NO_MOCK_DATA_POLICY.md) | **No mock data / fake placeholders in production** |
| [PRE_BUILD_CONFIRMATION.md](docs/roadmap/PRE_BUILD_CONFIRMATION.md) | Pre-build sign-off checklist |
| [REPO_COMPLETENESS_AUDIT.md](docs/roadmap/REPO_COMPLETENESS_AUDIT.md) | Repo audit (contradictions resolved) |
| [API_ROUTES.md](docs/api/API_ROUTES.md) | REST / Server Action catalog |
| [APPROVAL_FLOW.md](docs/api/APPROVAL_FLOW.md) | AI approval sequence |
| [DESIGN_TOKENS.md](docs/product/DESIGN_TOKENS.md) | CSS variables & fonts |

## Doc map (product & technical)

| Doc | Purpose |
|-----|---------|
| [MVP_SCOPE.md](docs/product/MVP_SCOPE.md) | In/out of v1 |
| [DEFAULT_PIPELINE.md](docs/product/DEFAULT_PIPELINE.md) | 9 landscaping columns + `state_key`s |
| [VERTICAL_LANDSCAPING.md](docs/product/VERTICAL_LANDSCAPING.md) | Terminology, fields, AI examples |
| [CARD_DESIGN.md](docs/product/CARD_DESIGN.md) | Board card + detail panel: logic, layout, style |
| [WORKSPACE_DESIGN.md](docs/product/WORKSPACE_DESIGN.md) | App shell, sidebar, Job Pipeline workspace |
| [FULL_PIPELINE.md](docs/product/FULL_PIPELINE.md) | 19-column full pipeline + groups |
| [SUPPORT_PAGES.md](docs/product/SUPPORT_PAGES.md) | Help, contact, changelog routes |
| [AI_UTILIZATION.md](docs/ai/AI_UTILIZATION.md) | How AI is used across the app |
| [AI_PROMPT_LIBRARY.md](docs/ai/AI_PROMPT_LIBRARY.md) | Example commands by role |
| [PLATFORM_CAPABILITIES.md](docs/product/PLATFORM_CAPABILITIES.md) | Best-of-SaaS modules (pay, sign, schedule, comms) |
| [INTEGRATION_ARCHITECTURE.md](docs/integrations/INTEGRATION_ARCHITECTURE.md) | Webhooks, OAuth, reliability |
| [PROVIDER_MATRIX.md](docs/integrations/PROVIDER_MATRIX.md) | Stripe, PayPal, Twilio, DocuSign, etc. |
| [docs/testing/README.md](docs/testing/README.md) | **QA pack** — modular tests, FMEA, risk, regression |
| [PHASED_BUILD_PLAN.md](docs/cursor/PHASED_BUILD_PLAN.md) | Build phases (canonical order) |
| [MVP_SCHEMA.md](docs/database/MVP_SCHEMA.md) | Tables in migration vs deferred |
| [SIGNUP_BOOTSTRAP.md](docs/database/SIGNUP_BOOTSTRAP.md) | Org + board + column seed on signup |
| [PRODUCT_BRIEF.md](docs/product/PRODUCT_BRIEF.md) | Success criteria |
| [CURSOR_MASTER_PROMPT.md](docs/cursor/CURSOR_MASTER_PROMPT.md) | Cursor agent instructions |

## What this ZIP contains

- Landscaping product scope and 9-column pipeline
- End-to-end workflows (full lifecycle; MVP uses shortened pipeline)
- MVP page map and deferred views
- Database schema + migration starter + signup bootstrap spec
- AI implementation architecture and tool registry
- Cursor implementation prompts and phased plan
- Frontend/AI starter snippets (`src-starter/` — not a full Next.js app)

## Recommended stack

- Next.js (App Router)
- TypeScript
- Tailwind + shadcn/ui
- Supabase (Auth, Postgres, Realtime)
- Gemini 2.5 Flash (`GEMINI_API_KEY`)

## First 30 minutes (when starting implementation)

1. Read `MVP_SCOPE.md` and `DEFAULT_PIPELINE.md`.
2. Create Supabase project; run migrations `001` through `006` in order.
3. Scaffold Next.js app; copy `src-starter/` patterns into the app.
4. Implement Phase 1: auth, RLS, signup bootstrap with `LANDSCAPING_DEFAULT_COLUMNS` from `src-starter/lib/landscaping-default-columns.ts`.
5. Build the operations board (Phase 2) before estimates, AI, or extra views.

## Build order

Canonical plan: **`docs/cursor/PHASED_BUILD_PLAN.md`**.

Summary:

1. Foundation + **RLS** + landscaping column seed
2. Job pipeline board (Kanban)
3. Deep card modal (property, scope, schedule)
4. Estimates and invoices
5. AI (board + card only)
6. Minimal dashboard (defer full calendar/reports)
7. Hardening (rate limits, polish)

## Primitive compression

```txt
Business = crew company
Board = job pipeline
Card = property job
Column = job state
AI = office + field copilot
Dashboard = today’s jobs and money
```

## Note

This repository is a **blueprint**, not a runnable app. `package.json` lists AI/Supabase libraries only; initialize Next.js at build time and pin dependency versions.
