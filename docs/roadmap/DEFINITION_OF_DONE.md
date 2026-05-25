# Definitions of done (DoD)

A phase is **complete** only when **all** mandatory items below pass. Tasks reference `DONE-{phase}`.

---

## Global DoD (every task)

| #   | Criterion                                                                                    |
| --- | -------------------------------------------------------------------------------------------- |
| G1  | Code merged to `main` (or agreed trunk) with PR review                                       |
| G2  | Typecheck + lint pass                                                                        |
| G3  | No new P0 test failures; new logic has test IDs from `docs/testing/`                         |
| G4  | RLS considered for any new table/column                                                      |
| G5  | Activity logged for user-visible mutations                                                   |
| G6  | `DEVELOPMENT_LOG.md` entry added                                                             |
| G7  | No secrets in repo                                                                           |
| G8  | No mock/sample job data in `app/`, `components/`, `lib/domain/` per `NO_MOCK_DATA_POLICY.md` |

---

## DONE-0 — Phase 0: Scaffold & tooling

| #   | Criterion                                           | Verify                                     |
| --- | --------------------------------------------------- | ------------------------------------------ |
| 0.1 | Next.js 15+ App Router project runs locally         | `npm run dev`                              |
| 0.2 | Folder layout matches `ARCHITECTURE_PRINCIPLES.md`  | review                                     |
| 0.3 | Supabase clients: browser + server + service        | smoke import                               |
| 0.4 | Vitest + Playwright configured                      | `npm run test:unit` runs (even if 0 tests) |
| 0.5 | CI workflow runs lint + unit on PR                  | green                                      |
| 0.6 | `.env.example` documented                           | review                                     |
| 0.7 | `docs/roadmap/PHASE_TASKS.md` Phase 0 tasks checked | log                                        |

---

## DONE-1 — Phase 1: Foundation

| #   | Criterion                                       | Test / verify              |
| --- | ----------------------------------------------- | -------------------------- |
| 1.1 | Migrations applied; `002_auth_profiles` if used | supabase db                |
| 1.2 | Signup creates org + board + 9 columns          | INT-BOOT-001, E2E-BOOT-001 |
| 1.3 | `profiles.id` ↔ `auth.users`                    | INT-BOOT-002               |
| 1.4 | RLS matrix 100% MVP tables                      | SEC-RLS full               |
| 1.5 | Roles: owner, manager, worker, viewer enforced  | SEC-ROLE                   |
| 1.6 | Login/logout/session refresh works              | manual                     |
| 1.7 | `job_type` column if migration 003 shipped      | schema                     |

**Phase exit:** User A cannot read Org B cards (UAT-10).

---

## DONE-2 — Phase 2: Workspace + pipeline

| #   | Criterion                                 | Test / verify            |
| --- | ----------------------------------------- | ------------------------ |
| 2.1 | Default route `/pipeline` after login     | E2E-BOOT-001             |
| 2.2 | Sidebar collapse + support routes         | E2E-NAV-001, E2E-SUP-001 |
| 2.3 | 9 columns render; compact mode default    | UAT-01                   |
| 2.4 | Create card, drag move, rollback on error | E2E-JOB-001,002          |
| 2.5 | Column move writes `activities`           | INT-CARD-002             |
| 2.6 | Filters + search functional               | UAT-08                   |
| 2.7 | Full pipeline toggle (19 col) if scoped   | E2E-PIPE-001 optional    |
| 2.8 | Realtime board update OR documented defer | INT-RT-001 or log waiver |
| 2.9 | Field ledger styling per `CARD_DESIGN`    | visual review            |

**Phase exit:** Manual job runs inquiry → archived without AI (UAT-02–05 partial).

---

## DONE-3 — Phase 3: Deep card

| #   | Criterion                                                                       | Test / verify                |
| --- | ------------------------------------------------------------------------------- | ---------------------------- |
| 3.1 | Slide-over panel desktop + full-screen mobile                                   | MOB-001, A11Y-002            |
| 3.2 | Tabs: Overview, Property, Scope, Estimate, Schedule, Money, Comments, Checklist | UAT-02,03                    |
| 3.3 | Customer save linked to card                                                    | INT-CARD-003                 |
| 3.4 | Activity timeline on card                                                       | manual                       |
| 3.5 | Move validation: schedule date, estimate $0                                     | UNIT-VAL-\*, E2E-JOB-004,006 |
| 3.6 | Keyboard Esc closes panel                                                       | A11Y-004                     |

**Phase exit:** “Rivera — spring cleanup” fully documented on one card.

---

## DONE-4 — Phase 4: Money drafts

| #   | Criterion                          | Test / verify            |
| --- | ---------------------------------- | ------------------------ |
| 4.1 | Quote + line items; totals correct | UNIT-MNY-\*, INT-MNY-001 |
| 4.2 | Block/warn estimate_sent with $0   | E2E-JOB-004, FMEA F-04   |
| 4.3 | Invoice draft; balance_due         | INT-MNY-003              |
| 4.4 | Manual mark paid → archived column | E2E-MNY-001, UAT-05      |
| 4.5 | Archive warn if balance due        | E2E-MNY-004              |

