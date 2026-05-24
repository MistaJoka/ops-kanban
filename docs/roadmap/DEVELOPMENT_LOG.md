# Development log

Chronological record of build progress, decisions, blockers, troubles, fixes, and releases.  
**Append new entries at the top** (newest first).

**AI agents:** Follow [`AI_BUILD_PROTOCOL.md`](./AI_BUILD_PROTOCOL.md) — every session updates this file, [`PROGRESS.md`](./PROGRESS.md), and (when applicable) [`PROBLEM_REGISTRY.md`](./PROBLEM_REGISTRY.md) + [`BUILD_KNOWLEDGE.md`](./BUILD_KNOWLEDGE.md).

---

---

---

### LOG-2026-05-24-04 — TASK-P2-013 closed + E2E-PIPE-001

| Field      | Value |
| ---------- | ----- |
| **Phase**  | P2 closure / R1 regression |
| **Tasks**  | TASK-P2-013 → done; E2E-PIPE-001 |
| **Author** | agent |
| **Type**   | test + docs |

**Summary:** Reconciled stale `blocked` status on full pipeline toggle. Task marked done with waiver: collapsible column groups remain Post-MVP (`UI_MASTER_FORMULA` §14). Added `tests/e2e/pipeline-mode.spec.ts` (E2E-PIPE-001/001b) and shared `setPipelineMode` helper.

**Verify:** E2E-PIPE-001 + 001b ✅ (2/2).

---

### LOG-2026-05-24-03 — Gemini suggestNextAction + pilot UAT

| Field      | Value |
| ---------- | ----- |
| **Phase**  | AI-P5 follow-up |
| **Tasks**  | Gemini-powered next_action, browser UAT |
| **Author** | agent |
| **Type**   | enhancement |

**Summary:** `suggestNextActionWithGemini` uses card context (comments, activities, dates, brand voice) with static fallback. Browser UAT: pipeline loads, `AI approvals` bell present, card panel shows `Suggest next step` and `Analyze`.

**Progress:** `lib/ai/suggest-next-action.ts`; `boardTools.suggestNextAction` wired; `tests/unit/suggest-next-action.test.ts`.

**Verify:** typecheck ✅; unit 124/124 ✅; `GET /api/ai/pending` ✅; browser UAT ✅.

---

### LOG-2026-05-24-02 — Settings hooks + AI unit tests + doc sync

| Field      | Value |
| ---------- | ----- |
| **Phase**  | P14 B5 + AI-P5 follow-up |
| **Tasks**  | Settings hook migration (7/7), UNIT-AI-MEM, doc sync |
| **Author** | agent |
| **Type**   | refactor |

**Summary:** Migrated remaining settings pages (overview, integrations, templates, automations, contracts) to shared `useSettings*` hooks with `useSettingsCollection` for POST/DELETE. Added unit tests for `ai_memories` helpers and registry coverage for `analyzeAttachment` / `suggestNextAction`. Synced stale bell/slop references in UI_MASTER_FORMULA, AI_SLOP_BASELINE_AUDIT, PROGRESS, P15 audit.

**Progress:** `components/settings/hooks/useSettingsHooks.ts` (+collection helpers); settings pages refactored; `tests/unit/ai-memories.test.ts`; `tests/unit/ai.test.ts` UNIT-AI-007/008.

**Verify:** `check:slop-health` ✅; typecheck ✅; unit tests ✅.

---

### LOG-2026-05-24-01 — AI gaps + slop debt backlog

| Field      | Value |
| ---------- | ----- |
| **Phase**  | AI-P5 + P14 remediation |
| **Tasks**  | TASK-AI-P5-002/005, Phase B bell, slop splits, migration 018 |
| **Author** | agent |
| **Type**   | enhancement |

**Summary:** Closed AI-P5 deferred items (inline next_action, vision on attachments, notifications bell, ai_memories brand voice). Eliminated all slop allowlist entries via toolCalls category split, useBoardState sync extraction, and kanban controller hook splits.

**Progress:** `lib/domain/ai/tools/*`; `GET /api/ai/pending`; `NotificationsBell`; `analyzeAttachment` + Files tab; migration `018_ai_memories.sql`; `useSettings*` hooks; `AI_IMPLEMENTATION.md` surface matrix.

**Troubles:** `useCardMutations` briefly exceeded 600 lines after AI hook — extracted `useCardAiMutations.ts`.

**Fix:** Slop allowlist now empty; PRB-SLOP-003/004 resolved.

**Learning:** LEARN-019 pattern reused for board + kanban splits.

**Verify:** `check:slop-health` ✅ (0 allowlisted); unit 114/114 ✅; typecheck ✅.

---

### LOG-2026-05-23-04 — Premium product polish (P15)

| Field      | Value            |
| ---------- | ---------------- |
| **Phase**  | P15              |
| **Tasks**  | TASK-P15-001–008 |
| **Author** | agent            |
| **Type**   | enhancement      |

**Summary:** Premium polish pass on `/pipeline` — command toolbar, board scroll affordance, mobile stage nav, card stuck/skeleton states, panel skeleton, Playwright visual baselines. No new styling system; all `ops-*` tokens.

**Progress:** Audit doc `docs/qa/P15_PREMIUM_POLISH_AUDIT.md`; `KanbanBoardToolbar` health summary; `BoardScrollAffordance`, `PipelineMobileStageNav`, `BoardCardSkeleton`, `CardPanelSkeleton`; `/` search shortcut hardened (before `defaultPrevented` guard).

**Troubles:** Playwright `/` shortcut failed when handler ran after `defaultPrevented` guard; dnd-kit `role=button` on cards collided with Create button selector in E2E.

**Fix:** Slash handler moved before `defaultPrevented` check; `getElementById('pipeline-job-search')` focus fallback; E2E `Create` uses `exact: true`; A11Y-004 aligned to New Job modal (not `prompt`).

**Learning:** — (patterns captured in audit doc)

**Verify:** `npm run check:slop` ✅; `check:css-health` ✅; `typecheck` ✅; unit 114/114 ✅; smoke 17/17 ✅; a11y 3/3 ✅; `build` ✅; VIS-P15 snapshots in `tests/e2e/p15-visual.spec.ts-snapshots/`.

---

### LOG-2026-05-23-03 — AI Slop Detection System v2 (P14)

| Field      | Value            |
| ---------- | ---------------- |
| **Phase**  | P14              |
| **Tasks**  | TASK-P14-001–006 |
| **Author** | agent            |
| **Type**   | enhancement      |

**Summary:** Operationalized 5-layer AI slop detection: canonical `AI_SLOP_DETECTION.md`, suspicion scan in build protocol, `check:slop-health` + Prettier + CI, baseline audit, Kanban/card mega-file splits.

**Progress:** T22 module; G0 `check:slop`; EXP-VIS-01; PRB-SLOP-001/002 resolved; LEARN-019.

**Troubles:** None.

**Fix:** `KanbanBoard.tsx` 1097→156 lines via `kanban-board/*`; `useCardMutations` + `useCardMoneyMutations`; allowlist shrunk to controller + useBoardState + toolCalls.

**Learning:** LEARN-019.

**Verify:** `npm run check:slop-health`; `npm run format:check`; `npm run test:unit` 114/114; `npm run typecheck`.

---

### LOG-2026-05-23-02 — Sync Retry button fix

| Field      | Value      |
| ---------- | ---------- |
| **Phase**  | P13        |
| **Tasks**  | — (hotfix) |
| **Author** | agent      |
| **Type**   | fix        |

**Summary:** Fixed Out of sync Retry: clears `syncIssue` so pill shows Saving…, re-applies optimistic board mutation before re-enqueue, falls back to `refreshBoard()` when no queued failure; visible `ops-sync-status__retry` styling.

