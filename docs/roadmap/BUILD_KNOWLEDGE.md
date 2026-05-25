# Build knowledge — reinforced learning for agents

Durable patterns discovered during build. **Search here before debugging.**

Format: **LEARN-NNN** — When / Problem / Solution / Verify / Refs

---

## Agent discipline

### LEARN-001 — Canonical pipeline terminal state

|              |                                                                                  |
| ------------ | -------------------------------------------------------------------------------- |
| **When**     | Adding columns, move validation, or AI moveCard                                  |
| **Problem**  | `closed` vs `archived` drift breaks move rules and tests                         |
| **Solution** | Use `archived` only; compact 9-col ends at `archived`; see `DEFAULT_PIPELINE.md` |
| **Verify**   | `rg "state_key.*closed" docs src` returns none                                   |
| **Refs**     | PRB-000, `landscaping-default-columns.ts`                                        |

### LEARN-002 — No mock production data

|              |                                                                     |
| ------------ | ------------------------------------------------------------------- |
| **When**     | Seeding, demos, AI tools, onboarding                                |
| **Problem**  | Sample cards look real; pilots lose trust                           |
| **Solution** | Signup inserts 0 cards; empty states only; `NO_MOCK_DATA_POLICY.md` |
| **Verify**   | `npm run check:no-mock`; new signup → empty pipeline                |
| **Refs**     | `scripts/check-no-mock.sh`                                          |

### LEARN-003 — AI executor must persist

|              |                                                                           |
| ------------ | ------------------------------------------------------------------------- |
| **When**     | Wiring Phase 5 AI                                                         |
| **Problem**  | Stub executor returns success without DB write                            |
| **Solution** | `executeToolCall` → `lib/domain/*` only; log `ai_tool_calls` + activities |
| **Verify**   | `AI-LOG-001`; refresh page shows persisted change                         |
| **Refs**     | `tool-executor.ts`, `APPROVAL_FLOW.md`                                    |

---

## Tooling

### LEARN-004 — Env layout: client vs server secrets

|              |                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Wiring Supabase, Gemini, or any secret in Next.js                                                                                                                     |
| **Problem**  | `NEXT_PUBLIC_*` leaks to browser; server keys read ad hoc without validation                                                                                          |
| **Solution** | `lib/env/client.ts` (public vars, Zod) + `lib/env/server.ts` (`server-only`, service role + Gemini). Supabase clients in `lib/db/supabase/{client,server,service}.ts` |
| **Verify**   | `npm run build` loads `.env.local`; `GET /api/health` → `ok: true`, `supabase.connected: true`                                                                        |
| **Refs**     | `.env.example`, `middleware.ts`                                                                                                                                       |

---

## Database & RLS

### LEARN-005 — Signup bootstrap uses service role once

|              |                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **When**     | Phase 1 signup, org provisioning, integration tests                                                                                                                                  |
| **Problem**  | RLS blocks first org/member insert; user has no org yet                                                                                                                              |
| **Solution** | After `auth.signUp` + session, call `bootstrapWorkspace(createServiceClient(), …)` — profile, org, owner member, board, 9 columns; idempotent re-check via existing owner membership |
| **Verify**   | `INT-BOOT-001`, `INT-BOOT-003`; signup → `/pipeline` shows 9 empty columns                                                                                                           |
| **Refs**     | `lib/domain/bootstrap/signupBootstrap.ts`, `SIGNUP_BOOTSTRAP.md`                                                                                                                     |

---

## Frontend

### LEARN-006 — Kanban optimistic move with rollback

|              |                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Drag/drop card between columns                                                                                                     |
| **Problem**  | Slow API makes board feel stuck; failed moves leave wrong column                                                                   |
| **Solution** | Optimistic `columnId` update in client state → `POST /api/cards/:id/move` → revert prior board snapshot on error + surface message |
| **Verify**   | Drag with network failure restores card; `card.moved` activity on success                                                          |
| **Refs**     | `components/pipeline/KanbanBoard.tsx`, `lib/domain/cards/moveCard.ts`                                                              |

---

## AI

### LEARN-007 — Medium/high AI tools require server-side approval

