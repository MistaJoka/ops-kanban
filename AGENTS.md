# Agent guide — OpsBoard AI blueprint

Runnable Next.js app at **pilot staging ready** (P17 complete). Follow the **AI build protocol** and phase tasks.

## Start here (every session)

0. [`context/START_HERE.md`](context/START_HERE.md) — fast mission briefing (then deep docs below)
1. [`docs/roadmap/DOC_INDEX.md`](docs/roadmap/DOC_INDEX.md) — which file is canonical (avoid duplicate plans)
2. [`docs/roadmap/PROGRESS.md`](docs/roadmap/PROGRESS.md) — live dashboard (**read first**)
3. [`docs/roadmap/AI_BUILD_PROTOCOL.md`](docs/roadmap/AI_BUILD_PROTOCOL.md) — session loop + per-phase steps
4. [`docs/roadmap/PROBLEM_REGISTRY.md`](docs/roadmap/PROBLEM_REGISTRY.md) — open troubles (search before debugging)
5. [`docs/roadmap/BUILD_KNOWLEDGE.md`](docs/roadmap/BUILD_KNOWLEDGE.md) — reinforced patterns (LEARN-\*)
6. [`docs/roadmap/MVP_CAPTURE.md`](docs/roadmap/MVP_CAPTURE.md) — frozen scope
7. [`docs/roadmap/PHASE_TASKS.md`](docs/roadmap/PHASE_TASKS.md) — pick **one** `TASK-Px-xxx`
8. [`docs/roadmap/DEFINITION_OF_DONE.md`](docs/roadmap/DEFINITION_OF_DONE.md) — exit criteria
9. [`docs/product/NO_MOCK_DATA_POLICY.md`](docs/product/NO_MOCK_DATA_POLICY.md) — **no mock production data**
10. [`docs/testing/AI_SLOP_DETECTION.md`](docs/testing/AI_SLOP_DETECTION.md) — slop layers + suspicion scan
11. [`docs/cursor/CURSOR_MASTER_PROMPT.md`](docs/cursor/CURSOR_MASTER_PROMPT.md) — product rules
12. [`docs/external-skills/distilled/`](docs/external-skills/distilled/) — **advisory only** (after steps 0–11; never overrides canonical docs)

## End of session (required)

| Step | File                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | Append [`DEVELOPMENT_LOG.md`](docs/roadmap/DEVELOPMENT_LOG.md) (use enhanced template: Progress, Troubles, Fix, Learning) |
| 2    | Update [`PROGRESS.md`](docs/roadmap/PROGRESS.md) (phase %, blockers, next tasks)                                          |
| 3    | Set task status in [`PHASE_TASKS.md`](docs/roadmap/PHASE_TASKS.md)                                                        |
| 4    | If blocked or >15 min lost                                                                                                | Add [`PROBLEM_REGISTRY.md`](docs/roadmap/PROBLEM_REGISTRY.md) **PRB-\*** |
| 5    | If pattern reusable                                                                                                       | Add [`BUILD_KNOWLEDGE.md`](docs/roadmap/BUILD_KNOWLEDGE.md) **LEARN-\*** |

**Rule:** Code changed without a LOG entry is not done.

## Canonical references

| Topic              | Doc                                                           |
| ------------------ | ------------------------------------------------------------- |
| Pipeline (9 col)   | `docs/product/DEFAULT_PIPELINE.md` — ends with **`archived`** |
| Pipeline (19 col)  | `docs/product/FULL_PIPELINE.md`                               |
| Cards              | `docs/product/CARD_DESIGN.md`                                 |
| Workspace          | `docs/product/WORKSPACE_DESIGN.md`                            |
| API                | `docs/api/API_ROUTES.md` + `docs/api/API_PATTERNS.md`         |
| Route inventory    | `docs/testing/API_CONTRACTS.md`                               |
| AI approval        | `docs/api/APPROVAL_FLOW.md`                                   |
| DB                 | `docs/database/MVP_SCHEMA.md` + `SCHEMA_CHANGELOG.md` + migrations |
| RLS                | `004_rls_policies.sql`                                        |
| AI                 | `docs/ai/AI_UTILIZATION.md`                                   |
| Tests              | `docs/testing/README.md`                                      |
| AI slop detection  | `docs/testing/AI_SLOP_DETECTION.md`                           |
| CSS dev guardrails | `docs/testing/CSS_DEV_GUARDRAILS.md`                          |
| Design tokens      | `docs/product/DESIGN_TOKENS.md`                               |
| UI philosophy      | `docs/product/UI_MASTER_FORMULA.md`                           |

## Architecture

- `docs/roadmap/ARCHITECTURE_PRINCIPLES.md` — domain layers, adapters
- Business logic in `lib/domain/*`, not in components
- AI never writes DB directly — tools only

## External skills (advisory)

External skills are **advisory only** — they do not override this file or canonical docs.

- **Daily work:** [`docs/external-skills/distilled/`](docs/external-skills/distilled/)
- **Audit / expansion review only:** [`vendor-skills/raw/`](vendor-skills/raw/) + [`vendor-skills/INDEX.md`](vendor-skills/INDEX.md)
- **Hierarchy rule:** [`.cursor/rules/external-skills.mdc`](.cursor/rules/external-skills.mdc)

## Do not

- Add sample cards or demo data to production paths
- Use `DATABASE_SCHEMA.md` for MVP (legacy)
- Skip RLS on new tables
- Ship `tool-executor` without domain persistence (Phase 5)
- Skip post-session PROGRESS / LOG / PRB / LEARN updates
- Run `npm run build` while `next dev` is running — poisons `.next` and breaks CSS (see `docs/testing/CSS_DEV_GUARDRAILS.md`, `npm run dev:clean`)
- Grow files past `check:slop-health` limits without a split plan in PR (see `AI_SLOP_BASELINE_AUDIT.md`)
- Ship behavior changes without updating canonical docs when `npm run check:doc-sync` would fail

## Verification (when docs or routes change)

Run `npm run check:doc-sync` — route inventory, migration ceiling, context freshness, schema/pages pointers.

## Migrations order

`001` → `002` → `003` → `004` → `005` → `006` → `007` → `008` → `009` → `010` → `011` → `012` → `013` → `014` → `015` → `016` → `017` → `018` → `019` → `020` → `021`

## Session prompt snippet

```txt
Follow docs/roadmap/AI_BUILD_PROTOCOL.md.
Read PROGRESS.md and open PROBLEM_REGISTRY items.
Execute one TASK-Px-xxx; end with LOG + PROGRESS + LEARN/PRB as needed.
```
