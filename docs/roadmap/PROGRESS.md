# Build progress — live dashboard

**AI agents: read this file first every session; update it last.**

`last_updated`: 2026-05-25T06:45:00Z  
`current_phase`: P17 — backend reliability complete (local verification done)  
`current_task`: — (staging deploy + auth-on UAT)  
`mvp_status`: `pilot_staging_ready`

---

## Phase completion

| Phase | Name                       | Status   | %   | DoD     |
| ----- | -------------------------- | -------- | --- | ------- |
| P0    | Scaffold                   | complete | 100 | DONE-0  |
| P1    | Foundation                 | complete | 100 | DONE-1  |
| P2    | Workspace                  | complete | 100 | DONE-2  |
| P3    | Deep card                  | complete | 100 | DONE-3  |
| P4    | Money                      | complete | 100 | DONE-4  |
| P5    | AI copilot                 | complete | 100 | DONE-5  |
| P6    | MVP release                | complete | 100 | DONE-6  |
| P7    | Wave 1                     | complete | 100 | DONE-7  |
| P8    | Wave 2                     | complete | 100 | DONE-8  |
| P9    | Wave 3                     | complete | 100 | DONE-9  |
| P10   | Wave 4                     | complete | 100 | DONE-10 |
| P11   | Card hardening             | complete | 100 | DONE-11 |
| P12   | UI master formula          | complete | 100 | DONE-12 |
| P13   | Optimistic background sync | complete | 100 | DONE-13 |
| P14   | AI slop detection          | complete | 100 | —       |
| P15   | Premium product polish     | complete | 100 | DONE-15 |
| P16   | App stability hardening    | complete | 100 | DONE-16 |
| P17   | Backend reliability        | complete | 100 | DONE-17 |

**Status values:** `not_started` | `in_progress` | `blocked` | `complete`

---

## Active blockers

| PRB ID | Summary | Owner | Since |
| ------ | ------- | ----- | ----- |
| —      | None    | —     | —     |

---

## Recently completed tasks

| Task                         | Completed  | LOG               |
| ---------------------------- | ---------- | ----------------- |
| TASK-P15-001–008             | 2026-05-23 | LOG-2026-05-23-04 |
| TASK-P14-001–006             | 2026-05-23 | LOG-2026-05-23-03 |
| TASK-P13-001                 | 2026-05-23 | LOG-2026-05-23-01 |
| TASK-P12-001                 | 2026-05-22 | LOG-2026-05-22-25 |
| TASK-P11-001–P11-011         | 2026-05-22 | LOG-2026-05-22-01 |
| TASK-P0-002, TASK-QA-001–004 | 2025-05-22 | LOG-2025-05-22-02 |
| TASK-P10-001–P10-006         | 2026-05-25 | LOG-2026-05-25-02 |
| TASK-P9-001–P9-003           | 2025-05-21 | LOG-2025-05-21-17 |
| TASK-P8-001–P8-006           | 2025-05-21 | LOG-2025-05-21-16 |
| TASK-P7-001–P7-008           | 2025-05-21 | LOG-2025-05-21-15 |

---

## Next recommended tasks

1. Deploy **staging** on Vercel with production env vars (`DISABLE_AUTH=false`)
2. Run preview smoke: `PLAYWRIGHT_BASE_URL=<preview-url> npm run test:e2e:smoke`
3. Set `SENTRY_DSN` on staging and verify one captured error
4. Pilot UAT with real auth: UAT-01 signup, UAT-10 tenancy isolation
5. Share inquiry URL from Settings → Integrations on pilot customer site

---

## Session notes (latest)

**Local bidirectional verification (LOG-2026-05-25-07).** Preconditions: `.env.local` (6 vars incl. `SUPABASE_DB_PASSWORD`), migrations **001→021** applied. Automated gate: typecheck, no-mock, slop-health, unit **150**, AI **35**, integration **43**, security **4**. E2E smoke **17/17**; reliability **3/3** (REL-001 alert selector + client refresh; REL-003 Create menu; E2E-SYNC-003 preview total). Manual UAT: pipeline, card open, schedule validation, search focus, inquiry dedupe (curl + board). Mobile UAT-09 **390×844** pass. E2E flake: `E2E-JOB-006` on dirty dev org when `r0-critical` serial. Next: staging deploy (`DISABLE_AUTH=false`, `SENTRY_DSN`), preview E2E, real-auth UAT-01/10.

