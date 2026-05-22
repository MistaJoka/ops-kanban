# Build progress — live dashboard

**AI agents: read this file first every session; update it last.**

`last_updated`: 2025-05-22T22:00:00Z  
`current_phase`: Pilot deploy  
`current_task`: — (settings hub)  
`mvp_status`: `pilot_staging_ready`

---

## Phase completion

| Phase | Name | Status | % | DoD |
|-------|------|--------|---|-----|
| P0 | Scaffold | complete | 100 | DONE-0 |
| P1 | Foundation | complete | 100 | DONE-1 |
| P2 | Workspace | complete | 100 | DONE-2 |
| P3 | Deep card | complete | 100 | DONE-3 |
| P4 | Money | complete | 100 | DONE-4 |
| P5 | AI copilot | complete | 100 | DONE-5 |
| P6 | MVP release | complete | 100 | DONE-6 |
| P7 | Wave 1 | complete | 100 | DONE-7 |
| P8 | Wave 2 | complete | 100 | DONE-8 |
| P9 | Wave 3 | complete | 100 | DONE-9 |
| P10 | Wave 4 | complete | 100 | DONE-10 |

**Status values:** `not_started` | `in_progress` | `blocked` | `complete`

---

## Active blockers

| PRB ID | Summary | Owner | Since |
|--------|---------|-------|-------|
| — | None | — | — |

---

## Recently completed tasks

| Task | Completed | LOG |
|------|-----------|-----|
| TASK-P0-002, TASK-QA-001–004 | 2025-05-22 | LOG-2025-05-22-02 |
| TASK-P10-001–P10-005 | 2025-05-21 | LOG-2025-05-21-18 |
| TASK-P9-001–P9-003 | 2025-05-21 | LOG-2025-05-21-17 |
| TASK-P8-001–P8-006 | 2025-05-21 | LOG-2025-05-21-16 |
| TASK-P7-001–P7-008 | 2025-05-21 | LOG-2025-05-21-15 |

---

## Next recommended tasks

1. Set `SUPABASE_DB_PASSWORD` in `.env.local` and run `npm run db:migrate` (001–016)  
2. Deploy to Vercel staging with `DISABLE_AUTH=false` + Stripe/Twilio/Resend env vars as needed  
3. Set `CRON_SECRET` on Vercel for daily contract runner  
4. Run full regression: `npm run test:regression` after migrations applied

---

## Session notes (latest)

**Premium settings menu.** Two-column settings shell with overview, General (org + pipeline mode), Team roster, and polished integrations/templates/automations/contracts. Sidebar Settings + account menu entry; `GET/PATCH /api/settings/organization`. Unit 49/49, build ✅.

**Optimistic board UI.** Move/create/edit/archive feel instant: local board state updates first, Supabase syncs in background, rollback + subtle alert on failure. Realtime refetch debounced and paused during in-flight mutations. Unit 45/45, build ✅.

**Dev board clean slate.** Persistent dev org showed leftover real cards (75) under `DISABLE_AUTH=true`. Added `npm run dev:reset-board`, dev banner **Reset board** button, and pipeline empty-state CTA. Build ✅.

**Native integrations refactor.** Removed QuickBooks + DocuSign; added `accounting_transactions` ledger (migration 016), AR register + CSV on Reports, native e-sign/booking always on. Stripe optional for card pay. INT-ACC-001–004 added.

**Pipeline UI polish (continued).** Card panel tabs/header/controls + dashboard stat cards and pipeline snapshot bars aligned to `.ops-*` system. Build ✅.

**Pipeline UI polish.** Field ledger tokens + `.ops-*` utilities; tactile card drag (lift/dim), column drop targets, lucide sidebar, unified toolbar controls. Build ✅.

**P0 scaffold complete + QA pack.** shadcn/ui Field ledger theme, validators/state-map unit tests, RLS matrix registry, E2E dashboard/customers smoke, INT-API-001/005 AI contract tests. Unit 40/40, AI 18/18, build ✅.

---

## Metrics

| Metric | Value |
|--------|-------|
| Tasks done / total P0–P10 + QA | 93 / 93 |
| Open PRBs | 0 |
| LEARN entries | 11 |
| Unit tests | 49/49 |
| AI tests | 18/18 |
| Integration tests | 13/13 (+ Wave tests when migrated) |
| E2E + a11y | 21/21 |
| G4 sign-off | ✅ Wave 2 |
| G5 sign-off | ✅ Wave 3 |
| G6 sign-off | ✅ Wave 4 |
| Pilot sign-off | ✅ `PILOT_SIGNOFF.md` |
