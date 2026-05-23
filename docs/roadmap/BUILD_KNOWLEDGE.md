# Build knowledge — reinforced learning for agents

Durable patterns discovered during build. **Search here before debugging.**

Format: **LEARN-NNN** — When / Problem / Solution / Verify / Refs

---

## Agent discipline

### LEARN-001 — Canonical pipeline terminal state

| | |
|-|-|
| **When** | Adding columns, move validation, or AI moveCard |
| **Problem** | `closed` vs `archived` drift breaks move rules and tests |
| **Solution** | Use `archived` only; compact 9-col ends at `archived`; see `DEFAULT_PIPELINE.md` |
| **Verify** | `rg "state_key.*closed" docs src` returns none |
| **Refs** | PRB-000, `landscaping-default-columns.ts` |

### LEARN-002 — No mock production data

| | |
|-|-|
| **When** | Seeding, demos, AI tools, onboarding |
| **Problem** | Sample cards look real; pilots lose trust |
| **Solution** | Signup inserts 0 cards; empty states only; `NO_MOCK_DATA_POLICY.md` |
| **Verify** | `npm run check:no-mock`; new signup → empty pipeline |
| **Refs** | `scripts/check-no-mock.sh` |

### LEARN-003 — AI executor must persist

| | |
|-|-|
| **When** | Wiring Phase 5 AI |
| **Problem** | Stub executor returns success without DB write |
| **Solution** | `executeToolCall` → `lib/domain/*` only; log `ai_tool_calls` + activities |
| **Verify** | `AI-LOG-001`; refresh page shows persisted change |
| **Refs** | `tool-executor.ts`, `APPROVAL_FLOW.md` |

---

## Tooling

### LEARN-004 — Env layout: client vs server secrets

| | |
|-|-|
| **When** | Wiring Supabase, Gemini, or any secret in Next.js |
| **Problem** | `NEXT_PUBLIC_*` leaks to browser; server keys read ad hoc without validation |
| **Solution** | `lib/env/client.ts` (public vars, Zod) + `lib/env/server.ts` (`server-only`, service role + Gemini). Supabase clients in `lib/db/supabase/{client,server,service}.ts` |
| **Verify** | `npm run build` loads `.env.local`; `GET /api/health` → `ok: true`, `supabase.connected: true` |
| **Refs** | `.env.example`, `middleware.ts` |

---

## Database & RLS

### LEARN-005 — Signup bootstrap uses service role once

| | |
|-|-|
| **When** | Phase 1 signup, org provisioning, integration tests |
| **Problem** | RLS blocks first org/member insert; user has no org yet |
| **Solution** | After `auth.signUp` + session, call `bootstrapWorkspace(createServiceClient(), …)` — profile, org, owner member, board, 9 columns; idempotent re-check via existing owner membership |
| **Verify** | `INT-BOOT-001`, `INT-BOOT-003`; signup → `/pipeline` shows 9 empty columns |
| **Refs** | `lib/domain/bootstrap/signupBootstrap.ts`, `SIGNUP_BOOTSTRAP.md` |

---

## Frontend

### LEARN-006 — Kanban optimistic move with rollback

| | |
|-|-|
| **When** | Drag/drop card between columns |
| **Problem** | Slow API makes board feel stuck; failed moves leave wrong column |
| **Solution** | Optimistic `columnId` update in client state → `POST /api/cards/:id/move` → revert prior board snapshot on error + surface message |
| **Verify** | Drag with network failure restores card; `card.moved` activity on success |
| **Refs** | `components/pipeline/KanbanBoard.tsx`, `lib/domain/cards/moveCard.ts` |

---

## AI

### LEARN-007 — Medium/high AI tools require server-side approval

| | |
|-|-|
| **When** | Phase 5 AI copilot write tools |
| **Problem** | LLM or intent router could trigger card moves, creates, or quote drafts without human review |
| **Solution** | `executeToolCall` inserts pending `ai_tool_calls` + approval row for medium/high risk; UI shows `ApprovalModal`; `/api/ai/approve` calls `executeApprovedToolCall` only after user confirms |
| **Verify** | E2E-AI-002, INT-API-003/004, AI-TOOL-002 |
| **Refs** | `lib/ai/tool-executor.ts`, `app/api/ai/approve/route.ts`, `components/ai/ApprovalModal.tsx` |

---

## AI / Gemini