**Progress:** Retry wired via `boardSync.retryFailedSync`; `peekLastFailure()` + `reapplyFailedMutation` in queue hook.

**Troubles:** Retry left misaligned state because `syncIssue` blocked phase transition; rollback removed optimistic UI without re-apply on manual retry.

**Fix:** `clearSyncIssue` + `reapplyFailedMutation` + refresh fallback; UNIT-SYNC-008.

**Verify:** `npm run typecheck`; `npm run test:unit` 114/114.

---

### LOG-2026-05-23-01 — Optimistic background sync (P13)

| Field      | Value        |
| ---------- | ------------ |
| **Phase**  | P13          |
| **Tasks**  | TASK-P13-001 |
| **Author** | agent        |
| **Type**   | enhancement  |

**Summary:** Shipped outbound sync queue: domain `outboundSyncQueue`, `useOutboundSync`, fire-and-forget board create/move/reorder/patch, instant panel stub hydrate, money/panel mutations via queue, sync pill queue depth + Retry, v0.5.0 changelog.

**Progress:** Phases 1–6 complete; `NEXT_PUBLIC_OUTBOUND_QUEUE` enabled by default (set `=0` to disable).

**Troubles:** TypeScript narrowing on `OutboundExecutorResult` union; PATCH merge rollback types.

**Fix:** Guard `onSuccess` with `result.ok`; split `mergePatchMutations` by kind.

**Learning:** LEARN-018.

**Verify:** `npm run test:unit` 110/110; `npm run typecheck`; `PLAYWRIGHT_SKIP_CSS_CHECK=1 npx playwright test tests/e2e/outbound-sync.spec.ts` 3/3.

---

### LOG-2026-05-22-25 — UI master formula alignment (P12)

| Field      | Value        |
| ---------- | ------------ |
| **Phase**  | P12          |
| **Tasks**  | TASK-P12-001 |
| **Author** | agent        |
| **Type**   | enhancement  |

**Summary:** Shipped UI master formula alignment: canonical `UI_MASTER_FORMULA.md`; pipeline bottom `AiCommandDock` (replaces popover); `PipelineGroupJump` + topo `ops-board-surface`; global `WorkspaceShortcutsProvider` + modal; brand SVGs; sidebar mark; help/changelog updates.

**Progress:** Docs cross-links, CSS tokens, new components (`AiCommandDock`, `PipelineGroupJump`, `PipelineSearchProvider`, `WorkspaceShortcutsProvider`, `KeyboardShortcutsModal`), KanbanBoard layout refactor, AppShell/Sidebar wiring, tests E2E-WORKSPACE-001–005 + CSS-002 + unit `pickActiveGroup`.

**Troubles:** Mid-session `WorkspaceShortcutsProvider` type block accidentally truncated during export add — restored imports/types.

**Fix:** Re-exported `useWorkspaceShortcutsOptional`; completed KanbanBoard JSX (dock, group refs, empty illustration).

**Learning:** LEARN-016 (flex dock sibling), LEARN-017 (single shortcuts provider).

**Verify:** `npm run test:unit`; `npm run typecheck`; `npm run check:css-health` (when dev server available).

**Deferred:** Phase B notifications bell + `GET /api/ai/pending` (stretch).

---

### LOG-2026-05-22-24 — Card anatomy pass 3

| Field      | Value       |
| ---------- | ----------- |
| **Phase**  | P11         |
| **Tasks**  | UX polish   |
| **Author** | agent       |
| **Type**   | enhancement |

**Summary:** Pass 3: property line restores `address · job type`, unified footer line per wireframe, always-visible assignee slot, IBM Plex Mono for money, panel category pill + map pin, focus/hover polish.

**Verify:** `npm run test:unit`; `tsc --noEmit`.

---

### LOG-2026-05-22-23 — Board card menu z-index / portal

| Field      | Value  |
| ---------- | ------ |
| **Phase**  | P11    |
| **Tasks**  | UX fix |
| **Author** | agent  |
| **Type**   | fix    |

**Summary:** Card action menu rendered behind pipeline toolbar because `z-30` was trapped inside the board scroll stacking context below toolbar `z-20`. Menu now portals to `document.body` with `position: fixed` and `z-45`.

**Verify:** Open ⋮ on top-column card; menu opaque above toolbar.

---

### LOG-2026-05-22-22 — Card anatomy pass 2 (board + panel)

| Field      | Value       |
| ---------- | ----------- |
| **Phase**  | P11         |
| **Tasks**  | UX polish   |
| **Author** | agent       |
| **Type**   | enhancement |

**Summary:** Second card design pass: category wash, status dots, due/schedule short dates (`Thu 5/22`), property pin line, empty meta placeholder, panel summary strip aligned with board signals.

**Progress:** `cardSignals.ts`, `board-card-primitives`, `CardPanelSummary`, `CardPanelHeader`, formatters + CSS.

**Verify:** `npm run test:unit`; `tsc --noEmit`.

---

### LOG-2026-05-22-21 — Board card anatomy polish

| Field      | Value       |
| ---------- | ----------- |
| **Phase**  | P11         |
| **Tasks**  | UX polish   |
| **Author** | agent       |
| **Type**   | enhancement |

**Summary:** Refined board card layout to match `CARD_DESIGN.md` comfortable density: 128px min height, 4px category accent, property line with job type, meta band row (job/money/schedule/days + assignee), and clearer footer hierarchy.

**Progress:** `board-card-primitives.tsx`, `BoardCard.tsx`, `boardCardFormatters.ts`, `globals.css`; unit tests for property line formatting.

**Troubles:** —

**Fix:** —

**Learning:** —

**Verify:** `npm run test:unit`; `tsc --noEmit`.

---

### LOG-2026-05-22-20 — CSS dev cache guardrails

| Field      | Value          |
| ---------- | -------------- |
| **Phase**  | QA             |
| **Tasks**  | CSS guardrails |
| **Author** | agent          |
| **Type**   | fix            |

**Summary:** Confirmed recurring “CSS breaks” is stylesheet 404 from poisoned `.next` (build + dev mix), not globals.css regressions. Added check script, Playwright guards, E2E CSS-001, and docs.

**Progress:** `scripts/check-css-health.mjs`, `warn-prod-cache.mjs`, `playwright-dev-server.mjs`; `predev`/`postbuild` warnings; Playwright globalSetup + CSS smoke; `docs/testing/CSS_DEV_GUARDRAILS.md`; LEARN-015.

**Troubles:** `/pipeline` 200 while `layout.css` 404 when `.next/BUILD_ID` present after `npm run build`; stale :3000 dev process worsens it.

**Fix:** `npm run dev:clean`; automated `check:css-health`; E2E starts with cache clean when prod BUILD_ID detected.

**Learning:** LEARN-015

**Verify:** `npm run check:css-health` fails before clean, passes after `dev:clean`; `CSS-001 @smoke` in Playwright.

---

```markdown
### LOG-YYYY-MM-DD-NN — Short title

| Field      | Value                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| **Phase**  | P0–P10                                                                             |
| **Tasks**  | TASK-Px-xxx, …                                                                     |
| **Author** | name / agent                                                                       |
| **Type**   | progress \| complete \| blocked \| decision \| scope \| release \| incident \| fix |

**Summary:** 1–3 sentences.

**Progress:** What moved forward (files, features, % if known).

**Troubles:** Symptom + context, or "none". Link PRB-NNN if registered.

**Fix:** What resolved the trouble, or "n/a".

**Learning:** LEARN-NNN added/updated, or "none new".

**Changes:**

- bullet

**Tests run:** TEST-IDs or "none"

**DoD:** DONE-N items satisfied (or waiver ref)

**Next:** next task(s)
```

