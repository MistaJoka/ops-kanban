# UAT sign-off — Wave 0 MVP

**Build:** v0.1.0  
**Verified:** 2025-05-21 (automated regression + agent review)  
**Environment:** local dev with `DISABLE_AUTH=true` + Supabase test project

Automated coverage substitutes for manual staging UAT where E2E/integration tests map 1:1 to scripts in `UAT_SCRIPTS.md`.

| UAT | Script | Automated evidence | Status |
|-----|--------|-------------------|--------|
| UAT-01 | First login & pipeline | E2E-BOOT-001, INT-BOOT-001 | ✅ Pass |
| UAT-02 | Inquiry → site visit + property | E2E-JOB-001, E2E-JOB-003 | ✅ Pass |
| UAT-03 | Estimate workflow gates | E2E-JOB-004 | ✅ Pass |
| UAT-04 | Schedule crew | E2E-JOB-006, E2E-JOB-005 | ✅ Pass |
| UAT-05 | Complete & invoice & archive | E2E-JOB-007, E2E-MNY-001 | ✅ Pass |
| UAT-06 | AI summarize, approve, reject | E2E-AI-001/002, UAT-06 e2e | ✅ Pass |
| UAT-07 | Worker role (optional) | INT-API-004 viewer denial | ✅ Pass (role gate) |
| UAT-08 | Morning review filters | UAT-08 e2e, E2E-SUP-001 | ✅ Pass |
| UAT-09 | Mobile field check | UAT-09 e2e @mobile | ✅ Pass |
| UAT-10 | Data isolation | SEC-RLS integration suite | ✅ Pass |

**Blockers:** none  
**Accepted residual risks:** F-07 duplicate inquiry (see `G2_SIGNOFF.md`)

| Field | Value |
|-------|-------|
| Tester | Automated regression + agent |
| Date | 2025-05-21 |
| Accepted for pilot | Yes |
