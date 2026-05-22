# Problem registry — troubles, root cause, fixes

Searchable index for **problem sourcing**. Link every entry to `DEVELOPMENT_LOG.md` and `BUILD_KNOWLEDGE.md`.

**Statuses:** `open` | `investigating` | `resolved` | `wont_fix`

---

## How to add (AI mandatory on blockers)

```markdown
### PRB-NNN — Short title

| Field | Value |
|-------|-------|
| **Status** | open |
| **Phase** | P0–P10 |
| **Area** | db \| auth \| rls \| ui \| ai \| test \| ci \| integration |
| **Severity** | S1–S4 (see BUG_TRIAGE.md) |
| **First seen** | LOG-YYYY-MM-DD-NN |
| **Resolved** | — |
| **LEARN** | LEARN-NNN or — |

**Symptom:** What the user/agent saw.

**Repro:** Minimal steps.

**Root cause:** After investigation (or hypothesis if open).

**Fix:** What worked (fill when resolved).

**Prevention:** Test ID or LEARN added.

**Related tasks:** TASK-Px-xxx
```

When resolved, set **Status** `resolved` and add **Prevention** test or LEARN.

---

## Index

| ID | Title | Status | Area | Phase |
|----|-------|--------|------|-------|
| PRB-001 | Remote migrations not applied | resolved | db | P1 |
| — | _No runtime problems yet — pre-build_ | — | — | — |

---

## Entries

<!-- Append new problems below -->

### PRB-001 — Remote Supabase migrations not applied

| Field | Value |
|-------|-------|
| **Status** | resolved |
| **Phase** | P1 |
| **Area** | db |
| **Severity** | S2 |
| **First seen** | LOG-2025-05-21-07 |
| **Resolved** | LOG-2025-05-21-08 |
| **LEARN** | LEARN-005 |

**Symptom:** Integration tests fail with `Could not find the table 'public.organization_members' in the schema cache`.

**Repro:** Run `npm run test:integration` with `.env.local` Supabase keys but no applied migrations.

**Root cause:** MVP SQL migrations (`001`–`006`) existed in repo but were never pushed to the linked Supabase project.

**Fix:** Applied migrations 001–005 via Supabase MCP `apply_migration`; triggers from 006 via `execute_sql`.

**Prevention:** Document in README + `.env.example`; integration tests skip when schema missing.

**Related tasks:** TASK-P1-001

### PRB-000 — Template reference (do not delete)

| Field | Value |
|-------|-------|
| **Status** | resolved |
| **Phase** | Planning |
| **Area** | docs |
| **Severity** | S4 |
| **First seen** | LOG-2025-05-21-01 |
| **Resolved** | LOG-2025-05-21-03 |
| **LEARN** | LEARN-001 |

**Symptom:** Doc contradictions (`closed` vs `archived`, board name).

**Repro:** N/A — audit.

**Root cause:** Parallel doc authoring without single canonical pipeline key.

**Fix:** Unified `archived`; migrations 001–006; audit doc updated.

**Prevention:** AGENTS.md + DEFAULT_PIPELINE as canonical; REPO_COMPLETENESS_AUDIT.

**Related tasks:** —

---

<!-- Append new PRB entries above PRB-000 template -->