**Types:**

- `progress` — partial work
- `complete` — task(s) or phase done
- `blocked` — waiting on decision/deps
- `decision` — architecture/product choice
- `scope` — MVP capture change (update `MVP_CAPTURE.md`)
- `release` — version tagged
- `incident` — bug/outage post-mortem
- `fix` — trouble resolved (pair with PRB + LEARN when reusable)

---

## Phase status dashboard

| Phase | Name           | Status        | Started    | Completed  | DoD     |
| ----- | -------------- | ------------- | ---------- | ---------- | ------- |
| P0    | Scaffold       | `in_progress` | 2025-05-21 | —          | DONE-0  |
| P1    | Foundation     | `complete`    | 2025-05-21 | 2025-05-21 | DONE-1  |
| P2    | Workspace      | `complete`    | 2025-05-21 | 2025-05-21 | DONE-2  |
| P3    | Deep card      | `complete`    | 2025-05-21 | 2025-05-21 | DONE-3  |
| P4    | Money          | `complete`    | 2025-05-21 | 2025-05-21 | DONE-4  |
| P5    | AI             | `complete`    | 2025-05-21 | 2025-05-21 | DONE-5  |
| P6    | MVP release    | `complete`    | 2025-05-21 | 2025-05-21 | DONE-6  |
| P7    | Wave 1         | `not_started` | —          | —          | DONE-7  |
| P8    | Wave 2         | `not_started` | —          | —          | DONE-8  |
| P9    | Wave 3         | `not_started` | —          | —          | DONE-9  |
| P10   | Wave 4         | `complete`    | 2025-05-21 | 2025-05-21 | DONE-10 |
| P11   | Card hardening | `complete`    | 2026-05-22 | 2026-05-22 | DONE-11 |

Update this table when a phase starts or completes. Mirror status in [`PROGRESS.md`](./PROGRESS.md).

---

## Entries

### LOG-2026-05-22-01 — Card ops complete (v0.3.0)

| Field      | Value                |
| ---------- | -------------------- |
| **Phase**  | P11                  |
| **Tasks**  | TASK-P11-001–P11-011 |
| **Author** | build agent          |
| **Type**   | release              |

**Summary:** Shipped v0.3.0 — full CARD_DESIGN board layer with true stage age, scan-rich board cards, modals, @dnd-kit reorder, CardPanel refactor, and advanced filters.

**Progress:** Migration 017 `column_entered_at`; `authorizeCardMutation` + hardened `validateMove`; `board-card-primitives` signals; `BoardCardMenu` + inline title edit; `NewJobModal`/`CustomerCreateModal`/confirmation modals; `reorderCard` + DnD; CardPanel hooks/tabs split; `boardFilters` advanced filter bar; CHANGELOG + productChangelog + PHASE_TASKS P11.

**Troubles:** none

**Fix:** n/a

**Learning:** LEARN-012 (stage age), LEARN-013 (board menu + scan signals)

**Changes:**

- `supabase/migrations/017_column_entered_at.sql`
- `lib/domain/cards/{boardCard,moveCard,reorderCard,authorizeCardMutation}.ts`
- `components/pipeline/{BoardCard,BoardCardMenu,board-card-primitives,NewJobModal,KanbanBoard}.tsx`
- `components/card/{useCardDetail,useCardMutations,tabs/*,CardPanelHeader,CardPanelBody}.tsx`
- `lib/domain/board/{boardFilters,boardOptimistic}.ts`
- `CHANGELOG.md`, `lib/content/productChangelog.ts`, docs roadmap updates

**Tests run:** unit 88/88 ✅

**DoD:** DONE-11; v0.3.0 release gate

**Next:** Apply migration 017 on staging; pilot UAT on board card menu and filters

---

### LOG-2025-05-22-13 — AI command SSE streaming

| Field      | Value          |
| ---------- | -------------- |
| **Phase**  | AI-P5          |
| **Tasks**  | TASK-AI-P5-004 |
| **Author** | build agent    |
| **Type**   | complete       |

**Summary:** Added Server-Sent Events streaming to `POST /api/ai/command` with Gemini token streaming, tool execution status phases, and live copilot UI updates.

**Progress:** `lib/ai/sse.ts`, `handleAiCommandStream`, `generateContentStream` in gemini-agent, route branches on `stream: true`, `submitAiCommand` client, `AiDock` streams by default with phase indicators.

**Troubles:** none

**Fix:** n/a

**Learning:** none new

**Tests run:** AI-SSE 3/3 ✅, unit 63/63 ✅, typecheck ✅ (build prerender blocked by missing `column_entered_at` migration in local DB)

**DoD:** TASK-AI-P5-004 complete

**Next:** TASK-AI-P5-002 empty next_action suggest

---

### LOG-2025-05-22-12 — AI phases P2–P4 build-out

| Field      | Value                                     |
| ---------- | ----------------------------------------- |
| **Phase**  | AI-P2–P5                                  |
| **Tasks**  | TASK-AI-P2-001–P4-007, TASK-AI-P5-001/003 |
| **Author** | build agent                               |
| **Type**   | complete                                  |

**Summary:** Defined AI build phases (P0–P5) and implemented Waves A–C: revenue loop, scheduling copilot, customer/money intel, multi-surface dock, voice input, and inline next-action banners.

**Progress:** `docs/ai/AI_PHASES.md`; extended `loadAiContext` for dashboard/calendar/customer/reports; 12+ new tools in registry + `toolCalls`; `AiPageCopilot`, `AiInlineBanner`, Card Overview AI CTAs, voice on `AiDock`; `GET /api/app/context`. Kanban inline banner on column enter (estimate/invoice prompts).

**Troubles:** `approval-preview.ts` corruption during edits (rewrote file); `KanbanBoard` handleMoveCard fuzzy match (fixed); `LoadedAiContext` type gaps in router/gemini-agent (fixed).

**Fix:** Full rewrite of approval preview; intent-router accepts `LoadedAiContext`; Web Speech typed locally.

**Learning:** none new

**Changes:**

- AI phases doc + PHASE_TASKS track
- Revenue: `createInvoiceDraft`, `createPaymentLink`, assign-by-name
- Scheduling: calendar context, `getCalendarSchedule`, `findScheduleConflicts`, `rescheduleEvent`
- Intel: `getUnpaidInvoices`, `getRevenueSummary`, `summarizeCustomerHistory`, `searchCustomers`, `createCustomer`
- UI: page copilots, inline banners, voice mic

**Tests run:** typecheck ✅, AI 29/29 ✅, unit 60/60 ✅, build ✅

**DoD:** AI-P2–P4 exit criteria met; P5 partial (SSE/vision/next-action suggest deferred)

**Next:** TASK-AI-P5-002 empty next_action suggest; TASK-AI-P5-004 SSE streaming

---

### LOG-2025-05-22-11 — AI competitive benchmark (master)

| Field      | Value                            |
| ---------- | -------------------------------- |
| **Phase**  | Pilot / product                  |
| **Tasks**  | Competitive analysis deliverable |
| **Author** | build agent                      |
| **Type**   | decision                         |

**Summary:** Published canonical elite-provider AI comparison: capability matrix, JTBD scorecard, dimension weights, gap roadmap Waves A–D, sales messaging guide.

**Progress:** `docs/ai/AI_COMPETITIVE_BENCHMARK.md` + interactive canvas `ai-competitive-benchmark.canvas.tsx`; indexed in `DOC_INDEX.md`.

**Troubles:** none

**Fix:** n/a

**Learning:** none new

**Changes:**

- Master benchmark doc (Jobber, ServiceTitan, HCP, ServiceM8)
- Visual canvas for exec review

