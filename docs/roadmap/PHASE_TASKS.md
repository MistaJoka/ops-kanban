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
| TASK-P0-001 | Create Next.js app (App Router, TS, Tailwind) | done | — | — |
| TASK-P0-002 | Add shadcn/ui + CSS variables (Field ledger theme) | done | shadcn Button/Input/Card | P0-001 |
| TASK-P0-003 | Folder layout: `app/`, `components/`, `lib/domain/`, `lib/db/`, `lib/ai/` | done | — | P0-001 |
| TASK-P0-004 | Supabase clients (browser, server, service) | done | — | P0-001 |
| TASK-P0-005 | Copy `src-starter/lib/ai/*` + `src-starter/components/*` into app | done | — | P0-003 |
| TASK-P0-006 | Vitest + test helpers stub | done | — | P0-003 |
| TASK-P0-007 | Playwright config + one smoke placeholder | done | E2E R0 | P0-006 |
| TASK-P0-008 | GitHub Actions: lint, typecheck, unit | done | CI verify | P0-006 |
| TASK-P0-009 | `.env.local` + `.env.example` docs | done | — | P0-004 |
| TASK-P0-010 | README “Running locally” section | done | — | P0-001 |

---

## Phase 1 — Foundation

**Goal:** Auth, multi-tenant data, RLS, signup bootstrap.  
**DoD:** DONE-1 | **Depends on:** Phase 0

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P1-001 | Apply `001_core_schema.sql` to dev project | done | — | P0-004 |
| TASK-P1-002 | Migration `002_auth_profiles` (FK auth.users) | done | INT-BOOT-002 | P1-001 |
| TASK-P1-003 | Migration `003_cards_job_type` (optional) | done | — | P1-001 |
| TASK-P1-004 | RLS policies all MVP tables | done | SEC-RLS-* | P1-001 |
| TASK-P1-005 | Signup/login pages | done | E2E-BOOT-001 | P0-001 |
| TASK-P1-006 | Bootstrap service: org + board + 9 columns | done | INT-BOOT-001 | P1-005, columns TS |
| TASK-P1-007 | `organization_members` role on signup (owner) | done | SEC-ROLE | P1-006 |
| TASK-P1-008 | Middleware: auth guard app routes | done | SEC-AUTH-* | P1-005 |
| TASK-P1-009 | Seed script for test orgs (`DATA_FIXTURES`) | done | — | P1-006 |
| TASK-P1-010 | Indexes per `MVP_SCHEMA.md` | done | — | P1-001 |

---

## Phase 2 — Workspace + pipeline

**Goal:** Main workspace; Kanban operational.  
**DoD:** DONE-2 | **Depends on:** Phase 1

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P2-001 | App shell layout + collapsible sidebar | done | E2E-NAV-001 | P1-008 |
| TASK-P2-002 | Support routes: help, contact, changelog | done | E2E-SUP-001 | P2-001 |
| TASK-P2-003 | `/pipeline` page + top bar | done | E2E-BOOT-001 | P2-001 |
| TASK-P2-004 | Fetch board, columns, cards (server) | done | — | P1-006 |
| TASK-P2-005 | Column component + group headers (compact) | done | UAT-01 | P2-004 |
| TASK-P2-006 | Board card component (`CARD_DESIGN`) | done | — | P2-005 |
| TASK-P2-007 | `lib/domain/pipeline/validateMove.ts` | done | UNIT-PIPE-* | P2-004 |
| TASK-P2-008 | Drag/drop + API move + rollback | done | E2E-JOB-002 | P2-007 |
| TASK-P2-009 | Quick create card (+) | done | E2E-JOB-001 | P2-008 |
| TASK-P2-010 | Filters + search | done | UAT-08 | P2-004 |
| TASK-P2-011 | Activity log on create/move | done | INT-CARD-002 | P2-008 |
| TASK-P2-012 | Realtime subscription (or waiver) | done | INT-RT-001 waiver | P2-004 |
| TASK-P2-013 | Full pipeline toggle (19 col) | blocked | E2E-PIPE-001 defer | P2-005 |
| TASK-P2-014 | Brand assets: real SVG or text-only mark (no lorem, no mock jobs) | done | — | P0-002 |

