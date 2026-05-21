# OpsBoard MVP — QA & regression testing pack

Modular test documentation for **Wave 0** (MVP core) with hooks for **Waves 1–4** (payments, comms, e-sign). Run modules **independently** or via the **full regression path**.

## How to use this pack

| Goal | Run these modules |
|------|-------------------|
| Pre-PR smoke | `RELEASE_GATES.md` § PR gate + `UNIT_TESTS.md` § P0 |
| Wave 0 MVP sign-off | `RELEASE_GATES.md` § MVP + `E2E_REGRESSION.md` + `UAT_SCRIPTS.md` |
| Security audit | `SECURITY_RLS.md` + `THREAT_MODEL.md` + `RISK_MODEL.md` § security |
| AI safety | `AI_TEST_PACK.md` + `FMEA.md` § AI |
| Integration wave | `WEBHOOK_INTEGRATION_TESTS.md` + tagged cases in `REGRESSION_MATRIX.md` |
| Full regression | **Master run** below |

## Module index

| ID | Document | Framework / focus | Tags |
|----|----------|-------------------|------|
| T00 | [TEST_STRATEGY.md](./TEST_STRATEGY.md) | ISTQB-aligned plan, scope, entry/exit | all |
| T01 | [RISK_MODEL.md](./RISK_MODEL.md) | Risk register, RBT prioritization | all |
| T02 | [FMEA.md](./FMEA.md) | Failure Mode & Effects Analysis | all |
| T03 | [THREAT_MODEL.md](./THREAT_MODEL.md) | STRIDE + security test coupling | security |
| T04 | [TEST_PYRAMID.md](./TEST_PYRAMID.md) | Unit / integration / E2E ratio | all |
| T05 | [UNIT_TESTS.md](./UNIT_TESTS.md) | Pure logic, validators, classifiers | unit, P0 |
| T06 | [INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md) | API + Supabase + domain | integration |
| T07 | [API_CONTRACTS.md](./API_CONTRACTS.md) | Route contracts, Zod, errors | api |
| T08 | [SECURITY_RLS.md](./SECURITY_RLS.md) | RLS matrix, auth, tenancy | security, P0 |
| T09 | [E2E_REGRESSION.md](./E2E_REGRESSION.md) | Playwright journeys, regression suites | e2e, P0 |
| T10 | [AI_TEST_PACK.md](./AI_TEST_PACK.md) | Copilot tools, approval, injection | ai, P0 |
| T11 | [WEBHOOK_INTEGRATION_TESTS.md](./WEBHOOK_INTEGRATION_TESTS.md) | PayPal, Twilio, DocuSign (waves) | wave1+ |
| T12 | [UAT_SCRIPTS.md](./UAT_SCRIPTS.md) | Landscaping owner scripts | uat |
| T13 | [PERFORMANCE.md](./PERFORMANCE.md) | Load, realtime, AI latency | perf |
| T14 | [A11Y_MOBILE.md](./A11Y_MOBILE.md) | WCAG, responsive, field use | a11y |
| T15 | [DATA_FIXTURES.md](./DATA_FIXTURES.md) | Seeds, factories, teardown | data |
| T16 | [REGRESSION_MATRIX.md](./REGRESSION_MATRIX.md) | Suite × build × priority | regression |
| T17 | [TRACEABILITY.md](./TRACEABILITY.md) | Req → risk → test ID | trace |
| T18 | [EXPLORATORY_CHARTERS.md](./EXPLORATORY_CHARTERS.md) | Session-based exploration | explore |
| T19 | [BUG_TRIAGE.md](./BUG_TRIAGE.md) | Severity, SLA, regression rules | process |
| T20 | [RELEASE_GATES.md](./RELEASE_GATES.md) | Go/no-go checklists | gate |

## Master regression run (together)

Execute in order; any **P0 fail** blocks release.

```txt
1.  DATA_FIXTURES      — seed test org, verify bootstrap
2.  UNIT_TESTS         — P0 domains (risk, pipeline, validation)
3.  INTEGRATION_TESTS  — API + DB + RLS spot checks
4.  API_CONTRACTS      — /api/ai/command, card CRUD routes
5.  SECURITY_RLS       — full matrix org A vs org B
6.  AI_TEST_PACK       — tool gates, injection, role denial
7.  E2E_REGRESSION     — suite R0 (Wave 0 critical path)
8.  UAT_SCRIPTS        — UAT-01 … UAT-10
9.  A11Y_MOBILE        — smoke on pipeline + card panel
10. PERFORMANCE        — baseline only (not load test gate for MVP)
11. RELEASE_GATES      — sign checklist
```

**Estimated manual+auto (Wave 0):** ~4–6h first run; ~45min re-run with CI.

## Suggested repo layout (implementation)

```txt
tests/
  unit/           ← T05
  integration/    ← T06, T07, T08
  e2e/            ← T09, T12
  ai/             ← T10
  webhooks/       ← T11 (wave 1+)
  fixtures/       ← T15
  helpers/        auth.ts, seed.ts, supabase.ts
```

## Test ID convention

```txt
{LEVEL}-{AREA}-{NNN}

Examples:
  UNIT-PIPE-001
  INT-API-012
  E2E-JOB-003
  SEC-RLS-007
  AI-TOOL-004
  UAT-08
```

## Product doc traceability

Requirements source: `docs/product/*`, `docs/ai/*`, `docs/cursor/PHASED_BUILD_PLAN.md`.  
Mapping: [TRACEABILITY.md](./TRACEABILITY.md).

## CI mapping (when wired)

| Job | Modules |
|-----|---------|
| `ci:unit` | T05 |
| `ci:integration` | T06, T07, T08 |
| `ci:e2e` | T09 (smoke on PR, full on main) |
| `ci:ai` | T10 |
| `ci:security` | T08, T03 |
| `ci:release` | T20 gate |