**Bidirectional doc sync (LOG-2026-05-25-06).** Reconciled entry points with code: `API_PATTERNS.md`, `SCHEMA_CHANGELOG.md`, ops runbooks, refreshed `README`/`context/`/`PAGES`/`lib/domain/README`. Historical banners on pre-build docs; REQ-21/22. `npm run check:doc-sync` in `test:release`. LEARN-024.

**Card L&F trim (LOG-2026-05-25-05).** Removed lowest-ROI additions: keyboard nav (J/K/Enter), column mini-metrics, compact density toggle, calendar board-signal parity. Retained signal picker (2 slots), meta/footer polish, quick actions, panel tabs, filter chips, column category tint.

**Card L&F + features (LOG-2026-05-25-04).** Full ROI plan shipped before trim; see LOG-2026-05-25-05 for scope reduction.

**Backend reliability completion (P17).** Full route wrapper rollout (49/49); `parseJsonBody`, `withPublicRoute`, `withWebhookRoute`; `DomainError` taxonomy; claim-first idempotency (INT-IDEM-002/003); atomic intake/booking RPC (migration 021); public rate limits (INT-API-PUB-001); API contract tests; health endpoint hygiene. LOG-2026-05-25-03, LEARN-022.

**Unified customer intake (TASK-P10-006).** Public `/inquiry/{slug}` quote form with `?src=` tracking for QR/website; `processIntake` domain engine (dedup, attach-to-open-card, automations on create); SMS unknown-phone path refactored; Settings inquiry URL + preset links. Migration `020_inquiry_intake.sql`. LOG-2026-05-25-02, LEARN-021.

**App stability hardening (P16) — v0.7.0 prep.** Error boundaries (global, public, card panel, AI chrome); `withApiRoute` + Supabase error classifier; `apiFetch` + session guard; realtime reconnect/catch-up; outbound sync idempotency (migration 019); Sentry optional via `SENTRY_DSN`. Tests: UNIT-ERR, INT-API-500, REL/E2E-RT-001. LOG-2026-05-25-01, LEARN-020.

**Premium product polish (P15) — v0.6.0 shipped.** Command toolbar with board health chips (jobs · overdue · unassigned · due); scroll fade affordance; mobile stage nav; stuck-card signal (5d+); card/panel skeletons; Playwright VIS-P15-001–008 screenshots. Audit: `docs/qa/P15_PREMIUM_POLISH_AUDIT.md`. Smoke 17/17, a11y 3/3, unit 121/121, build ✅.

**Optimistic background sync (P13) — v0.5.0 shipped.** Domain `outboundSyncQueue` with per-card FIFO, PATCH coalesce, and retry; `useOutboundSync` hook; board/panel/money fire-and-forget mutations; instant panel stub from board cache; sync pill queue depth + Retry. UNIT-SYNC-_ + E2E-SYNC-_.

**UI master formula alignment (P12) — v0.4.0 shipped.** Canonical `UI_MASTER_FORMULA.md`; pipeline bottom `AiCommandDock` replaces popover; `PipelineGroupJump` + topo board surface; global `WorkspaceShortcutsProvider` with modal; brand SVGs + sidebar mark. E2E-WORKSPACE-001–005, CSS-002, unit `pickActiveGroup`. Notifications bell shipped in AI-P5 (LOG-2026-05-24-01).

**AI gaps + settings hooks (follow-up) — done (LOG-2026-05-24-02).** All seven settings pages on `useSettings*` hooks; unit tests for `ai_memories` + registry tools; doc sync for bell/slop status. Migration 018 pending `SUPABASE_DB_URL`.

**CSS dev cache guardrails.** “CSS keeps breaking” traced to poisoned `.next` (build + dev mix → `layout.css` 404), not Tailwind regressions. Added `npm run check:css-health`, `predev`/`postbuild` warnings, Playwright CSS globalSetup + `CSS-001 @smoke`, `docs/testing/CSS_DEV_GUARDRAILS.md`, LEARN-015.