---

## Phase 3 — Deep card

**Goal:** Slide-over job record.  
**DoD:** DONE-3 | **Depends on:** Phase 2

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P3-001 | Card panel shell + routing state | done | MOB-001 | P2-006 |
| TASK-P3-002 | Header: title, column dropdown, priority | done | — | P3-001 |
| TASK-P3-003 | Tab: Overview | done | — | P3-001 |
| TASK-P3-004 | Tab: Property (customer CRUD) | done | E2E-JOB-003 | P3-001 |
| TASK-P3-005 | Tab: Scope + job_type | done | — | P1-003 |
| TASK-P3-006 | Tab: Schedule (dates, assignee) | done | UAT-04 | P3-001 |
| TASK-P3-007 | Tab: Comments | done | — | P3-001 |
| TASK-P3-008 | Tab: Checklist (JSON MVP) | done | — | P3-001 |
| TASK-P3-009 | Activity timeline (right rail) | done | — | P2-011 |
| TASK-P3-010 | Move validation UI (modals) | done | E2E-JOB-006 | P2-007 |
| TASK-P3-011 | Mobile full-screen sheet | done | MOB-001 | P3-001 |

---

## Phase 4 — Money drafts

**Goal:** Estimate + invoice without payment provider.  
**DoD:** DONE-4 | **Depends on:** Phase 3

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P4-001 | `lib/domain/money/quotes.ts` | done | UNIT-MNY-001 | P3-001 |
| TASK-P4-002 | Tab: Estimate (line items UI) | done | E2E-JOB-004 | P4-001 |
| TASK-P4-003 | Gate `estimate_sent` if total 0 | done | UNIT-VAL-002 | P2-007 |
| TASK-P4-004 | `lib/domain/money/invoices.ts` | done | INT-MNY-003 | P4-001 |
| TASK-P4-005 | Tab: Money (invoice, balance) | done | UAT-05 | P4-004 |
| TASK-P4-006 | Manual mark paid | done | E2E-MNY-001 | P4-004 |
| TASK-P4-007 | Archive column `archived` + filter hidden | done | E2E-MNY-001 | P2-008 |
| TASK-P4-008 | Archive warn if balance due | done | E2E-MNY-004 | P4-006 |

---

## Phase 5 — AI copilot

**Goal:** Safe AI on board + card.  
**DoD:** DONE-5 | **Depends on:** Phase 4

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P5-001 | Wire `loadAiContext` to Supabase | done | AI-CTX-* | P2-004 |
| TASK-P5-002 | `/api/ai/command` + Gemini + tool loop | done | INT-API-* | P5-001 |
| TASK-P5-003 | Approval API + modal UI | done | E2E-AI-002 | P5-002 |
| TASK-P5-004 | AI dock (board) | done | E2E-AI-001 | P5-002 |
| TASK-P5-005 | AI rail (card) | done | — | P5-004 |
| TASK-P5-006 | Implement tool executors (domain calls) | done | AI-TOOL-* | P5-002 |
| TASK-P5-007 | Suggested prompt chips | done | — | P5-004 |
| TASK-P5-008 | Inline summary on Overview | done | E2E-AI-001 | P5-006 |
| TASK-P5-009 | Draft estimate CTA on estimating | done | AI-TOOL-004 | P5-006 |
| TASK-P5-010 | Rate limit middleware | done | PERF-AI | P5-002 |

---

## Phase 6 — MVP release

**Goal:** Pilot-ready.  
**DoD:** DONE-6 (MVP SHIPPED) | **Depends on:** Phase 5

