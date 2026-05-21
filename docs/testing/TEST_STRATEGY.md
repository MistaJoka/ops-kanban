# Test strategy (T00)

## 1. Purpose

Validate **OpsBoard Wave 0** landscaping MVP: Job Pipeline, deep cards, money drafts, AI copilot, multi-tenant security—reliable enough for a **single-business pilot**.

## 2. Scope

| In scope (Wave 0) | Out of scope (documented, test later) |
|-------------------|----------------------------------------|
| Auth, org bootstrap, 9-column pipeline | PayPal/Stripe live money (T11 Wave 1) |
| Board + card UI, drag/drop | DocuSign live (Wave 3) |
| Estimate/invoice drafts, manual paid | Calendly OAuth (Wave 2) |
| AI Tier 1–3 tools + approval | QuickBooks sync (Wave 4) |
| RLS, roles | Load test at scale |

## 3. Test levels (see T04)

- **Unit (40%)** — validators, risk classifier, column rules, money math
- **Integration (35%)** — API routes, Supabase, activity logs
- **E2E (25%)** — critical user journeys, regression suite R0

## 4. Frameworks coupled to testing

| Framework | Document | Use |
|-----------|----------|-----|
| **Risk-Based Testing (RBT)** | T01 | Prioritize P0/P1 by $ and safety impact |
| **FMEA** | T02 | Failure modes → prevention → test cases |
| **STRIDE** | T03 | Threats → security test cases |
| **ISTQB** | This doc | Plan, cases, exit criteria |
| **Exploratory** | T18 | Charters for pipeline/card/AI |
| **Traceability** | T17 | Req ID → test ID |

## 5. Entry criteria (start test cycle)

- [ ] `001_core_schema.sql` applied to test project
- [ ] Test env vars in `.env.test` (no production keys)
- [ ] Seed script runs (`DATA_FIXTURES.md`)
- [ ] Dev/staging deploy matches commit under test

## 6. Exit criteria (Wave 0 release)

- [ ] All **P0** tests pass (T16 matrix)
- [ ] Zero open **S1/S2** bugs (T19)
- [ ] RLS matrix 100% pass (T08)
- [ ] UAT-01 … UAT-10 pass on staging
- [ ] FMEA RPN items &gt; 100 mitigated or accepted with sign-off
- [ ] Release gate signed (T20)

## 7. Environments

| Env | Data | Integrations |
|-----|------|--------------|
| local | fixtures | mocked AI, no webhooks |
| CI | ephemeral Supabase branch | mocked external |
| staging | anonymized | sandbox payment when Wave 1+ |
| prod pilot | real org | real keys, monitored |

## 8. Roles

| Role | Responsibility |
|------|----------------|
| Dev | Unit + integration, fix defects |
| QA / agent | E2E, UAT, exploratory, regression |
| Owner sign-off | UAT scripts on staging |

## 9. Defect workflow

See `BUG_TRIAGE.md`. All E2E failures require regression case update if new path found.

## 10. Reporting

Per run: pass/fail by module, P0 blockers, RPN delta, coverage of traceability matrix %.