**Phase exit:** PRODUCT_BRIEF #4–9 satisfied without integrations.

---

## DONE-5 — Phase 5: AI copilot

| #   | Criterion                                   | Test / verify           |
| --- | ------------------------------------------- | ----------------------- |
| 5.1 | Board dock + card rail                      | E2E-AI-001              |
| 5.2 | Context capped; no cross-org                | AI-CTX-_, UNIT-CTX-_    |
| 5.3 | Tools: summarize, create, move, quote draft | AI-TOOL-\*              |
| 5.4 | Approval modal medium/high                  | E2E-AI-002              |
| 5.5 | Viewer denied writes                        | AI-TOOL-010, E2E-AI-003 |
| 5.6 | Injection suite pass                        | AI-INJ-\*               |
| 5.7 | `ai_tool_calls` + activities on execute     | AI-LOG-001              |

**Phase exit:** REQ-10 traceability green; UAT-06 pass.

---

## DONE-6 — Phase 6: MVP release hardening

| #    | Criterion                                     | Test / verify               |
| ---- | --------------------------------------------- | --------------------------- |
| 6.1  | Error/empty/loading states on pipeline + card | manual                      |
| 6.2  | Mobile pass MOB-\*                            | T14                         |
| 6.3  | Rate limit on `/api/ai/command`               | PERF-AI optional            |
| 6.4  | **Release gate G2** signed                    | `RELEASE_GATES.md`          |
| 6.5  | TRACEABILITY ≥95%                             | T17                         |
| 6.6  | FMEA RPN>100 closed or waived                 | T02                         |
| 6.7  | Pilot deploy checklist (env, monitoring)      | T20 ops                     |
| 6.8  | `CHANGELOG.md` v0.1.0 entry                   | review                      |
| 6.9  | No-mock verification V1–V7 pass               | `NO_MOCK_DATA_POLICY.md` §8 |
| 6.10 | CI ban script: no test imports in app         | TASK-P6-011                 |

**MVP SHIPPED** when DONE-6 complete.

---

## DONE-7 — Wave 1: Money & trust

| #   | Criterion                                  |
| --- | ------------------------------------------ |
| 7.1 | Payment link on invoice (Stripe or PayPal) |
| 7.2 | WH-PAY P0 pass                             |
| 7.3 | Manual paid still works                    |
| 7.4 | Native estimate approve portal v0          |
| 7.5 | Gate G3 signed                             |

---

## DONE-8 — Wave 2: Time & conversation

| #   | Criterion                           |
| --- | ----------------------------------- |
| 8.1 | Public booking → card               |
| 8.2 | Crew calendar page                  |
| 8.3 | SMS thread on card; inbound webhook |
| 8.4 | Email send with approval            |

---

## DONE-9 — Wave 3: Documents

> **Historical note:** DONE-9.2 originally allowed DocuSign. Production path is **native portal e-sign** only (DocuSign adapter removed — see DEVELOPMENT_LOG native integrations refactor).

| #   | Criterion                             |
| --- | ------------------------------------- |
| 9.1 | Attachments on card                   |
| 9.2 | DocuSign OR native sign path complete |
| 9.3 | Change orders                         |

---

## DONE-10 — Wave 4: Scale

> **Historical note:** DONE-10.2 originally required QuickBooks sync. Production path is **native accounting ledger** (`accounting_transactions`, migration 016) — QB adapter removed.

| #    | Criterion                                    |
| ---- | -------------------------------------------- |
| 10.1 | Full portal                                  |
| 10.2 | QuickBooks sync                              |
| 10.3 | Automations + reports                        |
| 10.4 | One business end-to-end without external CRM |

---

## DONE-17 — Phase 17: Backend reliability completion

| #    | Criterion                                                         | Verify                          |
| ---- | ----------------------------------------------------------------- | ------------------------------- |
| 17.1 | All API routes use `withApiRoute` / `withPublicRoute` / `withWebhookRoute` | grep route inventory          |
| 17.2 | `DomainError` + `mapDomainError` for typed domain failures        | UNIT-ERR-005                    |
| 17.3 | Idempotency claim-first (`client_mutations`, `inquiry_requests`)  | INT-IDEM-002, INT-IDEM-003      |
| 17.4 | Atomic intake/booking RPC (migration 021)                         | WH-INQ-*, booking.test          |
| 17.5 | Public POST rate limits (inquiry, book, portal)                   | INT-API-PUB-001, UNIT-RATE-001  |
| 17.6 | Core API contract tests backfilled                                | api-contracts.test.ts           |
| 17.7 | Health endpoint does not leak env key shape                       | manual `/api/health`            |

**Phase exit:** Full unit gate green; integration tests pass when Supabase env available.

---

## Task-level DoD (template)

```txt
[ ] Code complete
[ ] Tests: {TEST-IDs}
[ ] DoD phase items touched
[ ] Docs updated (if behavior)
[ ] DEVELOPMENT_LOG entry
[ ] PHASE_TASKS checkbox
```
