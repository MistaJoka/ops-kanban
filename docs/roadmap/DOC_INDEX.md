# Documentation index — what to use when

Single map to avoid duplicate plans and drift. **Do not add a second roadmap.**

---

## Canonical (use these)

| Need                         | Doc                                                                               | Not this                                           |
| ---------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Build order & sprints**    | [`DEVELOPMENT_ROADMAP.md`](./DEVELOPMENT_ROADMAP.md)                              | `PHASED_BUILD_PLAN.md` (redirect only)             |
| **Task backlog**             | [`PHASE_TASKS.md`](./PHASE_TASKS.md)                                              | `IMPLEMENTATION_CHECKLIST.md` (redirect only)      |
| **Phase complete?**          | [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md)                                | —                                                  |
| **AI session loop**          | [`AI_BUILD_PROTOCOL.md`](./AI_BUILD_PROTOCOL.md) + [`AGENTS.md`](../../AGENTS.md) | —                                                  |
| **Live status**              | [`PROGRESS.md`](./PROGRESS.md)                                                    | —                                                  |
| **Frozen MVP intent**        | [`MVP_CAPTURE.md`](./MVP_CAPTURE.md)                                              | —                                                  |
| **MVP checklist (detailed)** | [`MVP_SCOPE.md`](../product/MVP_SCOPE.md)                                         | Duplicates capture — cross-linked                  |
| **9-column pipeline**        | [`DEFAULT_PIPELINE.md`](../product/DEFAULT_PIPELINE.md)                           | `landscaping-default-columns.ts` (code mirror)     |
| **19-column pipeline**       | [`FULL_PIPELINE.md`](../product/FULL_PIPELINE.md)                                 | `END_TO_END_WORKFLOWS.md` (narrative only)         |
| **DB for MVP**               | [`MVP_SCHEMA.md`](../database/MVP_SCHEMA.md) + [`SCHEMA_CHANGELOG.md`](../database/SCHEMA_CHANGELOG.md) + `supabase/migrations/` | `DATABASE_SCHEMA.md` (legacy)                      |
| **Column seed at signup**    | [`SIGNUP_BOOTSTRAP.md`](../database/SIGNUP_BOOTSTRAP.md)                          | `supabase/seed/*.sql` (commented reference)        |
| **API shapes**               | [`API_ROUTES.md`](../api/API_ROUTES.md) + [`API_PATTERNS.md`](../api/API_PATTERNS.md) | `API_CONTRACTS.md` (tests + route inventory)       |
| **Route inventory (tests)**  | [`API_CONTRACTS.md`](../testing/API_CONTRACTS.md) § Route inventory                   | —                                                  |
| **Layering rules**           | [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md)                      | `SYSTEM_ARCHITECTURE.md` (diagram)                 |
| **AI build phases**          | [`AI_PHASES.md`](../ai/AI_PHASES.md)                                              | Waves A–D → AI-P2–P5                               |
| **AI product behavior**      | [`AI_UTILIZATION.md`](../ai/AI_UTILIZATION.md)                                    | —                                                  |
| **AI competitive benchmark** | [`AI_COMPETITIVE_BENCHMARK.md`](../ai/AI_COMPETITIVE_BENCHMARK.md)                | —                                                  |
| **AI wiring**                | [`AI_IMPLEMENTATION.md`](../ai/AI_IMPLEMENTATION.md)                              | —                                                  |
| **AI tools list**            | [`AI_TOOL_REGISTRY.md`](../ai/AI_TOOL_REGISTRY.md)                                | `src-starter/lib/ai/tool-registry.ts` (code)       |
| **Success criteria**         | [`PRODUCT_BRIEF.md`](../product/PRODUCT_BRIEF.md)                                 | —                                                  |
| **Cursor product rules**     | [`CURSOR_MASTER_PROMPT.md`](../cursor/CURSOR_MASTER_PROMPT.md)                    | Phase numbers inside = pre-P0 labels; map to P1–P6 |
| **UI philosophy**            | [`UI_MASTER_FORMULA.md`](../product/UI_MASTER_FORMULA.md)                         | Ad-hoc UI notes in chat or PROGRESS                |
| **AI slop detection**        | [`AI_SLOP_DETECTION.md`](../testing/AI_SLOP_DETECTION.md)                         | Ad-hoc “does this feel right?” in chat             |
| **Slop baseline / drift**    | [`AI_SLOP_BASELINE_AUDIT.md`](./AI_SLOP_BASELINE_AUDIT.md)                        | One-off complaints without PRB                     |

---

## Redirect / legacy (do not extend)

| File                                                               | Role                               |
| ------------------------------------------------------------------ | ---------------------------------- |
| [`PHASED_BUILD_PLAN.md`](../cursor/PHASED_BUILD_PLAN.md)           | Wave → P0–P10 mapping only         |
| [`IMPLEMENTATION_CHECKLIST.md`](../../IMPLEMENTATION_CHECKLIST.md) | Pointer to `PHASE_TASKS.md`        |
| [`DATABASE_SCHEMA.md`](../database/DATABASE_SCHEMA.md)             | Long-term reference; legacy banner |

---

## Complementary pairs (not duplicates)

| A                         | B                                | Why both                                   |
| ------------------------- | -------------------------------- | ------------------------------------------ |
| `MVP_CAPTURE`             | `MVP_SCOPE`                      | Frozen intent vs detailed in/out checklist |
| `PRODUCT_BRIEF`           | `VERTICAL_LANDSCAPING`           | Success criteria vs domain language        |
| `ARCHITECTURE_PRINCIPLES` | `SYSTEM_ARCHITECTURE`            | Rules vs layer diagram                     |
| `API_ROUTES`              | `API_CONTRACTS`                  | Spec vs test IDs                           |
| `RISK_MODEL`              | `FMEA`                           | RBT scoring vs failure table               |
| `AI_UTILIZATION`          | `AI_IMPLEMENTATION`              | Product vs engineering                     |
| `AI_UTILIZATION`          | `AI_COMPETITIVE_BENCHMARK`       | Behavior spec vs elite market comparison   |
| `DEFAULT_PIPELINE.md`     | `landscaping-default-columns.ts` | Doc + typed constant (keep in sync)        |
| External skills advisory  | `docs/external-skills/README.md` | `vendor-skills/raw/` (audit-only archive)  |

---

## Starter code (one place)

All pre-P0 snippets live under **`src-starter/`** (including `components/ai/`).  
Copy into the Next.js app per `TASK-P0-005` — do not maintain parallel `components/` at repo root.

---

## Phase number map (Cursor prompt vs roadmap)

| Cursor master prompt      | Roadmap                                   |
| ------------------------- | ----------------------------------------- |
| Phase 1: Core data model  | **P1** Foundation (after **P0** scaffold) |
| Phase 2: Operations board | **P2** Workspace                          |
| Phase 3: Deep card modal  | **P3** Deep card                          |
| Phase 4: Money drafts     | **P4** Money                              |
| Phase 5: AI subsystem     | **P5** AI                                 |
| Phase 6: MVP release      | **P6** Release                            |
| (not in prompt)           | **P7–P10** Platform waves                 |