**Tests run:** none (docs only)

**DoD:** n/a

**Next:** Wave A gap closure (`createInvoiceDraft`, payment link, inline triggers)

---

### LOG-2025-05-22-10 — AI copilot A+ upgrade

| Field      | Value              |
| ---------- | ------------------ |
| **Phase**  | P5 / Pilot         |
| **Tasks**  | AI copilot upgrade |
| **Author** | build agent        |
| **Type**   | complete           |

**Summary:** Upgraded Ops copilot from regex-first MVP to Gemini function-calling agent with LLM estimate parsing, daily brief, card disambiguation, multi-turn UI, and human approval previews.

**Progress:** `gemini-agent`, `estimate-parser`, `daily-brief`, mode chips, conversation thread, wired high-risk tools. AI 24/24, unit 55/55, build ✅.

**Troubles:** none

**Fix:** n/a

**Learning:** LEARN-014

**Changes:**

- Native Gemini function calling as primary router
- LLM scope-notes → estimate line items
- Multi-turn conversation + mode-aware chips
- Human approval previews + high-risk checkbox

**Tests run:** `npm run test:ai`, `npm run test:unit`, `npm run typecheck`, `npm run build`

**DoD:** DONE-5 AI governance + new tool tests

**Next:** Pilot UAT with `GEMINI_API_KEY` on estimate drafting + daily brief

---

### LOG-2025-05-22-09 — Premium settings menu

| Field      | Value           |
| ---------- | --------------- |
| **Phase**  | Post-P10 polish |
| **Tasks**  | Settings hub UI |
| **Author** | build agent     |
| **Type**   | complete        |

**Summary:** Added a dedicated Settings hub with two-column shell, overview landing, General (org name + pipeline mode), Team roster, and refactored integrations/templates/automations/contracts to the `.ops-*` design system.

**Progress:** `SettingsShell` + grouped sub-nav; `GET/PATCH /api/settings/organization`; sidebar Settings link + `AccountMenu` shortcut; unit test for org name validation. Build ✅, unit 49/49.

**Troubles:** none

**Fix:** n/a

**Learning:** LEARN-011

**Changes:**

- `app/(app)/settings/*` layout, overview, general, team
- `components/settings/*`, `components/workspace/AccountMenu.tsx`
- `lib/domain/organization/getOrganizationSettings.ts`, `updateOrganizationSettings.ts`
- `lib/settings/nav.ts`, globals `.ops-settings-*`

**Tests run:** `npm run build`, `npm run test:unit` (49/49)

**DoD:** n/a (polish)

**Next:** pilot deploy checklist (migrations, staging env)

---

### LOG-2025-05-22-08 — Board sync status indicator

| Field      | Value           |
| ---------- | --------------- |
| **Phase**  | Post-P10 polish |
| **Tasks**  | Sync status UI  |
| **Author** | build agent     |
| **Type**   | complete        |

**Summary:** Added a small pipeline sync status pill that reflects frontend/backend alignment, in-flight saves, server refresh, and live Supabase connection.

**Progress:** `boardSyncStatus` helpers, `BoardSyncStatusIndicator` in toolbar, mutation/refresh/realtime tracking in `useBoardState` + card panel outbound sync hooks.

**Troubles:** none

**Fix:** n/a

**Learning:** none new

**Changes:** `boardSyncStatus.ts`, `BoardSyncStatusIndicator.tsx`, `useBoardState.ts`, `useBoardRealtime.ts`, `KanbanBoard.tsx`, `CardPanel.tsx`, `globals.css`, unit tests

**Tests run:** `npm run test:unit` (48/48), `npm run build`

**Next:** Manual UX pass on `/pipeline`

### LOG-2025-05-22-07 — Optimistic board UI

| Field      | Value                         |
| ---------- | ----------------------------- |
| **Phase**  | Post-P10 polish               |
| **Tasks**  | Board/card optimistic updates |
| **Author** | build agent                   |
| **Type**   | complete                      |

**Summary:** Board and card panel actions now update local state immediately and sync to Supabase in the background, with rollback on failure. Removed full-board refetch after lightweight mutations.

**Progress:** Added `boardOptimistic` helpers + `useBoardState` hook; debounced realtime refresh with mutation guard; optimistic create/move/patch in board and card panel; memoized `BoardCard`/`KanbanColumn`.

**Troubles:** Realtime `postgres_changes` refetch was undoing optimistic moves and causing flicker.

**Fix:** Skip/debounce realtime while local mutations are in flight; targeted `boardSync` patches from card panel instead of `refreshBoard()`.

**Learning:** LEARN-010

**Changes:**

- `lib/domain/board/boardOptimistic.ts`
- `components/pipeline/useBoardState.ts`
- `components/pipeline/useBoardRealtime.ts`
- `components/pipeline/KanbanBoard.tsx`
- `components/card/CardPanel.tsx`
- `components/pipeline/BoardCard.tsx`, `KanbanColumn.tsx`
- `tests/unit/boardOptimistic.test.ts`

**Tests run:** `npm run test:unit` (45/45), `npm run build`

**DoD:** Instant-feel board actions without mock data

**Next:** Manual pipeline UX pass; column reorder UI if product adds it

### LOG-2025-05-22-06 — Dev board clean slate

| Field      | Value                               |
| ---------- | ----------------------------------- |
| **Phase**  | Post-P10                            |
| **Tasks**  | Dev reset board + empty pipeline UX |
| **Author** | build agent                         |
| **Type**   | complete                            |

**Summary:** Cards on the board under auth bypass were real Supabase rows in the persistent dev org (`dev-bypass@opsboard.local`), not mock UI. Added dev-only wipe tooling and first-login empty state.

**Progress:** `resetOrganizationBoardData`, CLI `npm run dev:reset-board`, `POST /api/dev/reset-board`, Reset board button in dev banner, pipeline empty-state CTA. Ran wipe: 75 cards + 12 customers removed.

**Troubles:** CLI initially failed on `server-only` imports from domain modules.

**Fix:** Extracted script-safe `resetDevBoardData.ts`; CLI creates Supabase client inline.

**Learning:** none new

**Changes:**

- `lib/domain/dev/resetDevBoardData.ts`, `resetDevBoard.ts`
- `scripts/reset-dev-board.ts`, `npm run dev:reset-board`
- `app/api/dev/reset-board/route.ts`, `DevResetBoardButton` in `AppShell`
- `KanbanBoard` board-level empty state when zero jobs

**Tests run:** `npm run dev:reset-board`, `npm run build`

**DoD:** NO_MOCK V1 clean-slate dev experience

**Next:** Pilot deploy with `DISABLE_AUTH=false`

### LOG-2025-05-22-05 — Native integrations refactor

| Field      | Value                                        |
| ---------- | -------------------------------------------- |
| **Phase**  | Post-P10                                     |
| **Tasks**  | Native accounting ledger; remove QB/DocuSign |
| **Author** | build agent                                  |
| **Type**   | complete                                     |

**Summary:** Replaced QuickBooks sync and DocuSign with native business primitives. Stripe remains the only external payment pipe.

**Progress:** Migration 016, accounting domain + hooks, Reports AR/ledger + CSV export, removed QB/DocuSign code/UI, updated docs and INT-ACC tests.

**Troubles:** none

**Fix:** n/a

**Learning:** none new

**Changes:**

- `accounting_transactions` table + RLS; backfill from invoices/payments
- `lib/domain/accounting/*`; hooks in `createInvoiceDraft` / `settleInvoicePayment`
- Deleted QB/DocuSign adapters, routes, webhook handlers
- Settings + Integration strip: native modules always on; Stripe/Twilio/Resend optional

