# Traceability matrix (T17)

Links **product requirements** → **risk** → **tests**. Update when adding features.

## Wave 0 requirements

| Req ID | Requirement source                | Risk | FMEA      | Test IDs                                    |
| ------ | --------------------------------- | ---- | --------- | ------------------------------------------- |
| REQ-01 | PRODUCT_BRIEF #1 Create lead      | —    | F-01      | E2E-JOB-001, UAT-02                         |
| REQ-02 | PRODUCT_BRIEF #2 Move pipeline    | R-05 | F-05      | E2E-JOB-002, UNIT-PIPE-\*                   |
| REQ-03 | PRODUCT_BRIEF #3 Customer on card | R-13 | —         | E2E-JOB-003, UAT-02                         |
| REQ-04 | PRODUCT_BRIEF #4 Draft quote      | R-06 | F-04      | E2E-JOB-004, UAT-03                         |
| REQ-05 | PRODUCT_BRIEF #5 Schedule         | —    | F-03      | E2E-JOB-006, UAT-04                         |
| REQ-06 | PRODUCT_BRIEF #6 Complete         | —    | —         | UAT-05                                      |
| REQ-07 | PRODUCT_BRIEF #7 Invoice          | —    | —         | INT-MNY-003, UAT-05                         |
| REQ-08 | PRODUCT_BRIEF #8 Payment          | —    | F-08      | E2E-MNY-001                                 |
| REQ-09 | PRODUCT_BRIEF #9 Archive          | —    | F-09      | E2E-MNY-001                                 |
| REQ-10 | PRODUCT_BRIEF #10 AI assist       | R-02 | F-06      | E2E-AI-_, AI-TOOL-_                         |
| REQ-11 | MVP_SCOPE RLS Phase 1             | R-01 | F-10      | SEC-RLS-\*, UAT-10                          |
| REQ-12 | CARD_DESIGN move validation       | —    | F-03,F-04 | UNIT-VAL-\*, E2E-JOB-004,006                |
| REQ-13 | WORKSPACE sidebar + pipeline      | —    | —         | E2E-NAV-001, E2E-BOOT-001, E2E-WORKSPACE-\* |
| REQ-14 | AI_UTILIZATION approval           | R-02 | F-12      | AI-LOG-\*, INT-API-020                      |
| REQ-15 | DEFAULT_PIPELINE 9 columns        | —    | F-01      | INT-BOOT-001, UAT-01                        |
| REQ-16 | SUPPORT_PAGES help                | —    | —         | E2E-SUP-001                                 |
| REQ-17 | NO_MOCK_DATA_POLICY               | R-03 | —         | V1–V7, TASK-P6-011                          |
| REQ-18 | API_ROUTES + APPROVAL_FLOW        | R-02 | F-12      | INT-API-\*                                  |
| REQ-19 | DESIGN_TOKENS / Field ledger UI   | —    | —         | visual review, UI-MASTER-001, CSS-002       |
| REQ-20 | Optimistic background sync queue  | —    | —         | UNIT-SYNC-_, E2E-SYNC-_                     |
| REQ-21 | P16 app stability (wrappers, boundaries, idempotency 019) | — | — | INT-API-500, INT-IDEM-001, UNIT-ERR-_, REL/E2E-RT-001 |
| REQ-22 | P17 backend reliability (claim-first idempotency, atomic intake, public rate limits) | — | — | INT-IDEM-002/003, INT-API-PUB-001, api-contracts.test.ts, WH-INQ-* |

## Wave 1+ (placeholder)

| Req ID    | Source                      | Tests                      |
| --------- | --------------------------- | -------------------------- |
| REQ-W1-01 | PLATFORM §4.4 PayPal        | WH-PAY-\*                  |
| REQ-W1-02 | PLATFORM §4.1 E-sign native | UAT-W1-01 (add when built) |

## Coverage formula

```txt
Coverage % = (REQ with ≥1 passing P0 test) / (total REQ in scope) × 100
```

Target **≥95%** at Wave 0 release.
