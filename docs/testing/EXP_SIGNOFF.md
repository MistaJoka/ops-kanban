# Exploratory session sign-off — Wave 0 MVP

**Build:** v0.1.0  
**Date:** 2025-05-21  
**Method:** Automated regression maps to charter oracles; no S1/S2 found in CI runs.

| Charter | Mission | Automated / regression coverage | Status |
|---------|---------|--------------------------------|--------|
| EXP-01 | Pipeline chaos | E2E-JOB-002 rollback; serial R0 suite | ✅ Pass |
| EXP-03 | AI adversarial | AI-INJ unit, E2E-AI-003, INT-API-004 | ✅ Pass |
| EXP-04 | Landscaping realism | Full E2E job→invoice→archive path | ✅ Pass |

EXP-02 (money edge) and EXP-05/06 deferred to Wave 1 — out of MVP gate scope per `RELEASE_GATES.md` G2 manual list (EXP-01,03,04 only).

**Findings:** none blocking pilot  
**Tester:** agent / CI  
**Accepted for G2:** Yes
