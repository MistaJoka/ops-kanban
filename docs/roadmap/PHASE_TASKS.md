# Phase tasks — development backlog

**AI agents:** Follow [`AI_BUILD_PROTOCOL.md`](./AI_BUILD_PROTOCOL.md). One task per session.

**Status values:** `todo` | `doing` | `blocked` | `done`  
**DoD:** `DEFINITION_OF_DONE.md` → `DONE-{n}`  

**After each task (required):**

| Update | File |
|--------|------|
| Status | This file (`doing` → `done`) |
| Dashboard | [`PROGRESS.md`](./PROGRESS.md) |
| Session record | [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md) |
| Trouble | [`PROBLEM_REGISTRY.md`](./PROBLEM_REGISTRY.md) if blocked |
| Learning | [`BUILD_KNOWLEDGE.md`](./BUILD_KNOWLEDGE.md) if reusable fix |

---

## Phase 0 — Scaffold & tooling

**Goal:** Runnable repo with CI, structure, and test harness.  
**DoD:** DONE-0 | **Depends on:** nothing

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P0-001 | Create Next.js app (App Router, TS, Tailwind) | todo | — | — |
| TASK-P0-002 | Add shadcn/ui + CSS variables (Field ledger theme) | todo | — | P0-001 |
| TASK-P0-003 | Folder layout: `app/`, `components/`, `lib/domain/`, `lib/db/`, `lib/ai/` | todo | — | P0-001 |
| TASK-P0-004 | Supabase clients (browser, server, service) | todo | — | P0-001 |
| TASK-P0-005 | Copy `src-starter/lib/ai/*` into `lib/ai/` | todo | — | P0-003 |
| TASK-P0-006 | Vitest + test helpers stub | todo | — | P0-003 |
| TASK-P0-007 | Playwright config + one smoke placeholder | todo | — | P0-006 |
| TASK-P0-008 | GitHub Actions: lint, typecheck, unit | todo | — | P0-006 |
| TASK-P0-009 | `.env.local` + `.env.example` docs | todo | — | P0-004 |
| TASK-P0-010 | README “Running locally” section | todo | — | P0-001 |

---

## Phase 1 — Foundation

**Goal:** Auth, multi-tenant data, RLS, signup bootstrap.  
**DoD:** DONE-1 | **Depends on:** Phase 0

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P1-001 | Apply `001_core_schema.sql` to dev project | todo | — | P0-004 |
| TASK-P1-002 | Migration `002_auth_profiles` (FK auth.users) | todo | INT-BOOT-002 | P1-001 |
| TASK-P1-003 | Migration `003_cards_job_type` (optional) | todo | — | P1-001 |
| TASK-P1-004 | RLS policies all MVP tables | todo | SEC-RLS-* | P1-001 |
| TASK-P1-005 | Signup/login pages | todo | E2E-BOOT-001 | P0-001 |
| TASK-P1-006 | Bootstrap service: org + board + 9 columns | todo | INT-BOOT-001 | P1-005, columns TS |
| TASK-P1-007 | `organization_members` role on signup (owner) | todo | SEC-ROLE | P1-006 |
| TASK-P1-008 | Middleware: auth guard app routes | todo | SEC-AUTH-* | P1-005 |
| TASK-P1-009 | Seed script for test orgs (`DATA_FIXTURES`) | todo | — | P1-006 |
| TASK-P1-010 | Indexes per `MVP_SCHEMA.md` | todo | — | P1-001 |

---

## Phase 2 — Workspace + pipeline