| ID | Task | Status | Tests | Deps |
|----|------|--------|-------|------|
| TASK-P6-001 | Error/empty/loading states audit | done | manual | P2–P5 |
| TASK-P6-002 | A11y pass | done | A11Y-* | P6-001 |
| TASK-P6-003 | E2E suite R0 green in CI | done | T09 | P5 |
| TASK-P6-004 | SEC-RLS + AI-INJ green | done | T08,T10 | P1,P5 |
| TASK-P6-005 | UAT-01–10 on staging | done | T12 | P6-003 |
| TASK-P6-006 | EXP-01,03,04 exploratory | done | T18 | P6-005 |
| TASK-P6-007 | FMEA/RPN review + waivers | done | T02 | P6-004 |
| TASK-P6-008 | Release gate G2 sign-off | done | T20 | P6-007 |
| TASK-P6-009 | Staging + prod env + monitoring | done | T20 ops | P6-008 |
| TASK-P6-010 | CHANGELOG v0.1.0 | done | — | P6-008 |
| TASK-P6-011 | CI script: ban mock/sample imports in app; NO_MOCK §8 verify | done | V1–V7 | P6-003 |

---

## Phase 7 — Wave 1: Money & trust

**DoD:** DONE-7 | **Depends on:** Phase 6

| ID | Task | Status | Tests |
|----|------|--------|-------|
| TASK-P7-001 | `payments` + `integration_events` migration | done | — |
| TASK-P7-002 | Stripe or PayPal adapter | done | WH-PAY-* |
| TASK-P7-003 | Payment link on invoice UI | done | — |
| TASK-P7-004 | Webhook routes + idempotency | done | WH-PAY-003 |
| TASK-P7-005 | Settings → Integrations | done | — |
| TASK-P7-006 | Estimate PDF + Resend | done | — |
| TASK-P7-007 | Portal magic link approve v0 | done | — |
| TASK-P7-008 | Gate G3 | done | T20 |

---

## Phase 8 — Wave 2: Time & conversation

**DoD:** DONE-8

| ID | Task | Status | Tests |
|----|------|--------|-------|
| TASK-P8-001 | Public `/book/{org}` page | done | WH-BOOK-* |
| TASK-P8-002 | Calendar page | done | — |
| TASK-P8-003 | Twilio SMS + card thread | done | WH-SMS-* |
| TASK-P8-004 | Resend email thread | done | — |
| TASK-P8-005 | Message templates | done | — |
| TASK-P8-006 | AI send comms (approved) | done | AI-TOOL |

---

## Phase 9 — Wave 3: Documents

**DoD:** DONE-9

| ID | Task | Status | Tests |
|----|------|--------|-------|
| TASK-P9-001 | Supabase Storage attachments | done | — |
| TASK-P9-002 | Native portal e-sign (DocuSign removed) | done | portal approve |
| TASK-P9-003 | `parent_card_id` change orders | done | — |

---

## Phase 10 — Wave 4: Scale

**DoD:** DONE-10

| ID | Task | Status | Tests |
|----|------|--------|-------|
| TASK-P10-001 | Full customer portal | done | INT-W4 portal |
| TASK-P10-002 | Native accounting ledger | done | INT-ACC-* |
| TASK-P10-003 | Automations engine | done | INT-W4-002 |
| TASK-P10-004 | Reports page | done | INT-W4-001 |
| TASK-P10-005 | Recurring contracts | done | INT-W4-003 |

---

## Parallel track: QA (ongoing)

| ID | Task | Start after | Status |
|----|------|-------------|--------|
| TASK-QA-001 | Vitest unit tests for pipeline + money | P2-007 | done |
| TASK-QA-002 | RLS matrix automation | P1-004 | done |
| TASK-QA-003 | E2E R0 implemented | P2-009 | done |
| TASK-QA-004 | AI pack implemented | P5-002 | done |

---

## Dependency graph (summary)

```txt
P0 → P1 → P2 → P3 → P4 → P5 → P6 [MVP]
                  ↓
            P7 → P8 → P9 → P10
```

QA runs parallel from P1 onward.
