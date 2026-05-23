# Security & RLS matrix (T08)

**Run alone:** `npm run test:security`  
**Couples:** T03 STRIDE, T01 R-01, FMEA F-10

## Setup

- Org **Alpha** user A (owner), user A2 (worker)
- Org **Beta** user B (owner)
- Anon client, service role (server tests only)

## SEC-RLS — Table matrix (P0 each)

For each table: SELECT, INSERT, UPDATE, DELETE as A, A2, B, anon.

| Table                | A own org | B other org | anon |
| -------------------- | --------- | ----------- | ---- |
| organizations        | ✓/—/✓/—   | ✗           | ✗    |
| organization_members | ✓         | ✗           | ✗    |
| boards               | ✓         | ✗           | ✗    |
| columns              | ✓         | ✗           | ✗    |
| cards                | ✓         | ✗           | ✗    |
| customers            | ✓         | ✗           | ✗    |
| quotes               | ✓         | ✗           | ✗    |
| quote_items          | via quote | ✗           | ✗    |
| invoices             | ✓         | ✗           | ✗    |
| comments             | ✓         | ✗           | ✗    |
| activities           | ✓         | ✗           | ✗    |
| ai_tool_calls        | ✓         | ✗           | ✗    |
| ai_action_approvals  | ✓         | ✗           | ✗    |
| profiles             | own       | ✗           | ✗    |

**Pass:** Beta never reads/writes Alpha rows. Anon never reads.

## SEC-ROLE — Role matrix

| Action           | owner | manager | worker | viewer |
| ---------------- | ----- | ------- | ------ | ------ |
| createCard       | ✓     | ✓       | ✓      | ✗      |
| moveCard (any)   | ✓     | ✓       | policy | ✗      |
| createQuoteDraft | ✓     | ✓       | ✗      | ✗      |
| markInvoicePaid  | ✓     | ✓       | ✗      | ✗      |
| archiveCard      | ✓     | ✓       | ✗      | ✗      |
| AI moveCard      | ✓     | ✓       | ✓\*    | ✗      |

\*worker assigned-only per product policy

## SEC-AUTH

| ID           | Case                                | Expected | P   |
| ------------ | ----------------------------------- | -------- | --- |
| SEC-AUTH-001 | Expired JWT                         | 401      | P0  |
| SEC-AUTH-002 | Tampered JWT                        | 401      | P0  |
| SEC-AUTH-003 | Missing Authorization header on API | 401      | P0  |

## SEC-API

| ID          | Case                             | Expected    | P   |
| ----------- | -------------------------------- | ----------- | --- |
| SEC-API-010 | Service role from browser bundle | not exposed | P0  |
| SEC-API-011 | GEMINI_API_KEY client-side       | not exposed | P0  |

## SEC-RLS-030 — Enumeration

Request random UUID card in other org → **404** preferred over 403 leak.

## Automation

Script: `tests/integration/rls-matrix.test.ts` generates cases from table list in `MVP_SCHEMA.md`.