|              |                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Phase 5 AI copilot write tools                                                                                                                                                              |
| **Problem**  | LLM or intent router could trigger card moves, creates, or quote drafts without human review                                                                                                |
| **Solution** | `executeToolCall` inserts pending `ai_tool_calls` + approval row for medium/high risk; UI shows `ApprovalModal`; `/api/ai/approve` calls `executeApprovedToolCall` only after user confirms |
| **Verify**   | E2E-AI-002, INT-API-003/004, AI-TOOL-002                                                                                                                                                    |
| **Refs**     | `lib/ai/tool-executor.ts`, `app/api/ai/approve/route.ts`, `components/ai/ApprovalModal.tsx`                                                                                                 |

---

## AI / Gemini

<!-- LEARN-0xx tool calling, context size, approval -->

---

## Workspace / board UI

### LEARN-010 — Optimistic board state with guarded realtime

|              |                                                                                                                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Kanban drag, card create, card panel saves, or any board mutation                                                                                                                                                                                                                             |
| **Problem**  | Waiting on API + full `refreshBoard()` after each action feels slow; Supabase realtime refetch fights optimistic UI and causes flicker                                                                                                                                                        |
| **Solution** | Update local `BoardView` immediately (`boardOptimistic` + `useBoardState`); sync via precise API calls; reconcile temp IDs on create; rollback snapshot on failure; debounce realtime and skip while `mutationCount > 0`; patch board from card panel via `boardSync` instead of full refetch |
| **Verify**   | Drag card → instant column change; edit title in panel → board card updates without full reload; disconnect network → UI rolls back + alert                                                                                                                                                   |
| **Refs**     | `lib/domain/board/boardOptimistic.ts`, `components/pipeline/useBoardState.ts`, `useBoardRealtime.ts`                                                                                                                                                                                          |

### LEARN-011 — Settings hub shell for multi-page config

|              |                                                                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Adding or refactoring settings routes under `/settings/*`                                                                                                                                                                                     |
| **Problem**  | Orphan settings links in Support nav and inconsistent page chrome feel amateur vs pipeline/dashboard                                                                                                                                          |
| **Solution** | `app/(app)/settings/layout.tsx` wraps `SettingsShell` (sticky grouped sub-nav + mobile tab bar); shared `SettingsPageHeader` + `ops-page-shell`; nav config in `lib/settings/nav.ts`; org settings via `GET/PATCH /api/settings/organization` |
| **Verify**   | Sidebar Settings + account menu → `/settings`; all sub-routes share sub-nav; General saves name/mode with role gate                                                                                                                           |
| **Refs**     | `components/settings/SettingsShell.tsx`, `lib/settings/nav.ts`, `app/api/settings/organization/route.ts`                                                                                                                                      |

---

## Testing

### LEARN-015 — Dev CSS 404 from poisoned `.next` cache

|              |                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | UI suddenly unstyled; Create menu “missing”; E2E passes HTML but page looks broken                                                                                  |
| **Problem**  | `npm run build` + `next dev` share `.next/`; prod `BUILD_ID` + dev HTML → `layout.css` 404; page returns 200 so failures look like “CSS bugs”                       |
| **Solution** | `npm run dev:clean` to kill :3000 and remove `.next`; `npm run check:css-health` before UI sign-off; Playwright uses `playwright-dev-server.mjs` + global CSS check |
| **Verify**   | `npm run check:css-health` → OK; E2E `CSS-001 @smoke` green                                                                                                         |
| **Refs**     | `docs/testing/CSS_DEV_GUARDRAILS.md`, `scripts/check-css-health.mjs`                                                                                                |

<!-- LEARN-0xx flaky tests, fixtures -->

---

## Integrations (Wave 1+)

### LEARN-008 — Single settlement path for manual + webhook paid

| Field        | Value                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**  | Duplicate logic for mark-paid vs Stripe webhook risks drift (archive, balance, activity)                                         |
| **Solution** | `settleInvoicePayment` in `lib/domain/money/settleInvoice.ts`; manual `markInvoicePaid` and `processPaymentWebhook` both call it |
| **Verify**   | INT-MNY-004, WH-PAY-002                                                                                                          |
| **Refs**     | `lib/domain/money/settleInvoice.ts`, `lib/domain/integrations/processPaymentWebhook.ts`                                          |