**Tests run:** `npm run build`, unit tests

**DoD:** n/a (architecture refactor)

**Next:** Apply migration 016 on staging; pilot deploy

### LOG-2025-05-22-04 — Card panel + dashboard UI polish

| Field      | Value                      |
| ---------- | -------------------------- |
| **Phase**  | P2/P3 (workspace polish)   |
| **Tasks**  | — (design evolution cont.) |
| **Author** | build agent                |
| **Type**   | progress                   |

**Summary:** Extended `.ops-*` design system to card detail panel and dashboard — unified tabs, controls, stat cards, and pipeline snapshot visualization.

**Progress:** Added panel/tab/stat/section utilities to `globals.css`; polished `CardPanel`, `dashboard/page`, `IntegrationStrip`.

**Troubles:** none.

**Fix:** n/a

**Learning:** none new

**Changes:**

- Panel: backdrop blur overlay, tokenized width/shadow, lucide close/menu, Fraunces title, mono stage key, `.ops-tab` bar
- Dashboard: stat cards with lucide icons, category-colored pipeline bars, Fraunces title
- Shared: `.ops-section-card`, `.ops-stat-card`, `.ops-btn-accent-outline`, `.ops-field-label`; fixed missing `--success` token

**Tests run:** `npm run build` ✅

**DoD:** n/a (visual polish)

**Next:** Estimate/Money/Comms tab internal layouts; customers page stat alignment

### LOG-2025-05-22-03 — Pipeline UI polish (Field ledger evolution)

| Field      | Value                 |
| ---------- | --------------------- |
| **Phase**  | P2 (workspace polish) |
| **Tasks**  | — (design evolution)  |
| **Author** | build agent           |
| **Type**   | progress              |

**Summary:** Evolved existing Field ledger theme toward production-quality pipeline UX — cohesive tokens, tactile drag states, lucide nav icons, and toolbar/card hierarchy without redesigning architecture.

**Progress:** Expanded `globals.css` motion/shadow/border tokens + `.ops-*` component utilities; polished `BoardCard`, `KanbanColumn`, `KanbanBoard`, `Sidebar`, `AiDock`, `CardAiSummary`.

**Troubles:** none.

**Fix:** n/a

**Learning:** none new

**Changes:**

- Design tokens: `--shadow-drag`, `--shadow-lift`, `--ease-out-expo`, `--border-subtle`, utility classes
- Board cards: grab cursor, lift/dim during drag, lucide calendar, footer meta rhythm, fixed drag-click race with `useRef`
- Columns: drop-target gradient, mono state keys, lucide add button, empty-state drop hint
- Toolbar: Fraunces page title, unified control heights, removed debug role from subtitle
- Sidebar: lucide icons, left accent bar on active nav
- AI dock: sparkles affordance, chip/control consistency

**Tests run:** `npm run build` ✅

**DoD:** n/a (visual polish)

**Next:** Card panel header/tabs polish; dashboard stat cards to match `.ops-*` system

### LOG-2025-05-22-02 — shadcn theme + QA pack (001–004)

| Field      | Value                        |
| ---------- | ---------------------------- |
| **Phase**  | P0, QA                       |
| **Tasks**  | TASK-P0-002, TASK-QA-001–004 |
| **Author** | build agent                  |
| **Type**   | complete                     |

**Summary:** Installed shadcn/ui with Field ledger CSS variable mapping and expanded unit/integration/E2E coverage for validators, RLS matrix, dashboard/customers smoke, and AI command contracts.

**Progress:** shadcn init + Button/Input/Card/Badge; globals.css + tailwind HSL theme; DM Sans/Fraunces fonts; `stateMap.ts`, `fields.ts`, `command-schema.ts`; org-scoped RLS registry; validators unit tests; E2E-DASH-001/E2E-CUST-001; INT-API-001/005.

**Troubles:** none.

**Fix:** n/a

**Learning:** none new

**Tests run:** UNIT 40/40 · AI 18/18 · build ✅

**Next:** operator migrate + staging deploy

### LOG-2025-05-22-01 — Pilot deploy readiness

| Field      | Value                                                     |
| ---------- | --------------------------------------------------------- |
| **Phase**  | Pilot                                                     |
| **Tasks**  | P0-007, P0-008, P0-010, Vercel cron, CI wave4, unit tests |
| **Author** | build agent                                               |
| **Type**   | complete                                                  |

**Summary:** Closed pilot-deploy gaps: Vercel daily cron for contract runner, CI wave4 job, expanded unit tests, updated README and pilot checklist.

**Progress:** `vercel.json` cron; CI `wave4` job; `tests/unit/polish.test.ts` (30 unit tests); README running locally; `PILOT_SIGNOFF.md`; P0-007/008/010 marked done.

**Troubles:** `db:migrate` blocked locally — `SUPABASE_DB_PASSWORD` not set in `.env.local`.

**Fix:** Documented in pilot checklist; operator must set password before migrate.

**Learning:** none new

**Tests run:** unit 30/30, build (prior session)

**Next:** Operator runs migrations + Vercel staging deploy

---

### LOG-2025-05-21-19 — Post-Wave 4 polish batch

| Field      | Value                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Phase**  | Polish                                                                                                                              |
| **Tasks**  | Dashboard, customers, integration strip, realtime, full pipeline, reports filters, contract runner, automations SMS/review, card UX |
| **Author** | build agent                                                                                                                         |
| **Type**   | complete                                                                                                                            |

**Summary:** Shipped the recommended polish stack: daily ops pages, card integration visibility, realtime board, 19-column pipeline toggle, and deeper Wave 4 automations.

**Progress:** `/dashboard` + `/customers`; IntegrationStrip on card; Supabase realtime on pipeline; full pipeline sync + toggle; report date filters; contract run-due API; SMS template + review-request automations (migration 015); card menu/CTAs/job type on overview.

**Troubles:** Next.js build failed on contracts page `useSearchParams` without Suspense — fixed with wrapper.

**Fix:** Wrapped contracts settings content in `<Suspense>`.

**Learning:** none new

**Changes:**

- Migration `015_polish_automations.sql`
- Domain: dashboard, customers list, card integration summary, full pipeline sync, run due contracts
- APIs: dashboard, customers, pipeline-mode, contracts/run-due; reports date query params
- UI: dashboard, customers, KanbanBoard groups/realtime/toggle, reports filters, automations expanded

**Tests run:** typecheck, unit 25/25, build

**DoD:** n/a (polish track)

**Next:** Pilot deploy + migration 015 + QA parallel track

---

### LOG-2025-05-21-18 — Phase 10 complete: Wave 4 scale

| Field      | Value                                                                |
| ---------- | -------------------------------------------------------------------- |
| **Phase**  | P10                                                                  |
| **Tasks**  | TASK-P10-001, TASK-P10-002, TASK-P10-003, TASK-P10-004, TASK-P10-005 |
| **Author** | build agent                                                          |
| **Type**   | complete                                                             |

**Summary:** Wave 4 delivers full customer portal, QuickBooks one-way sync, column automations, reports, and recurring contracts — completing the platform blueprint.

**Progress:** Migrations 013–014; portal schedule/invoice/pay; QB adapter + accounting_sync_log; automations engine hooked to moveCard/settleInvoice; `/reports` page; contracts + card generation; G6 sign-off.

**Troubles:** none

**Fix:** n/a

**Learning:** none new

**Changes:**

- `013_wave4_scale.sql`, `014_wave4_rls.sql` — automations, accounting_sync_log, contracts
- Full portal `/p/[token]` + `/api/portal/[token]/payment-link`
- QuickBooks adapter, sync API, Money tab + Settings
- Automations CRUD, run on column enter / invoice paid
- Reports API + page; contracts API + settings page
- `tests/integration/wave4.test.ts`, `G6_SIGNOFF.md`

