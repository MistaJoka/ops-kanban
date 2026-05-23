# FMEA — Failure Mode & Effects Analysis (T02)

## 1. FMEA scale

| Severity (S) | 1–10 | 10 = financial loss, legal, wrong home visited |
| Occurrence (O) | 1–10 | 10 = happens constantly without controls |
| Detection (D) | 1–10 | 10 = undetectable until customer complains |
| **RPN** | **S × O × D** | Action if RPN &gt; 100 |

## 2. Wave 0 FMEA table

| ID   | Process step          | Failure mode                  | Effect                  | S   | O   | D   | RPN | Controls                        | Test IDs                   |
| ---- | --------------------- | ----------------------------- | ----------------------- | --- | --- | --- | --- | ------------------------------- | -------------------------- |
| F-01 | Signup bootstrap      | Columns not seeded            | Empty board             | 7   | 3   | 2   | 42  | Server action + idempotent seed | INT-BOOT-001, E2E-BOOT-001 |
| F-02 | Create card           | Missing org_id                | Cross-tenant card       | 10  | 2   | 3   | 60  | RLS INSERT                      | SEC-RLS-010                |
| F-03 | Move to scheduled     | No `scheduled_start`          | Crew no-show            | 8   | 5   | 4   | 160 | Validation modal                | UNIT-VAL-003, E2E-JOB-006  |
| F-04 | Move to estimate_sent | Empty quote                   | Bad customer experience | 6   | 6   | 3   | 108 | Block or warn                   | UNIT-VAL-002, E2E-JOB-004  |
| F-05 | Drag/drop             | API fail after UI move        | Wrong column belief     | 7   | 4   | 5   | 140 | Rollback + toast                | E2E-JOB-002                |
| F-06 | AI moveCard           | Wrong cardId                  | Job on wrong column     | 8   | 3   | 4   | 96  | Disambiguation + preview        | AI-TOOL-006                |
| F-07 | AI createCard         | Duplicate inquiry             | Duplicate jobs          | 5   | 5   | 4   | 100 | Dedup by phone/address hint     | AI-TOOL-007                |
| F-08 | Manual mark paid      | Wrong card                    | Books wrong             | 9   | 3   | 3   | 81  | Confirm modal                   | E2E-MNY-003                |
| F-09 | Archive               | Archive with balance due      | Lost revenue            | 8   | 2   | 4   | 64  | Warn + reason                   | E2E-MNY-004                |
| F-10 | RLS read              | Policy missing on table       | Data leak               | 10  | 2   | 8   | 160 | CI matrix all tables            | SEC-RLS-\*                 |
| F-11 | Context loader        | Full DB in prompt             | PII leak + cost         | 7   | 2   | 6   | 84  | Cap cards at 40                 | AI-CTX-002                 |
| F-12 | Approval bypass       | Client calls executor direct  | Unauthorized write      | 9   | 2   | 5   | 90  | Server-only execute             | INT-API-020, SEC-API-\*    |
| F-13 | Realtime              | Missed update                 | Two users conflict      | 5   | 4   | 6   | 120 | Merge by id                     | E2E-RT-001                 |
| F-14 | Signup                | Profile not linked auth.users | Orphan user             | 7   | 3   | 4   | 84  | FK + trigger                    | INT-BOOT-002               |

## 3. RPN &gt; 100 — required actions

| ID   | Action                         | Owner | Verify test         |
| ---- | ------------------------------ | ----- | ------------------- |
| F-03 | Enforce schedule date gate     | Dev   | UNIT-VAL-003        |
| F-04 | Block estimate_sent if total=0 | Dev   | E2E-JOB-004         |
| F-05 | Optimistic rollback            | Dev   | E2E-JOB-002         |
| F-10 | RLS on every MVP table         | Dev   | SEC-RLS full matrix |
| F-13 | Realtime integration test      | Dev   | E2E-RT-001          |

## 4. FMEA ↔ regression

Any production incident: add row to FMEA, add test ID to `REGRESSION_MATRIX.md`, bump occurrence score review quarterly.

## 5. Wave 1 FMEA (payments) — preview

| ID      | Failure mode                         | RPN | Test       |
| ------- | ------------------------------------ | --- | ---------- |
| F-W1-01 | Webhook duplicate → double paid      | 150 | WH-PAY-003 |
| F-W1-02 | Pay link wrong amount                | 120 | WH-PAY-005 |
| F-W1-03 | Webhook secret missing → forged paid | 200 | WH-PAY-001 |

Do not enable Wave 1 in prod until F-W1-\* tests pass.
