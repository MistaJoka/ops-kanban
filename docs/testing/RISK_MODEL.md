# Risk model & risk-based testing (T01)

## 1. Risk scoring

```txt
Risk Score = Likelihood (1–5) × Impact (1–5)
```

| Impact | 1 Negligible | 3 Moderate | 5 Catastrophic |
|--------|--------------|------------|----------------|
| **Likelihood** | | | |
| 5 Almost certain | 5 | 15 | **25** |
| 3 Possible | 3 | 9 | 15 |
| 1 Rare | 1 | 3 | 5 |

**Test priority:**

| Score | Priority | Test depth |
|-------|----------|------------|
| 20–25 | P0 | Automated + manual every release |
| 12–19 | P1 | Automated; manual each sprint |
| 6–11 | P2 | Automated spot; manual quarterly |
| 1–5 | P3 | Exploratory only |

## 2. Risk register (Wave 0)

| ID | Risk | L | I | Score | P | Mitigation | Test refs |
|----|------|---|---|-------|---|------------|-----------|
| R-01 | Cross-tenant data leak | 2 | 5 | 10→**20*** | P0 | RLS all tables | SEC-RLS-* |
| R-02 | AI moves card without approval | 3 | 4 | 12 | P0 | Risk classifier + modal | AI-TOOL-* |
| R-03 | AI invents invoice/payment | 2 | 5 | 10 | P0 | Tools only, no DB direct | AI-TOOL-*, INT-API-* |
| R-04 | Payment marked paid without money (Wave 1) | 3 | 5 | 15 | P0 | Webhook idempotency | WH-PAY-* |
| R-05 | Lost job on column move failure | 3 | 3 | 9 | P1 | Optimistic rollback | E2E-JOB-*, UNIT-PIPE-* |
| R-06 | Estimate sent with $0 | 4 | 3 | 12 | P1 | Column validation | UNIT-VAL-*, E2E-JOB-* |
| R-07 | Schedule crew without date | 4 | 2 | 8 | P2 | Gate on `scheduled` | UNIT-VAL-* |
| R-08 | PII in AI logs | 2 | 4 | 8 | P1 | Redact context loader | AI-CTX-*, SEC-* |
| R-09 | Session hijack / weak auth | 2 | 5 | 10 | P0 | Supabase auth, HTTPS | SEC-AUTH-* |
| R-10 | Realtime stale board | 3 | 2 | 6 | P2 | Subscription merge | E2E-RT-* |
| R-11 | Worker deletes/archives job | 2 | 3 | 6 | P2 | Role matrix | SEC-ROLE-* |
| R-12 | Gemini outage blocks core app | 3 | 2 | 6 | P2 | AI optional path | E2E-AI-degraded |
| R-13 | Wrong customer on card | 3 | 4 | 12 | P1 | Disambiguation in AI | AI-TOOL-* |
| R-14 | Bulk spam card create via AI | 2 | 3 | 6 | P2 | Rate limit | PERF-AI-* |

*Treat R-01 as 4×5=20 if any RLS test ever failed in staging.

## 3. Risk-based test allocation

```txt
P0 effort ≈ 60% of automation budget
P1 effort ≈ 30%
P2/P3     ≈ 10% + exploratory
```

## 4. Residual risk acceptance

Product owner signs T20 with any open RPN &gt; 100 from FMEA or risk score ≥ 20 without full mitigation.

## 5. Wave 1+ risk additions

| ID | Risk | Tests |
|----|------|-------|
| R-20 | Webhook replay double-pay | WH-PAY-003 |
| R-21 | SMS to wrong customer | WH-SMS-*, INT-COMS-* |
| R-22 | DocuSign envelope wrong PDF | WH-SIGN-* |

Update register when enabling `PLATFORM_CAPABILITIES.md` modules.