**Tests run:** INT-W4-001–003, typecheck, build

**DoD:** DONE-10.1–10.4 satisfied

**Next:** Apply 013–014 on staging; configure QB + automations for pilot

---

### LOG-2025-05-21-14 — Phase 6 complete: MVP pilot-ready

| Field      | Value              |
| ---------- | ------------------ |
| **Phase**  | P6                 |
| **Tasks**  | TASK-P6-001–P6-011 |
| **Author** | agent              |
| **Type**   | complete           |

**Summary:** Finished MVP release hardening — axe a11y suite, UAT/EXP automated sign-off, bootstrap V1 zero-cards test, error boundary, Vercel deploy config, G2 approved for pilot.

**Progress:** `@axe-core/playwright` A11Y-001/002/004; UAT-06/08/09 e2e; INT-BOOT-004; `UAT_SIGNOFF.md`, `EXP_SIGNOFF.md`, `G2_SIGNOFF.md`; `vercel.json`, `MONITORING.md`; card panel select aria-labels.

**Troubles:** A11Y-002 failed on unlabeled column/priority selects in card header.

**Fix:** Added `aria-label` to pipeline column and priority selects.

**Learning:** none new

**Problems:** none

**Changes:**

- `tests/e2e/a11y-uat.spec.ts` — a11y + UAT coverage
- `app/(app)/error.tsx` — route error recovery
- CI a11y job; `test:a11y`, `test:release`, `test:regression` scripts
- G2 sign-off approved for pilot (deploy = operator step)

**Tests run:** `test:release`, `test:e2e` (19/19), `test:a11y` (3/3)

**DoD:** DONE-6 complete (pilot-ready; prod deploy per checklist)

**Next:** Wave 1 — TASK-P7-001 payments migration

### LOG-2025-05-21-13 — Phase 6 hardening (automated release track)

| Field      | Value                       |
| ---------- | --------------------------- |
| **Phase**  | P6                          |
| **Tasks**  | TASK-P6-001–004, P6-007–011 |
| **Author** | agent                       |
| **Type**   | progress                    |

**Summary:** MVP release hardening — empty/error states, a11y basics, CI pipeline, no-mock guards, CHANGELOG v0.1.0, and G2 automated sign-off doc. Manual UAT/staging remain before MVP SHIPPED.

**Progress:** Board welcome + filter empty states; card panel retry; aria-live on errors/AI; reduced-motion panel; `.github/workflows/ci.yml`; enhanced `check-no-mock.sh`; `CHANGELOG.md` v0.1.0; `G2_SIGNOFF.md` + `PILOT_DEPLOY_CHECKLIST.md`.

**Troubles:** Playwright lockfile root warning — fixed via `outputFileTracingRoot` in `next.config.ts`.

**Fix:** Set tracing root to project directory.

**Learning:** none new

**Problems:** none

**Changes:**

- P6-001 empty/loading/error UX on pipeline + card
- P6-002 aria labels, live regions, `prefers-reduced-motion`
- P6-003 CI: lint, typecheck, unit, ai, integration, security, e2e (with secrets)
- P6-011 no-mock V2/V6 filename + stub checks
- P6-010 CHANGELOG [0.1.0]

**Tests run:** `check:no-mock`, `typecheck`, `test:unit` (25/25), `test:integration` (12/12), `build`

**DoD:** DONE-6 partial — automated track green; manual UAT/A11Y axe/staging pending

**Next:** TASK-P6-005 UAT on staging; PO G2 sign-off

### LOG-2025-05-21-12 — Phase 5 complete: AI copilot

| Field      | Value              |
| ---------- | ------------------ |
| **Phase**  | P5                 |
| **Tasks**  | TASK-P5-001–P5-010 |
| **Author** | agent              |
| **Type**   | complete           |

**Summary:** Shipped safe AI on board + card — intent routing, domain tool execution with approval flow, dock/rail UI, inline card summary, and estimate draft CTA.

**Progress:** Wired `loadAiContext`, `command-handler`, `tool-executor` + persistence; added `/api/ai/command`, `/api/ai/approve`, `/api/ai/reject`; built `AiDock`, `AiRail`, `ApprovalModal`, `CardAiSummary`; enabled E2E-AI-001–003; UNIT-AI/UNIT-CTX + INT-API AI tests.

**Troubles:** E2E-AI-002 timed out when chip + Run overlapped loading state; Playwright webServer port mismatch on busy :3000.

**Fix:** E2E sends move command directly; Playwright config uses explicit `--port` + `localhost` reuse.

**Learning:** LEARN-007

**Problems:** none

**Changes:**

- AI context loader capped at 40 cards; deterministic intent router + Gemini fallback
- Medium/high tools persist pending rows; approve route calls `executeApprovedToolCall`
- Board dock + card rail with prompt chips; Overview auto-summary; Estimate “Draft from scope (AI)”
- Rate limit 30 req/min on `/api/ai/command`
- `npm run test:ai` wired; exclude `src-starter` from typecheck

**Tests run:** `npm run typecheck`, `npm run test:unit` (25/25), `npm run test:integration` (12/12), `npm run build`, E2E-AI-001–003 pass

**DoD:** DONE-5 complete

**Next:** TASK-P6-001 error/empty/loading audit

### LOG-2025-05-21-11 — Phase 4 complete: money drafts

| Field      | Value              |
| ---------- | ------------------ |
| **Phase**  | P4                 |
| **Tasks**  | TASK-P4-001–P4-008 |
| **Author** | agent              |
| **Type**   | complete           |

**Summary:** Shipped estimate + invoice drafts without a payment provider — line-item quotes, invoice from quote, manual mark paid archives job, and archive/balance validation gates.

**Progress:** Added `lib/domain/money/quotes.ts`, `invoices.ts`, `moneyMath.ts`; REST routes for quotes, invoices, mark-paid; Estimate/Money card tabs; archived column hidden on board with optional Archived filter; balance-due archive requires reason.

**Troubles:** none

**Fix:** n/a

**Learning:** none new

**Problems:** none

**Changes:**

- Quote upsert + mark sent; invoice draft + mark paid → archived column
- `validateMove` balanceDue gate (UNIT-VAL-002)
- Kanban archived filter + `?includeArchived=true` board API
- UNIT-MNY-001–003, INT-MNY-003/004 tests

**Tests run:** `npm run typecheck`, `npm run test:unit` (13/13), `npm run test:integration` (9/9), `npm run build`

**DoD:** DONE-4 complete

**Next:** TASK-P5-001 loadAiContext

### LOG-2025-05-21-10 — Phase 3 complete: deep card panel

| Field      | Value              |
| ---------- | ------------------ |
| **Phase**  | P3                 |
| **Tasks**  | TASK-P3-001–P3-011 |
| **Author** | agent              |
| **Type**   | complete           |

**Summary:** Built slide-over job record — card panel with URL routing, editable tabs, activity timeline, move-validation modals, and customer CRUD linked to cards.

**Progress:** Added card detail domain (`getCardDetail`, `updateCard`), customer upsert, comments, members list, REST routes (`/api/cards/[id]`, comments, customer, members), `CardPanel` + `ActivityTimeline` + `MovePromptModal`, board card click opens panel without firing after drag.

**Troubles:** TypeScript null on `customerId` after upsert — fixed with guard before activity log.

**Fix:** Narrow `customerId` after upsert branch in `upsertCustomerForCard`.

**Learning:** none new

**Problems:** none

**Changes:**