### LEARN-009 — Shared webhook idempotency for all providers

| Field        | Value                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Problem**  | SMS/payment webhooks could double-process without shared dedup                                                            |
| **Solution** | Reuse `getIntegrationEvent` / `insertIntegrationEvent` / `markIntegrationEvent` from payment processor for Twilio inbound |
| **Verify**   | WH-SMS-001, WH-PAY-003                                                                                                    |
| **Refs**     | `lib/domain/comms/processSmsWebhook.ts`, `lib/domain/integrations/processPaymentWebhook.ts`                               |

### LEARN-012 — Stage age via `column_entered_at`

|              |                                                                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Showing days-in-column on board cards or computing stalled-job metrics                                                                                                                   |
| **Problem**  | `updated_at` resets on any field edit — title patch makes stage age lie                                                                                                                  |
| **Solution** | Migration 017 adds `column_entered_at`; set only when `column_id` changes in `moveCard`/`reorderCard`; `computeDaysInColumn(column_entered_at)` in `boardCard.ts` and optimistic patches |
| **Verify**   | Edit title → days unchanged; move column → counter resets; unit boardCardFormatters                                                                                                      |
| **Refs**     | `017_column_entered_at.sql`, `lib/domain/cards/moveCard.ts`, `lib/domain/board/boardOptimistic.ts`                                                                                       |

### LEARN-013 — Board card menu + scan signals pattern

|              |                                                                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Extending board card scan density or adding quick actions without opening the panel                                                                                                                                                                                           |
| **Problem**  | Monolithic card component mixes drag, click-open, menu, and signal layout; too many badges overflow the scan row                                                                                                                                                              |
| **Solution** | Split `BoardCardSurface` (layout/drag) from `board-card-primitives` (signals/footer) and `BoardCardMenu` (details/summary menu with `stopPropagation`); `CardSignalsRow` shows top 2 signals + `+N` overflow; menu actions call existing `onPatch`/`onMove`/`onArchive` hooks |
| **Verify**   | Hover reveals ⋮; menu assign/move does not open panel; drag still works; >2 signals collapse to `+N`                                                                                                                                                                          |
| **Refs**     | `components/pipeline/BoardCard.tsx`, `BoardCardMenu.tsx`, `board-card-primitives.tsx`                                                                                                                                                                                         |

### LEARN-023 — Category-aware board signal picker + quick actions

|              |                                                                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Board card scan density, column-category polish, or one-click assign/date/priority from the pipeline                                                                                                                                                                          |
| **Problem**  | Fixed signal order overflows meta row; column headers don't echo lifecycle color; common ops require opening panel or ⋮ menu                                                                                                                                                  |
| **Solution** | `pickVisibleBoardSignals(card)` in domain — category priority + fixed 2-slot budget; `BoardCardQuickActions` hover strip reuses `onPatch`/`onMove`; filter chips computed client-side from `BoardCardView[]`                                   |
| **Verify**   | `npm run test:unit -- pickVisibleBoardSignals`; quick assign doesn't open panel                                                                                                                                                          |
| **Refs**     | `lib/domain/cards/pickVisibleBoardSignals.ts`, `BoardCardQuickActions.tsx`, `KanbanBoardToolbar.tsx`, `KanbanColumn.tsx`                                                                                                                                                      |

### LEARN-014 — Gemini function calling with regex fallback

|              |                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Extending AI copilot tools or debugging “AI doesn’t understand me”                                                                                                            |
| **Problem**  | Regex-only routing misses natural language; LLM-only skips governance tests                                                                                                   |
| **Solution** | Primary: `runGeminiAgent` + `gemini-declarations.ts` (role-filtered). Fallback: `intent-router.ts` when `GEMINI_API_KEY` unset. Always validate with Zod + `executeToolCall`. |
| **Verify**   | `npm run test:ai`; with key set, paraphrased commands select tools                                                                                                            |
| **Refs**     | `lib/ai/gemini-agent.ts`, `lib/ai/command-handler.ts`                                                                                                                         |