**Goal:** Main workspace; Kanban operational.  
**DoD:** DONE-2 | **Depends on:** Phase 1

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P2-001 | App shell layout + collapsible sidebar | todo | E2E-NAV-001 | P1-008 |
| TASK-P2-002 | Support routes: help, contact, changelog | todo | E2E-SUP-001 | P2-001 |
| TASK-P2-003 | `/pipeline` page + top bar | todo | E2E-BOOT-001 | P2-001 |
| TASK-P2-004 | Fetch board, columns, cards (server) | todo | — | P1-006 |
| TASK-P2-005 | Column component + group headers (compact) | todo | UAT-01 | P2-004 |
| TASK-P2-006 | Board card component (`CARD_DESIGN`) | todo | — | P2-005 |
| TASK-P2-007 | `lib/domain/pipeline/validateMove.ts` | todo | UNIT-PIPE-* | P2-004 |
| TASK-P2-008 | Drag/drop + API move + rollback | todo | E2E-JOB-002 | P2-007 |
| TASK-P2-009 | Quick create card (+) | todo | E2E-JOB-001 | P2-008 |
| TASK-P2-010 | Filters + search | todo | UAT-08 | P2-004 |
| TASK-P2-011 | Activity log on create/move | todo | INT-CARD-002 | P2-008 |
| TASK-P2-012 | Realtime subscription (or waiver) | todo | INT-RT-001 | P2-004 |
| TASK-P2-013 | Full pipeline toggle (19 col) | todo | E2E-PIPE-001 | P2-005 |
| TASK-P2-014 | Brand assets: real SVG or text-only mark (no lorem, no mock jobs) | todo | — | P0-002 |

---

## Phase 3 — Deep card

**Goal:** Slide-over job record.  
**DoD:** DONE-3 | **Depends on:** Phase 2

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P3-001 | Card panel shell + routing state | todo | MOB-001 | P2-006 |
| TASK-P3-002 | Header: title, column dropdown, priority | todo | — | P3-001 |
| TASK-P3-003 | Tab: Overview | todo | — | P3-001 |
| TASK-P3-004 | Tab: Property (customer CRUD) | todo | E2E-JOB-003 | P3-001 |
| TASK-P3-005 | Tab: Scope + job_type | todo | — | P1-003 |
| TASK-P3-006 | Tab: Schedule (dates, assignee) | todo | UAT-04 | P3-001 |
| TASK-P3-007 | Tab: Comments | todo | — | P3-001 |
| TASK-P3-008 | Tab: Checklist (JSON MVP) | todo | — | P3-001 |
| TASK-P3-009 | Activity timeline (right rail) | todo | — | P2-011 |
| TASK-P3-010 | Move validation UI (modals) | todo | E2E-JOB-006 | P2-007 |
| TASK-P3-011 | Mobile full-screen sheet | todo | MOB-001 | P3-001 |

---

## Phase 4 — Money drafts

**Goal:** Estimate + invoice without payment provider.  
**DoD:** DONE-4 | **Depends on:** Phase 3

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P4-001 | `lib/domain/money/quotes.ts` | todo | UNIT-MNY-001 | P3-001 |
| TASK-P4-002 | Tab: Estimate (line items UI) | todo | E2E-JOB-004 | P4-001 |
| TASK-P4-003 | Gate `estimate_sent` if total 0 | todo | UNIT-VAL-002 | P2-007 |
| TASK-P4-004 | `lib/domain/money/invoices.ts` | todo | INT-MNY-003 | P4-001 |
| TASK-P4-005 | Tab: Money (invoice, balance) | todo | UAT-05 | P4-004 |
| TASK-P4-006 | Manual mark paid | todo | E2E-MNY-001 | P4-004 |
| TASK-P4-007 | Archive column `archived` + filter hidden | todo | E2E-MNY-001 | P2-008 |
| TASK-P4-008 | Archive warn if balance due | todo | E2E-MNY-004 | P4-006 |

---

## Phase 5 — AI copilot

**Goal:** Safe AI on board + card.  
**DoD:** DONE-5 | **Depends on:** Phase 4

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P5-001 | Wire `loadAiContext` to Supabase | todo | AI-CTX-* | P2-004 |
| TASK-P5-002 | `/api/ai/command` + Gemini + tool loop | todo | INT-API-* | P5-001 |
| TASK-P5-003 | Approval API + modal UI | todo | E2E-AI-002 | P5-002 |
| TASK-P5-004 | AI dock (board) | todo | E2E-AI-001 | P5-002 |
| TASK-P5-005 | AI rail (card) | todo | — | P5-004 |
| TASK-P5-006 | Implement tool executors (domain calls) | todo | AI-TOOL-* | P5-002 |
| TASK-P5-007 | Suggested prompt chips | todo | — | P5-004 |
| TASK-P5-008 | Inline summary on Overview | todo | E2E-AI-001 | P5-006 |
| TASK-P5-009 | Draft estimate CTA on estimating | todo | AI-TOOL-004 | P5-006 |
| TASK-P5-010 | Rate limit middleware | todo | PERF-AI | P5-002 |