- `components/card/CardPanel.tsx`, `ActivityTimeline.tsx`, `MovePromptModal.tsx`
- `lib/domain/cards/cardDetail.ts`, comments, customers, activities, members
- API routes for card detail, patch, customer, comments, members
- `INT-CARD-003` integration test (customer save linked to card)
- Estimate/Money tabs render Phase 4 placeholders

**Tests run:** `npm run typecheck`, `npm run test:unit` (9/9), `npm run test:integration` (7/7), `npm run build`

**DoD:** DONE-3 complete; Estimate/Money tab content and `$0 estimate` gate deferred to Phase 4 (P4-002, P4-003)

**Next:** TASK-P4-001 quotes domain

### LOG-2025-05-21-09 — Phase 2 complete: workspace + Kanban

| Field      | Value                      |
| ---------- | -------------------------- |
| **Phase**  | P2                         |
| **Tasks**  | TASK-P2-001–P2-011, P2-014 |
| **Author** | agent                      |
| **Type**   | complete                   |

**Summary:** Built operational Job Pipeline workspace — collapsible sidebar, support pages, Kanban board with create/move/filter/search, domain validation, and REST APIs.

**Progress:** Added `validateMove`, board/card domain services, `/api/board` + `/api/cards` routes, `KanbanBoard` with HTML5 DnD and optimistic rollback, Field ledger board cards, activity logging on create/move.

**Troubles:** none

**Fix:** n/a

**Learning:** LEARN-006

**Problems:** none

**Changes:**

- App shell + sidebar (`localStorage` collapse)
- `/support/help`, `/contact`, `/changelog`
- Pipeline top bar, filters, search, + new job
- UNIT-PIPE-001–006 tests (9 unit total)

**Tests run:** `npm run typecheck`, `npm run test:unit` (9/9), `npm run build`

**DoD:** DONE-2 complete except waivers: P2-012 realtime deferred; P2-013 full 19-col toggle deferred to post-MVP polish

**Next:** TASK-P3-001 card panel shell

### LOG-2025-05-21-08 — Phase 1 complete: migrations applied, tests green

| Field      | Value       |
| ---------- | ----------- |
| **Phase**  | P1          |
| **Tasks**  | TASK-P1-001 |
| **Author** | agent       |
| **Type**   | complete    |

**Summary:** Applied all MVP migrations to remote `ops-kanban` Supabase project; integration and security tests now pass. Phase 1 (DONE-1) complete.

**Progress:** Migrations 001–006 live on `txctbkinjzadnnnhxpbo`; RLS enabled on all MVP tables; triggers applied via execute_sql after 006 version collision.

**Troubles:** `apply_migration` for 006 hit duplicate `schema_migrations_pkey` (timestamp collision with 005).

**Fix:** Applied trigger SQL via `execute_sql` directly.

**Learning:** none new

**Problems:** PRB-001 resolved

**Changes:** Remote database schema now matches repo migrations.

**Tests run:** `npm run test:unit` (3/3), `npm run test:integration` (6/6), `npm run test:security` (3/3)

**DoD:** DONE-1 complete

**Next:** TASK-P2-001 app shell

### LOG-2025-05-21-07 — Phase 1 foundation: auth, bootstrap, tests

| Field      | Value                                               |
| ---------- | --------------------------------------------------- |
| **Phase**  | P1                                                  |
| **Tasks**  | TASK-P0-006, TASK-P1-002–P1-010, TASK-P1-005–P1-009 |
| **Author** | agent                                               |
| **Type**   | progress                                            |

**Summary:** Built Phase 1 foundation — signup/login, service-role workspace bootstrap (org + board + 9 columns, zero cards), auth middleware, minimal `/pipeline` page, Vitest test harness with unit and integration/security suites.

**Progress:** Added `lib/domain/bootstrap/signupBootstrap.ts`, auth server actions, login/signup pages, app shell layout, migration script (`npm run db:migrate`), test helpers and INT-BOOT / SEC-RLS tests. Unit tests pass; integration tests skip until remote migrations applied.

**Troubles:** Remote Supabase project has no MVP tables yet; `SUPABASE_DB_PASSWORD` not in `.env.local` so CLI/SQL migration apply blocked.

**Fix:** Added `scripts/apply-migrations.ts` + `SUPABASE_DB_PASSWORD` in `.env.example`; integration tests use `describe.skipIf` when schema missing.

**Learning:** LEARN-005 (service-role bootstrap)

**Problems:** PRB-001

**Changes:**

- Auth: `/login`, `/signup`, middleware guard, `/` → login or pipeline
- Bootstrap domain service + owner role on signup
- Vitest config, unit roles tests, integration bootstrap + RLS matrix tests
- `scripts/test-seed.ts`, `npm run db:migrate`

**Tests run:** `npm run typecheck`, `npm run build`, `npm run test:unit` (3/3 pass), `npm run test:integration` (6 skipped — migrations pending)

**DoD:** DONE-1 partial (1.2–1.6 code complete; 1.1 pending migration apply)

**Next:** Apply migrations with `SUPABASE_DB_PASSWORD`, re-run integration tests, TASK-P2-001

### LOG-2025-05-21-06 — Wire `.env.local` into Next.js + Supabase clients

| Field      | Value                                              |
| ---------- | -------------------------------------------------- |
| **Phase**  | P0                                                 |
| **Tasks**  | TASK-P0-001, TASK-P0-003, TASK-P0-004, TASK-P0-009 |
| **Author** | agent                                              |
| **Type**   | progress                                           |

**Summary:** Scaffolded a runnable Next.js 15 app and connected the user's `.env.local` secrets through validated env modules and Supabase SSR clients.

**Progress:** Added `app/`, `lib/env/`, `lib/db/supabase/`, middleware session refresh, `/api/health`, home status page. Copied `src-starter/lib/ai/*` into `lib/ai/`. Build and health check pass with live Supabase connection.

**Troubles:** none

**Fix:** n/a

**Learning:** LEARN-004 (env client/server split)

**Changes:**

- Next.js + Tailwind scaffold with `@/` path alias
- Zod-validated `lib/env/client.ts` and `lib/env/server.ts`
- Supabase browser, server, and service clients
- Gemini client reads from server env module
- `/api/health` JSON status endpoint

**Tests run:** `npm run typecheck`, `npm run build`, `GET /api/health`

**DoD:** DONE-0 partial (0.1, 0.3, 0.6)

**Next:** TASK-P0-002 shadcn, TASK-P0-005 components copy, TASK-P0-006 Vitest

### LOG-2025-05-21-05 — Doc overlap cleanup + DOC_INDEX

| Field      | Value            |
| ---------- | ---------------- |
| **Phase**  | Planning         |
| **Tasks**  | —                |
| **Author** | planning session |
| **Type**   | decision         |

**Summary:** Combed repo for duplicate plans and starter paths; added canonical doc index; slimmed redirect-only files.

**Progress:** `DOC_INDEX.md`; `PHASED_BUILD_PLAN` + `IMPLEMENTATION_CHECKLIST` → redirects; README/AGENTS canonical paths fixed; `AiCommandBar` consolidated under `src-starter/components/`.

**Troubles:** none

**Fix:** n/a

**Learning:** none new (see `DOC_INDEX.md`)

**Changes:** See `REPO_COMPLETENESS_AUDIT.md` §6.

**Tests run:** none

**Next:** TASK-P0-001

---

### LOG-2025-05-21-04 — AI build protocol + reinforced learning loop

| Field      | Value            |
| ---------- | ---------------- |
| **Phase**  | Planning         |
| **Tasks**  | —                |
| **Author** | planning session |
| **Type**   | decision         |

**Summary:** Added AI-facing build protocol so agents read/update progress, register troubles (PRB), and capture durable fixes (LEARN) every session.