<!-- LEARN-0xx tool calling, context size, approval -->

---

## Workspace / board UI

### LEARN-010 — Optimistic board state with guarded realtime

| | |
|-|-|
| **When** | Kanban drag, card create, card panel saves, or any board mutation |
| **Problem** | Waiting on API + full `refreshBoard()` after each action feels slow; Supabase realtime refetch fights optimistic UI and causes flicker |
| **Solution** | Update local `BoardView` immediately (`boardOptimistic` + `useBoardState`); sync via precise API calls; reconcile temp IDs on create; rollback snapshot on failure; debounce realtime and skip while `mutationCount > 0`; patch board from card panel via `boardSync` instead of full refetch |
| **Verify** | Drag card → instant column change; edit title in panel → board card updates without full reload; disconnect network → UI rolls back + alert |
| **Refs** | `lib/domain/board/boardOptimistic.ts`, `components/pipeline/useBoardState.ts`, `useBoardRealtime.ts` |

### LEARN-011 — Settings hub shell for multi-page config

| | |
|-|-|
| **When** | Adding or refactoring settings routes under `/settings/*` |
| **Problem** | Orphan settings links in Support nav and inconsistent page chrome feel amateur vs pipeline/dashboard |
| **Solution** | `app/(app)/settings/layout.tsx` wraps `SettingsShell` (sticky grouped sub-nav + mobile tab bar); shared `SettingsPageHeader` + `ops-page-shell`; nav config in `lib/settings/nav.ts`; org settings via `GET/PATCH /api/settings/organization` |
| **Verify** | Sidebar Settings + account menu → `/settings`; all sub-routes share sub-nav; General saves name/mode with role gate |
| **Refs** | `components/settings/SettingsShell.tsx`, `lib/settings/nav.ts`, `app/api/settings/organization/route.ts` |

---

## Testing

### LEARN-015 — Dev CSS 404 from poisoned `.next` cache

| | |
|-|-|
| **When** | UI suddenly unstyled; Create menu “missing”; E2E passes HTML but page looks broken |
| **Problem** | `npm run build` + `next dev` share `.next/`; prod `BUILD_ID` + dev HTML → `layout.css` 404; page returns 200 so failures look like “CSS bugs” |
| **Solution** | `npm run dev:clean` to kill :3000 and remove `.next`; `npm run check:css-health` before UI sign-off; Playwright uses `playwright-dev-server.mjs` + global CSS check |
| **Verify** | `npm run check:css-health` → OK; E2E `CSS-001 @smoke` green |
| **Refs** | `docs/testing/CSS_DEV_GUARDRAILS.md`, `scripts/check-css-health.mjs` |

<!-- LEARN-0xx flaky tests, fixtures -->

---

## Integrations (Wave 1+)

### LEARN-008 — Single settlement path for manual + webhook paid

| Field | Value |
|-------|-------|
| **Problem** | Duplicate logic for mark-paid vs Stripe webhook risks drift (archive, balance, activity) |
| **Solution** | `settleInvoicePayment` in `lib/domain/money/settleInvoice.ts`; manual `markInvoicePaid` and `processPaymentWebhook` both call it |
| **Verify** | INT-MNY-004, WH-PAY-002 |
| **Refs** | `lib/domain/money/settleInvoice.ts`, `lib/domain/integrations/processPaymentWebhook.ts` |

### LEARN-009 — Shared webhook idempotency for all providers

| Field | Value |
|-------|-------|
| **Problem** | SMS/payment webhooks could double-process without shared dedup |
| **Solution** | Reuse `getIntegrationEvent` / `insertIntegrationEvent` / `markIntegrationEvent` from payment processor for Twilio inbound |
| **Verify** | WH-SMS-001, WH-PAY-003 |
| **Refs** | `lib/domain/comms/processSmsWebhook.ts`, `lib/domain/integrations/processPaymentWebhook.ts` |

### LEARN-012 — Stage age via `column_entered_at`

| | |
|-|-|
| **When** | Showing days-in-column on board cards or computing stalled-job metrics |
| **Problem** | `updated_at` resets on any field edit — title patch makes stage age lie |
| **Solution** | Migration 017 adds `column_entered_at`; set only when `column_id` changes in `moveCard`/`reorderCard`; `computeDaysInColumn(column_entered_at)` in `boardCard.ts` and optimistic patches |
| **Verify** | Edit title → days unchanged; move column → counter resets; unit boardCardFormatters |
| **Refs** | `017_column_entered_at.sql`, `lib/domain/cards/moveCard.ts`, `lib/domain/board/boardOptimistic.ts` |