---

## Phase 6 — MVP release

**Goal:** Pilot-ready.  
**DoD:** DONE-6 (MVP SHIPPED) | **Depends on:** Phase 5

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P6-001 | Error/empty/loading states audit | todo | manual | P2–P5 |
| TASK-P6-002 | A11y pass | todo | A11Y-* | P6-001 |
| TASK-P6-003 | E2E suite R0 green in CI | todo | T09 | P5 |
| TASK-P6-004 | SEC-RLS + AI-INJ green | todo | T08,T10 | P1,P5 |
| TASK-P6-005 | UAT-01–10 on staging | todo | T12 | P6-003 |
| TASK-P6-006 | EXP-01,03,04 exploratory | todo | T18 | P6-005 |
| TASK-P6-007 | FMEA/RPN review + waivers | todo | T02 | P6-004 |
| TASK-P6-008 | Release gate G2 sign-off | todo | T20 | P6-007 |
| TASK-P6-009 | Staging + prod env + monitoring | todo | T20 ops | P6-008 |
| TASK-P6-010 | CHANGELOG v0.1.0 | todo | — | P6-008 |
| TASK-P6-011 | CI script: ban mock/sample imports in app; NO_MOCK §8 verify | todo | V1–V7 | P6-003 |

---

## Phase 7 — Wave 1: Money & trust

**DoD:** DONE-7 | **Depends on:** Phase 6

| ID | Task | Status | Tests |
|----|------|--------|-------|
| TASK-P7-001 | `payments` + `integration_events` migration | todo | — |
| TASK-P7-002 | Stripe or PayPal adapter | todo | WH-PAY-* |
| TASK-P7-003 | Payment link on invoice UI | todo | — |
| TASK-P7-004 | Webhook routes + idempotency | todo | WH-PAY-003 |
| TASK-P7-005 | Settings → Integrations | todo | — |
| TASK-P7-006 | Estimate PDF + Resend | todo | — |
| TASK-P7-007 | Portal magic link approve v0 | todo | — |
| TASK-P7-008 | Gate G3 | todo | T20 |

---

## Phase 8 — Wave 2: Time & conversation

**DoD:** DONE-8

| ID | Task | Status | Tests |
|----|------|--------|-------|
| TASK-P8-001 | Public `/book/{org}` page | todo | WH-BOOK-* |
| TASK-P8-002 | Calendar page | todo | — |
| TASK-P8-003 | Twilio SMS + card thread | todo | WH-SMS-* |
| TASK-P8-004 | Resend email thread | todo | — |
| TASK-P8-005 | Message templates | todo | — |
| TASK-P8-006 | AI send comms (approved) | todo | AI-TOOL |

---

## Phase 9 — Wave 3: Documents

**DoD:** DONE-9

| ID | Task | Status | Tests |
|----|------|--------|-------|
| TASK-P9-001 | Supabase Storage attachments | todo | — |
| TASK-P9-002 | DocuSign adapter (optional) | todo | WH-SIGN-* |
| TASK-P9-003 | `parent_card_id` change orders | todo | — |

---

## Phase 10 — Wave 4: Scale

**DoD:** DONE-10

| ID | Task | Status | Tests |
|----|------|--------|-------|
| TASK-P10-001 | Full customer portal | todo | — |
| TASK-P10-002 | QuickBooks sync | todo | — |
| TASK-P10-003 | Automations engine | todo | — |
| TASK-P10-004 | Reports page | todo | — |
| TASK-P10-005 | Recurring contracts | todo | — |

---

## Parallel track: QA (ongoing)

| ID | Task | Start after | Status |
|----|------|-------------|--------|
| TASK-QA-001 | Vitest unit tests for pipeline + money | P2-007 | todo |
| TASK-QA-002 | RLS matrix automation | P1-004 | todo |
| TASK-QA-003 | E2E R0 implemented | P2-009 | todo |
| TASK-QA-004 | AI pack implemented | P5-002 | todo |

---

## Dependency graph (summary)

```txt
P0 → P1 → P2 → P3 → P4 → P5 → P6 [MVP]
                  ↓
            P7 → P8 → P9 → P10
```

QA runs parallel from P1 onward.