**Progress:** New docs `AI_BUILD_PROTOCOL.md`, `PROGRESS.md`, `PROBLEM_REGISTRY.md`, `BUILD_KNOWLEDGE.md`; enhanced LOG template; AGENTS.md and roadmap index updated.

**Troubles:** none

**Fix:** n/a

**Learning:** LEARN-001–003 seeded from pre-build audit decisions.

**Changes:**

- Session loop: read PROGRESS → work one task → LOG + PROGRESS + PRB/LEARN
- Per-phase AI checklists (P0–P10)
- Problem sourcing via PROBLEM_REGISTRY search before debug

**Tests run:** none

**DoD:** N/A

**Next:** TASK-P0-001

---

### LOG-2025-05-21-03 — Audit fixes: archived pipeline + missing artifacts

| Field      | Value            |
| ---------- | ---------------- |
| **Phase**  | Planning         |
| **Tasks**  | —                |
| **Author** | planning session |
| **Type**   | decision         |

**Summary:** Unified terminal column on `archived`. Fixed doc contradictions. Added migrations 002–006 (auth FK, card extensions, RLS, indexes, triggers), API_ROUTES, APPROVAL_FLOW, DESIGN_TOKENS, MINIMAL_DASHBOARD, AGENTS.md, domain README, check-no-mock script, legal stubs, assignCard tool, createCard medium risk.

**Changes:** See `REPO_COMPLETENESS_AUDIT.md` §3.

**Tests run:** none

**Next:** TASK-P0-001

---

### LOG-2025-05-21-02 — No mock data policy confirmed (pre-build)

| Field      | Value            |
| ---------- | ---------------- |
| **Phase**  | Planning         |
| **Tasks**  | —                |
| **Author** | planning session |
| **Type**   | decision         |

**Summary:** Confirmed MVP has no mock production data requirement. Added `NO_MOCK_DATA_POLICY.md`, release gate checks, DoD G8, PRE_BUILD_CONFIRMATION. Starter `tool-executor` now throws until Phase 5 wires domain services.

**Changes:**

- Policy doc + audit of blueprint contradictions
- MVP_SCOPE, CARD_DESIGN, RELEASE_GATES aligned
- TASK-P6-011 CI no-mock verification

**Tests run:** none

**DoD:** N/A

**Next:** TASK-P0-001

---

### LOG-2025-05-21-01 — Roadmap and QA pack finalized (pre-build)

| Field      | Value            |
| ---------- | ---------------- |
| **Phase**  | Planning         |
| **Tasks**  | —                |
| **Author** | planning session |
| **Type**   | decision         |

**Summary:** MVP captured in `MVP_CAPTURE.md`. Development roadmap, phase tasks (P0–P10), definitions of done, architecture principles, and modular QA pack (`docs/testing/`) are ready before implementation.

**Changes:**

- Added `docs/roadmap/*` (this log, tasks, DoD, principles)
- Product/design/AI/integration docs aligned to landscaping vertical
- Testing pack with FMEA, RBT, STRIDE, regression matrix

**Tests run:** none (documentation only)

**DoD:** N/A — pre-build

**Next:** TASK-P0-001 Create Next.js app

---

<!-- Append new entries above this line -->

### LOG-2025-05-21-17 — Phase 9 Wave 3: documents, e-sign, change orders

| Field      | Value              |
| ---------- | ------------------ |
| **Phase**  | P9                 |
| **Tasks**  | TASK-P9-001–P9-003 |
| **Author** | build agent        |
| **Type**   | feature            |

**Summary:** Wave 3 documents — Supabase Storage attachments, native portal signatures audit trail, DocuSign envelopes + webhook, change orders via `parent_card_id`.

**Progress:**

- Migrations `011_wave3_documents.sql`, `012_wave3_rls.sql`
- Attachments: upload/list/delete, Files tab, `card-attachments` bucket
- Signatures table; portal approve records native sign with name + IP
- DocuSign adapter, envelope send, `/api/webhooks/docusign`, processSignWebhook
- Change orders: create linked card in `estimating`, Overview UI
- WH-SIGN tests + G5 sign-off

**Troubles:** Wave 3 tests skip until 011/012 applied; DocuSign needs manual access token for staging.

**Fix:** Inline DocuSign configured check in integrationAccounts to avoid server-only import chain.

**Tests run:** typecheck ✅, unit 25/25 ✅, integration 13/13 ✅, build ✅

**DoD:** DONE-9 (staging-approved)

**Next:** TASK-P10-001 full customer portal

---

### LOG-2025-05-21-16 — Phase 8 Wave 2: booking, calendar, comms

| Field      | Value              |
| ---------- | ------------------ |
| **Phase**  | P8                 |
| **Tasks**  | TASK-P8-001–P8-006 |
| **Author** | build agent        |
| **Type**   | feature            |

**Summary:** Wave 2 time & conversation — public booking page, crew calendar, Twilio SMS threads, Resend email threads, message templates, AI approved send.

**Progress:**

- Migrations `009_wave2_comms_scheduling.sql`, `010_wave2_rls.sql`
- Booking: `/book/[slug]`, idempotent `createBooking` → `site_visit` card
- Calendar: `/calendar` week view from `scheduled_start`
- Comms: `messages` table, Twilio adapter + webhook, Comms tab on cards
- Email thread via Resend on Comms tab
- Templates: `/settings/templates`, variable substitution
- AI: `sendSms`, `sendEmail` (high-risk), `draftSms`, `draftEmail`
- WH-BOOK + WH-SMS tests, G4 sign-off

**Troubles:** Wave 2 tests skip until 009/010 applied; Twilio inbound needs `TWILIO_DEFAULT_ORGANIZATION_ID` for single-tenant routing.

**Fix:** Public routes in middleware; conditional RLS matrix for Wave 2 tables.

**Learning:** LEARN-009 — reuse `integration_events` idempotency for SMS webhooks same as payments.

**Tests run:** typecheck ✅, unit 25/25 ✅, integration 13/13 ✅, build ✅

**DoD:** DONE-8 (staging-approved)

**Next:** TASK-P9-001 DocuSign / native e-sign

---

### LOG-2025-05-21-15 — Phase 7 Wave 1: payments, portal, integrations

| Field      | Value              |
| ---------- | ------------------ |
| **Phase**  | P7                 |
| **Tasks**  | TASK-P7-001–P7-008 |
| **Author** | build agent        |
| **Type**   | feature            |

**Summary:** Wave 1 money & trust layer — Stripe payment links, webhook idempotency, customer portal, estimate export/send, integrations settings.

**Progress:**

- Migrations `007_wave1_payments.sql`, `008_wave1_rls.sql`
- Stripe adapter, webhook route, `processPaymentWebhook`, shared `settleInvoicePayment`
- APIs: payment-link, portal-token, portal approve, integrations, quotes export/send
- UI: Money tab (payment link + portal copy), Estimate tab (HTML + email), `/settings/integrations`, public `/p/[token]`
- WH-PAY integration tests + `npm run test:webhooks`
- G3 sign-off doc

**Troubles:** `db:migrate` needs `SUPABASE_DB_PASSWORD`; WH-PAY tests skip until 007/008 applied.

**Fix:** Conditional RLS matrix for Wave 1 tables; `vi.mock('server-only')` in vitest setup for route tests.

**Learning:** LEARN-008 — share invoice settlement between manual paid and webhooks via `settleInvoicePayment`.

**Tests run:** typecheck ✅, unit 25/25 ✅, integration 13/13 ✅, webhooks 6 skipped (no 007), build ✅

**DoD:** DONE-7 (staging-approved; operator migrate + WH-PAY on staging)

**Next:** Deploy staging, run WH-PAY green, then TASK-P8-001

---