### LEARN-013 — Board card menu + scan signals pattern

| | |
|-|-|
| **When** | Extending board card scan density or adding quick actions without opening the panel |
| **Problem** | Monolithic card component mixes drag, click-open, menu, and signal layout; too many badges overflow the scan row |
| **Solution** | Split `BoardCardSurface` (layout/drag) from `board-card-primitives` (signals/footer) and `BoardCardMenu` (details/summary menu with `stopPropagation`); `CardSignalsRow` shows top 2 signals + `+N` overflow; menu actions call existing `onPatch`/`onMove`/`onArchive` hooks |
| **Verify** | Hover reveals ⋮; menu assign/move does not open panel; drag still works; >2 signals collapse to `+N` |
| **Refs** | `components/pipeline/BoardCard.tsx`, `BoardCardMenu.tsx`, `board-card-primitives.tsx` |

### LEARN-014 — Gemini function calling with regex fallback

| | |
|-|-|
| **When** | Extending AI copilot tools or debugging “AI doesn’t understand me” |
| **Problem** | Regex-only routing misses natural language; LLM-only skips governance tests |
| **Solution** | Primary: `runGeminiAgent` + `gemini-declarations.ts` (role-filtered). Fallback: `intent-router.ts` when `GEMINI_API_KEY` unset. Always validate with Zod + `executeToolCall`. |
| **Verify** | `npm run test:ai`; with key set, paraphrased commands select tools |
| **Refs** | `lib/ai/gemini-agent.ts`, `lib/ai/command-handler.ts` |

### LEARN-016 — Pipeline AI dock as flex sibling

| | |
|-|-|
| **When** | Adding persistent AI on the pipeline without stealing board scroll or overlapping the card panel |
| **Problem** | Fixed-position popovers fight z-index with toolbar/panel; expanded copilot hides columns |
| **Solution** | `AiCommandDock` is a shrink-0 flex sibling below `ops-pipeline-body`; collapsed height `--ai-dock-collapsed` (48px), expanded `--ai-dock-expanded` (220px); auto-collapse when card panel opens unless user expanded; sessionStorage preference |
| **Verify** | E2E-WORKSPACE-001/002; toolbar visible when dock expanded; card panel + dock coexist |
| **Refs** | `components/ai/AiCommandDock.tsx`, `app/globals.css`, `docs/product/UI_MASTER_FORMULA.md` |

### LEARN-017 — Single workspace shortcuts provider

| | |
|-|-|
| **When** | Global keyboard shortcuts across app shell + pipeline-specific handlers |
| **Problem** | Duplicate `keydown` listeners in KanbanBoard and Sidebar conflict; Esc order inconsistent |
| **Solution** | `WorkspaceShortcutsProvider` in `AppShell` owns one listener; pipeline registers handlers via `registerPipelineHandlers`; Esc stack: dock → card panel → modals → search clear |
| **Verify** | E2E-WORKSPACE-004/005; `?` opens modal; `/` focuses search on pipeline only |
| **Refs** | `components/workspace/WorkspaceShortcutsProvider.tsx`, `components/pipeline/PipelineSearchProvider.tsx` |

### LEARN-018 — Outbound sync queue (optimistic background save)

| | |
|-|-|
| **When** | Rapid board drags, panel edits, or money actions must feel instant without racing parallel fetches |
| **Problem** | Optimistic paint existed but each mutation `await fetch`; money flows called `loadCard()` and flashed the panel |
| **Solution** | Pure `OutboundSyncQueue` in domain (per-card FIFO, PATCH coalesce, retry); `useOutboundSync` enqueues API work; UI applies optimistic state then returns; sync pill shows `pending + queued`; rollback on 4xx |
| **Verify** | UNIT-SYNC-*; E2E-SYNC-002/003; rapid drag manual QA |
| **Refs** | `lib/domain/board/outboundSyncQueue.ts`, `components/pipeline/useOutboundSync.ts`, `useBoardState.ts` |

---

## Release

<!-- LEARN-0xx G2 gate, staging -->

---

## Promotion rule

If the same issue appears in **2+ PRB entries**, promote fix to LEARN and reference from both PRBs.