### LEARN-016 — Pipeline AI dock as flex sibling

|              |                                                                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Adding persistent AI on the pipeline without stealing board scroll or overlapping the card panel                                                                                                                                                |
| **Problem**  | Fixed-position popovers fight z-index with toolbar/panel; expanded copilot hides columns                                                                                                                                                        |
| **Solution** | `AiCommandDock` is a shrink-0 flex sibling below `ops-pipeline-body`; collapsed height `--ai-dock-collapsed` (48px), expanded `--ai-dock-expanded` (220px); auto-collapse when card panel opens unless user expanded; sessionStorage preference |
| **Verify**   | E2E-WORKSPACE-001/002; toolbar visible when dock expanded; card panel + dock coexist                                                                                                                                                            |
| **Refs**     | `components/ai/AiCommandDock.tsx`, `app/globals.css`, `docs/product/UI_MASTER_FORMULA.md`                                                                                                                                                       |

### LEARN-017 — Single workspace shortcuts provider

|              |                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **When**     | Global keyboard shortcuts across app shell + pipeline-specific handlers                                                                                                        |
| **Problem**  | Duplicate `keydown` listeners in KanbanBoard and Sidebar conflict; Esc order inconsistent                                                                                      |
| **Solution** | `WorkspaceShortcutsProvider` in `AppShell` owns one listener; pipeline registers handlers via `registerPipelineHandlers`; Esc stack: dock → card panel → modals → search clear |
| **Verify**   | E2E-WORKSPACE-004/005; `?` opens modal; `/` focuses search on pipeline only                                                                                                    |
| **Refs**     | `components/workspace/WorkspaceShortcutsProvider.tsx`, `components/pipeline/PipelineSearchProvider.tsx`                                                                        |

### LEARN-021 — Unified intake: attach before create

| Field        | Value                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | External leads arrive via web form, QR URL, SMS, or webhook JSON                                                                      |
| **Problem**  | Duplicate cards for same customer; SMS/booking/web each had different insert paths; automations skipped on create                     |
| **Solution** | `processIntake()` in `lib/domain/intake/`: idempotency via `inquiry_requests`, attach to open card by phone/email, `createCardFromSystem`, `runAutomationsForColumnEnter` on new inquiry |
| **Verify**   | WH-INQ-001–004 after migration 020; WH-SMS-002 still green                                                                            |
| **Refs**     | `lib/domain/intake/processIntake.ts`, `app/inquiry/[slug]/`, migration `020_inquiry_intake.sql`                                       |

### LEARN-019 — Mega-file split pattern (AI slop remediation)

|              |                                                                                                                                                                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | TS/TSX file exceeds `check:slop-health` budget (600 lines fail, 500 warn) after AI sessions                                                                                                                                                                                                                                           |
| **Problem**  | God components/hooks mix orchestration, UI chrome, and domain-adjacent mutations; repo becomes unreadable                                                                                                                                                                                                                             |
| **Solution** | 1) Extract pure helpers (`kanbanDndUtils.ts`). 2) Presentational subcomponents (toolbar, DnD area, modals, AI chrome). 3) Orchestration hook (`useKanbanBoardController`). 4) Split mutation hooks by concern (`useCardMoneyMutations`). 5) Thin composer file re-exports. Wire `docs/testing/AI_SLOP_DETECTION.md` + CI `check:slop` |
| **Verify**   | `npm run check:slop-health`; `npm run typecheck`; `npm run test:unit`                                                                                                                                                                                                                                                                 |
| **Refs**     | `scripts/check-slop-health.mjs`, `AI_SLOP_BASELINE_AUDIT.md`, PRB-SLOP-001/002                                                                                                                                                                                                                                                        |

### LEARN-018 — Outbound sync queue (optimistic background save)

