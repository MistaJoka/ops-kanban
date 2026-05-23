# Agent guide — OpsBoard AI blueprint

This repo is a **pre-build blueprint**. Implementation follows the **AI build protocol** and phase tasks.

## Start here (every session)

0. [`docs/roadmap/DOC_INDEX.md`](docs/roadmap/DOC_INDEX.md) — which file is canonical (avoid duplicate plans)
1. [`docs/roadmap/PROGRESS.md`](docs/roadmap/PROGRESS.md) — live dashboard (**read first**)
2. [`docs/roadmap/AI_BUILD_PROTOCOL.md`](docs/roadmap/AI_BUILD_PROTOCOL.md) — session loop + per-phase steps
3. [`docs/roadmap/PROBLEM_REGISTRY.md`](docs/roadmap/PROBLEM_REGISTRY.md) — open troubles (search before debugging)
4. [`docs/roadmap/BUILD_KNOWLEDGE.md`](docs/roadmap/BUILD_KNOWLEDGE.md) — reinforced patterns (LEARN-*)
5. [`docs/roadmap/MVP_CAPTURE.md`](docs/roadmap/MVP_CAPTURE.md) — frozen scope
6. [`docs/roadmap/PHASE_TASKS.md`](docs/roadmap/PHASE_TASKS.md) — pick **one** `TASK-Px-xxx`
7. [`docs/roadmap/DEFINITION_OF_DONE.md`](docs/roadmap/DEFINITION_OF_DONE.md) — exit criteria
8. [`docs/product/NO_MOCK_DATA_POLICY.md`](docs/product/NO_MOCK_DATA_POLICY.md) — **no mock production data**
9. [`docs/cursor/CURSOR_MASTER_PROMPT.md`](docs/cursor/CURSOR_MASTER_PROMPT.md) — product rules

## End of session (required)

| Step | File |
|------|------|
| 1 | Append [`DEVELOPMENT_LOG.md`](docs/roadmap/DEVELOPMENT_LOG.md) (use enhanced template: Progress, Troubles, Fix, Learning) |
| 2 | Update [`PROGRESS.md`](docs/roadmap/PROGRESS.md) (phase %, blockers, next tasks) |
| 3 | Set task status in [`PHASE_TASKS.md`](docs/roadmap/PHASE_TASKS.md) |
| 4 | If blocked or >15 min lost | Add [`PROBLEM_REGISTRY.md`](docs/roadmap/PROBLEM_REGISTRY.md) **PRB-*** |
| 5 | If pattern reusable | Add [`BUILD_KNOWLEDGE.md`](docs/roadmap/BUILD_KNOWLEDGE.md) **LEARN-*** |

**Rule:** Code changed without a LOG entry is not done.

## Canonical references

| Topic | Doc |
|-------|-----|
| Pipeline (9 col) | `docs/product/DEFAULT_PIPELINE.md` — ends with **`archived`** |
| Pipeline (19 col) | `docs/product/FULL_PIPELINE.md` |
| Cards | `docs/product/CARD_DESIGN.md` |
| Workspace | `docs/product/WORKSPACE_DESIGN.md` |
| API | `docs/api/API_ROUTES.md` |
| AI approval | `docs/api/APPROVAL_FLOW.md` |
| DB | `docs/database/MVP_SCHEMA.md` + `supabase/migrations/` |
| RLS | `004_rls_policies.sql` |
| AI | `docs/ai/AI_UTILIZATION.md` |
| Tests | `docs/testing/README.md` |
| CSS dev guardrails | `docs/testing/CSS_DEV_GUARDRAILS.md` |
| Design tokens | `docs/product/DESIGN_TOKENS.md` |
| UI philosophy | `docs/product/UI_MASTER_FORMULA.md` |

## Architecture

- `docs/roadmap/ARCHITECTURE_PRINCIPLES.md` — domain layers, adapters
- Business logic in `lib/domain/*`, not in components
- AI never writes DB directly — tools only

## Do not

- Add sample cards or demo data to production paths
- Use `DATABASE_SCHEMA.md` for MVP (legacy)
- Skip RLS on new tables
- Ship `tool-executor` without domain persistence (Phase 5)
- Skip post-session PROGRESS / LOG / PRB / LEARN updates
- Run `npm run build` while `next dev` is running — poisons `.next` and breaks CSS (see `docs/testing/CSS_DEV_GUARDRAILS.md`, `npm run dev:clean`)

## Migrations order

`001` → `002` → `003` → `004` → `005` → `006` → `007` → `008` → `009` → `010` → `011` → `012` → `013` → `014` → `015` → `016`

## Session prompt snippet

```txt
Follow docs/roadmap/AI_BUILD_PROTOCOL.md.
Read PROGRESS.md and open PROBLEM_REGISTRY items.
Execute one TASK-Px-xxx; end with LOG + PROGRESS + LEARN/PRB as needed.
```
