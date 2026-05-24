# Problem registry — troubles, root cause, fixes

Searchable index for **problem sourcing**. Link every entry to `DEVELOPMENT_LOG.md` and `BUILD_KNOWLEDGE.md`.

**Statuses:** `open` | `investigating` | `resolved` | `wont_fix`

---

## How to add (AI mandatory on blockers)

```markdown
### PRB-NNN — Short title

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| **Status**     | open                                                       |
| **Phase**      | P0–P10                                                     |
| **Area**       | db \| auth \| rls \| ui \| ai \| test \| ci \| integration |
| **Severity**   | S1–S4 (see BUG_TRIAGE.md)                                  |
| **First seen** | LOG-YYYY-MM-DD-NN                                          |
| **Resolved**   | —                                                          |
| **LEARN**      | LEARN-NNN or —                                             |

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

| ID           | Title                             | Status   | Area | Phase |
| ------------ | --------------------------------- | -------- | ---- | ----- |
| PRB-001      | Remote migrations not applied     | resolved | db   | P1    |
| PRB-SLOP-001 | KanbanBoard god component         | resolved | ui   | P14   |
| PRB-SLOP-002 | useCardMutations mega-hook        | resolved | ui   | P14   |
| PRB-SLOP-003 | useBoardState orchestration bloat | resolved | ui   | P14   |
| PRB-SLOP-004 | toolCalls.ts size                 | resolved | ai   | P14   |

---

## Entries

<!-- Append new problems below -->

### PRB-SLOP-001 — KanbanBoard god component

| Field          | Value             |
| -------------- | ----------------- |
| **Status**     | resolved          |
| **Phase**      | P14               |
| **Area**       | ui                |
| **Severity**   | S3                |
| **First seen** | LOG-2026-05-23-02 |
| **Resolved**   | LOG-2026-05-23-02 |
| **LEARN**      | LEARN-019         |

**Symptom:** Single 1097-line file mixed DnD, AI chrome, modals, and board state.

**Fix:** Split to `kanban-board/*` + `useKanbanBoardController`; `KanbanBoard.tsx` now ~156 lines.

**Prevention:** `npm run check:slop-health`; suspicion scan in AI_BUILD_PROTOCOL.

### PRB-SLOP-002 — useCardMutations mega-hook

| Field          | Value             |
| -------------- | ----------------- |
| **Status**     | resolved          |
| **Phase**      | P14               |
| **Area**       | ui                |
| **Severity**   | S3                |
| **First seen** | LOG-2026-05-23-02 |
| **Resolved**   | LOG-2026-05-23-02 |
| **LEARN**      | LEARN-019         |

**Symptom:** 1079-line hook mixing field, money, and AI flows.

**Fix:** `useCardMoneyMutations.ts` + slim `useCardMutations.ts` composer.

**Prevention:** `check:slop-health` line budget; domain money stays in API/domain.

### PRB-SLOP-003 — useBoardState orchestration bloat

| Field        | Value |
| ------------ | ----- |
| **Status**   | resolved |
| **Phase**    | P14   |
| **Area**     | ui    |
| **Severity** | S4    |
| **Resolved** | LOG-2026-05-24-01 |
| **LEARN**    | LEARN-019 |

**Symptom:** 740-line hook mirrors domain mutation kinds.

**Fix:** Extracted `sync/useBoardMutations.ts` + `createReapplyFailedMutation`; composer ≤400 lines.

**Prevention:** `check:slop-health`; allowlist entry removed.

### PRB-SLOP-004 — toolCalls.ts size

| Field        | Value |
| ------------ | ----- |
| **Status**   | resolved |
| **Phase**    | P14   |
| **Area**     | ai    |
| **Severity** | S4    |
| **Resolved** | LOG-2026-05-24-01 |
| **LEARN**    | LEARN-019 |

**Symptom:** 840-line domain module.

**Fix:** Split to `lib/domain/ai/tools/*` category modules; thin dispatcher in `toolCalls.ts`.

**Prevention:** Allowlist empty; `check:slop-health` passes with zero grandfathered files.

### PRB-001 — Remote Supabase migrations not applied

| Field          | Value             |
| -------------- | ----------------- |
| **Status**     | resolved          |
| **Phase**      | P1                |
| **Area**       | db                |
| **Severity**   | S2                |
| **First seen** | LOG-2025-05-21-07 |
| **Resolved**   | LOG-2025-05-21-08 |
| **LEARN**      | LEARN-005         |

**Symptom:** Integration tests fail with `Could not find the table 'public.organization_members' in the schema cache`.

**Repro:** Run `npm run test:integration` with `.env.local` Supabase keys but no applied migrations.

**Root cause:** MVP SQL migrations (`001`–`006`) existed in repo but were never pushed to the linked Supabase project.

**Fix:** Applied migrations 001–005 via Supabase MCP `apply_migration`; triggers from 006 via `execute_sql`.

**Prevention:** Document in README + `.env.example`; integration tests skip when schema missing.

**Related tasks:** TASK-P1-001

### PRB-000 — Template reference (do not delete)

| Field          | Value             |
| -------------- | ----------------- |
| **Status**     | resolved          |
| **Phase**      | Planning          |
| **Area**       | docs              |
| **Severity**   | S4                |
| **First seen** | LOG-2025-05-21-01 |
| **Resolved**   | LOG-2025-05-21-03 |
| **LEARN**      | LEARN-001         |

**Symptom:** Doc contradictions (`closed` vs `archived`, board name).

**Repro:** N/A — audit.

**Root cause:** Parallel doc authoring without single canonical pipeline key.

**Fix:** Unified `archived`; migrations 001–006; audit doc updated.

**Prevention:** AGENTS.md + DEFAULT_PIPELINE as canonical; REPO_COMPLETENESS_AUDIT.

**Related tasks:** —

---

<!-- Append new PRB entries above PRB-000 template -->