|              |                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Rapid board drags, panel edits, or money actions must feel instant without racing parallel fetches                                                                                                            |
| **Problem**  | Optimistic paint existed but each mutation `await fetch`; money flows called `loadCard()` and flashed the panel                                                                                               |
| **Solution** | Pure `OutboundSyncQueue` in domain (per-card FIFO, PATCH coalesce, retry); `useOutboundSync` enqueues API work; UI applies optimistic state then returns; sync pill shows `pending + queued`; rollback on 4xx |
| **Verify**   | UNIT-SYNC-\*; E2E-SYNC-002/003; rapid drag manual QA                                                                                                                                                          |
| **Refs**     | `lib/domain/board/outboundSyncQueue.ts`, `components/pipeline/useOutboundSync.ts`, `useBoardState.ts`                                                                                                         |

### LEARN-020 — Stability hardening (P16)

|              |                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Pilot staging needs crash containment, session recovery, sync catch-up, and observability beyond optimistic UI alone                                                                                            |
| **Problem**  | Single `(app)/error.tsx`; API routes without try/catch; client fetches threw on network failure; realtime disconnect dropped events; `X-Client-Mutation-Id` ignored server-side; no Sentry                     |
| **Solution** | `withApiRoute` + `mapSupabaseError`; `global-error` / public `error.tsx`; `apiFetch` + `SessionGuardProvider`; realtime reconnect + `pendingCatchUp` on queue drain; migration `019_client_mutations` idempotency; `@sentry/nextjs` gated on `SENTRY_DSN` |
| **Verify**   | UNIT-ERR-\*; INT-API-500; INT-IDEM-001 (after migration 019); E2E-RT-001 / REL-001 / REL-003; `npm run test:unit`                                                                                           |
| **Refs**     | `lib/api/withApiRoute.ts`, `lib/client/apiFetch.ts`, `components/pipeline/useBoardRealtime.ts`, `supabase/migrations/019_client_mutations.sql`                                                                |

### LEARN-022 — Backend reliability completion (P17)

|              |                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | P16 shipped wrappers on 6 routes only; idempotency and public endpoints still had race/abuse gaps                                                                                                             |
| **Problem**  | Inconsistent error capture; read-then-insert idempotency races; multi-step intake/booking partial failure; unrate-limited public POSTs                                                                        |
| **Solution** | Roll out `withApiRoute`/`withPublicRoute`/`withWebhookRoute` to all routes; `parseJsonBody` + `DomainError`; claim-first idempotency (`claimClientMutation`, `claimInquiryRequest`); RPC `021_atomic_intake`; `publicRateLimit` on inquiry/book/portal |
| **Verify**   | UNIT-API-001/002, UNIT-RATE-001, INT-IDEM-002/003, INT-API-PUB-001, api-contracts.test.ts; apply migrations 020–021 on staging                                                                              |
| **Refs**     | `lib/api/withApiRoute.ts`, `lib/domain/mutations/idempotency.ts`, `supabase/migrations/021_atomic_intake.sql`, `docs/testing/API_CONTRACTS.md` route inventory                                               |

### LEARN-024 — Doc drift: front/back pass + check:doc-sync

|              |                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **When**     | Canonical specs lag code after fast P16–P17 ships; agents read stale `API_ROUTES` / `MVP_SCHEMA` while tests and LOG hold truth                                                                               |
| **Problem**  | README said migrations 001–015; `API_ROUTES` Wave 0 only; `MVP_SCHEMA` deferred shipped tables; no automated collision detection                                                                             |
| **Solution** | Split API spec: `API_PATTERNS.md` + slim `API_ROUTES.md` + `API_CONTRACTS` inventory; `SCHEMA_CHANGELOG.md` for 007–021; refresh entry points (`README`, `context/`); ops runbooks; `npm run check:doc-sync` |
| **Verify**   | `npm run check:doc-sync`; manual spot-check inquiry route in PAGES + runbook + contracts                                                                                                                      |
| **Refs**     | `scripts/check-doc-sync.mjs`, `docs/api/API_PATTERNS.md`, `docs/database/SCHEMA_CHANGELOG.md`, `docs/ops/INQUIRY_INTAKE.md`, AI_BUILD_PROTOCOL Layer 6                                                      |

---

## Release

<!-- LEARN-0xx G2 gate, staging -->

---

## Promotion rule

If the same issue appears in **2+ PRB entries**, promote fix to LEARN and reference from both PRBs.
