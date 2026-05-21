# Release gates (T20)

**Run alone:** checklist before merge / deploy / pilot  
**Couples:** T00 exit criteria, T16 regression, T01 residual risk

---

## Gate G0 — PR merge

- [ ] PR smoke tests pass (`REGRESSION_MATRIX.md`)
- [ ] No new S1/S2 introduced
- [ ] Lint + typecheck pass
- [ ] Test ID referenced in PR if fixing bug

**Approver:** dev + optional QA

---

## Gate G1 — Deploy to staging

- [ ] Nightly regression green
- [ ] SEC-RLS full matrix pass
- [ ] AI-INJ suite pass
- [ ] Seed script runs on clean DB

**Approver:** QA lead

---

## Gate G2 — Wave 0 MVP pilot (production)

### Automated

- [ ] Master regression (`README.md`) 100% P0
- [ ] Unit coverage targets met (`TEST_PYRAMID.md`)
- [ ] E2E R0 + R2 pass
- [ ] `TRACEABILITY.md` ≥95% REQ covered

### Manual

- [ ] UAT-01 … UAT-10 signed (`UAT_SCRIPTS.md`)
- [ ] EXP-01, EXP-03, EXP-04 completed
- [ ] A11Y-001, A11Y-002 zero critical

### Risk & quality

- [ ] FMEA items RPN&gt;100 closed or waived (written waiver)
- [ ] Risk register no open score ≥20 without waiver
- [ ] THREAT_MODEL S/I/T/E minimum tests pass
- [ ] No open S1/S2 bugs

### Ops

- [ ] `.env` production keys rotated, not in repo
- [ ] RLS enabled all tables
- [ ] Error monitoring configured
- [ ] Rollback plan documented

### No mock data (required)

- [ ] `NO_MOCK_DATA_POLICY.md` §8 checks V1–V7 pass
- [ ] New signup shows **0 cards** (9 columns only)
- [ ] No hardcoded pipeline arrays in production bundle (grep/CI)
- [ ] AI tools persist to DB — refresh survives
- [ ] `tool-executor` stub removed — real domain writes only

**Approver:** product owner + QA

---

## Gate G3 — Wave 1 (payments live)

All G2 plus:

- [ ] WH-PAY P0 pass on staging sandbox
- [ ] FMEA F-W1-* mitigated
- [ ] Manual pay still works (fallback)
- [ ] Finance sign-off on one real $1 test transaction

---

## Gate G4 — Wave 2 (comms + booking)

- [ ] WH-SMS P0 pass
- [ ] Opt-out / compliance copy reviewed (SMS)

---

## Waiver template

```txt
Risk/FMEA ID:
Reason:
Mitigation in lieu:
Accepted by:
Date:
```

---

## Post-release

- [ ] Monitor REL metrics 48h
- [ ] Review AI tool_call rejection rate
- [ ] Schedule regression within 7 days of hotfix