**Card system build (P11) — v0.3.0 shipped.** Seven-phase CARD_DESIGN hardening: `column_entered_at` migration + domain wiring; `validateMove`/`authorizeCardMutation` role gates; board scan signals (job type, money $, schedule, assignee); `BoardCardMenu` + inline title edit; `NewJobModal` + customer/estimate/paid modals; `reorderCard` + `@dnd-kit` DnD; CardPanel split into hooks/tabs; advanced filters + `N` shortcut. Unit 88/88 ✅. LEARN-012/013 added.

**AI command SSE streaming.** `POST /api/ai/command` accepts `stream: true` and returns `text/event-stream` with `status`, `delta`, `result`, and `error` events. Gemini streams text tokens; tool runs emit executing/polishing phases. `AiDock` shows live tokens + phase labels. AI-SSE 3/3, unit 63/63, typecheck ✅.

**AI phases P2–P4 build-out.** Canonical plan in `docs/ai/AI_PHASES.md`. Shipped revenue loop (invoice draft, payment link, assign-by-name, inline banners), scheduling copilot (calendar context, conflicts, reschedule), customer/money intel (unpaid AR, revenue summary, customer 360), multi-page copilot on dashboard/calendar/customers/reports, voice input. AI 29/29, unit 60/60, build ✅. P5 SSE/vision/next-action suggest deferred.

**AI competitive benchmark.** Canonical matrix vs Jobber / ServiceTitan / HCP / ServiceM8: capability tiers, JTBD scores, Wave A–D gap roadmap, sales messaging. Canvas + `docs/ai/AI_COMPETITIVE_BENCHMARK.md`.

**AI copilot A+ upgrade.** Gemini native function calling (`gemini-agent.ts`), LLM estimate parsing, daily brief, card search/disambiguation, multi-turn dock UI with mode chips, human approval previews, wired `markInvoicePaid`/`archiveCard`. Regex router retained as degraded fallback. AI tests 24/24, unit 55/55, build ✅.

**Premium settings menu.** Two-column settings shell with overview, General (org + pipeline mode), Team roster, and polished integrations/templates/automations/contracts. Sidebar Settings + account menu entry; `GET/PATCH /api/settings/organization`. Unit 49/49, build ✅.

**Optimistic board UI.** Move/create/edit/archive feel instant: local board state updates first, Supabase syncs in background, rollback + subtle alert on failure. Realtime refetch debounced and paused during in-flight mutations. Unit 45/45, build ✅.

**Dev board clean slate.** Persistent dev org showed leftover real cards (75) under `DISABLE_AUTH=true`. Added `npm run dev:reset-board`, dev banner **Reset board** button, and pipeline empty-state CTA. Build ✅.

**Native integrations refactor.** Removed QuickBooks + DocuSign; added `accounting_transactions` ledger (migration 016), AR register + CSV on Reports, native e-sign/booking always on. Stripe optional for card pay. INT-ACC-001–004 added.

**Pipeline UI polish (continued).** Card panel tabs/header/controls + dashboard stat cards and pipeline snapshot bars aligned to `.ops-*` system. Build ✅.

**Pipeline UI polish.** Field ledger tokens + `.ops-*` utilities; tactile card drag (lift/dim), column drop targets, lucide sidebar, unified toolbar controls. Build ✅.

**P0 scaffold complete + QA pack.** shadcn/ui Field ledger theme, validators/state-map unit tests, RLS matrix registry, E2E dashboard/customers smoke, INT-API-001/005 AI contract tests. Unit 40/40, AI 18/18, build ✅.

---

## Metrics

| Metric                         | Value                              |
| ------------------------------ | ---------------------------------- |
| Tasks done / total P0–P11 + QA | 104 / 104                          |
| Open PRBs                      | 0                                  |
| LEARN entries                  | 24                                 |
| Unit tests                     | 130/130                            |
| AI tests                       | 24/24                              |
| Integration tests              | 13/13 (+ Wave tests when migrated) |
| E2E + a11y                     | 21/21 (+ VIS-P15 @visual)          |
| G4 sign-off                    | ✅ Wave 2                          |
| G5 sign-off                    | ✅ Wave 3                          |
| G6 sign-off                    | ✅ Wave 4                          |
| Pilot sign-off                 | ✅ `PILOT_SIGNOFF.md`              |
