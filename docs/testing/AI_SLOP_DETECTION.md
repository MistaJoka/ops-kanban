# AI slop detection (T22)

**Purpose:** Turn probabilistic AI output into deterministic software quality.  
**Run alone:** Before PR merge, after any multi-file AI session, or when reviewing agent diffs.  
**Couples:** [`ARCHITECTURE_PRINCIPLES.md`](../roadmap/ARCHITECTURE_PRINCIPLES.md), [`NO_MOCK_DATA_POLICY.md`](../product/NO_MOCK_DATA_POLICY.md), [`RELEASE_GATES.md`](./RELEASE_GATES.md) G0, [`AI_SLOP_BASELINE_AUDIT.md`](../roadmap/AI_SLOP_BASELINE_AUDIT.md)

---

## Five layers (OpsBoard oracles)

| Layer        | Detects                        | OpsBoard oracle                                                                    |
| ------------ | ------------------------------ | ---------------------------------------------------------------------------------- |
| 1 Visual     | Fake UI, inconsistent spacing  | `UI_MASTER_FORMULA.md`, `DESIGN_TOKENS.md`, EXP-VIS-01, `npm run check:css-health` |
| 2 Functional | Broken flows, fake persistence | `E2E-JOB-*`, `E2E-SYNC-*`, `AI-TOOL-*`, NO_MOCK §8 V1–V7                           |
| 3 Structural | Architectural decay            | `lib/domain/*`, `check:slop-health`, file budgets                                  |
| 4 Automated  | Silent type/logic rot          | `typecheck`, `lint`, `test:unit`, `format:check`, `check:slop`                     |
| 5 Historical | Slow corruption                | Baseline audit, drift ritual (protocol §1b)                                        |

---

## Layer 1 — Visual slop

**Question:** Does this LOOK coherent? (Not: does it look cool?)

| Symptom                     | Usually means          | Check                                 |
| --------------------------- | ---------------------- | ------------------------------------- |
| Random spacing / font sizes | No design system       | `DESIGN_TOKENS.md` spacing scale      |
| Too many buttons per card   | AI over-added features | `CARD_DESIGN.md` board card chrome    |
| Empty states unfinished     | Guessed copy           | Real empty states only (no fake jobs) |
| Modern UI, weak workflow    | Frontend theater       | EXP-04 landscaping realism            |

**Commands:** `npm run check:css-health` (after `dev:clean` if CSS 404)  
**Charter:** EXP-VIS-01 in `EXPLORATORY_CHARTERS.md` (15 min pipeline pass)

---

## Layer 2 — Functional slop

| Signal                      | Meaning                     | Test ID                                |
| --------------------------- | --------------------------- | -------------------------------------- |
| Refresh loses data          | Fake state / no persistence | `E2E-SYNC-*`, NO_MOCK V4               |
| Success toast, no DB change | Fake optimistic UI          | `UNIT-SYNC-*`, integration card routes |
| Spinner forever             | Unresolved async            | Manual + console                       |
| Works once only             | Race condition              | EXP-01 pipeline chaos                  |
| AI “executed” without row   | Stub executor               | `check:no-mock`, `AI-TOOL-*`           |

**User flow audit (manual or E2E):**

```txt
create → edit → delete/archive → undo where supported
→ refresh safely → mobile tap targets → error recovery
```

---

## Layer 3 — Structural slop

**Professional metric:** Can a new developer understand the repo in 30 minutes?

| Problem                                   | Cause                   | Rule                                            |
| ----------------------------------------- | ----------------------- | ----------------------------------------------- |
| Multiple Card\* components doing same job | AI duplication          | One board card: `BoardCard.tsx` + primitives    |
| Files >600 lines (non-allowlisted)        | Uncontrolled generation | Split before merge; see baseline audit          |
| Business logic in giant hooks             | Context drift           | Rules in `lib/domain/*`; hooks orchestrate only |
| `components/` importing Supabase client   | Layer violation         | Fetch `/api/*` only; domain in routes           |
| Settings pages with inline validation     | UI slop                 | Prefer shared hooks + existing API routes       |

**Command:** `npm run check:slop-health`

---

## Layer 4 — Automated hardening

| Tool              | Command                     | Blocks                              |
| ----------------- | --------------------------- | ----------------------------------- |
| TypeScript strict | `npm run typecheck`         | Type rot                            |
| ESLint            | `npm run lint`              | Bad patterns, unused vars           |
| Prettier          | `npm run format:check`      | Format chaos                        |
| No mock           | `npm run check:no-mock`     | Sample data in prod paths           |
| Slop health       | `npm run check:slop-health` | Mega-files, boundary violations     |
| Unit              | `npm run test:unit`         | Domain logic                        |
| E2E smoke         | `npm run test:e2e:smoke`    | Critical paths (needs Supabase env) |

**PR bundle:** `npm run check:slop` (= slop-health + no-mock + format:check)

---

## Layer 5 — Historical drift

Every **10 LOG entries** or **monthly**, run:

1. `npm run check:slop-health`
2. Read [`AI_SLOP_BASELINE_AUDIT.md`](../roadmap/AI_SLOP_BASELINE_AUDIT.md)
3. Ask: _Would we build the Kanban board / card mutation layer this way today?_
4. If no → add PRB-SLOP-\* or TASK for split; shrink allowlist in `scripts/check-slop-health.mjs`

---

## Suspicion scan (mandatory after AI edits)

Before marking a session done, answer honestly:

```txt
1. Why was each touched file changed?
2. Was each change necessary?
3. Did logic duplicate something existing?
4. Is this already solved elsewhere in lib/domain or API routes?
5. Did complexity increase without product ask?
6. Can this break silently (no test)?
7. Is this reversible in one revert?
8. Is this tested or covered by check:slop?
9. Does this align with ARCHITECTURE_PRINCIPLES layering?
10. Would a senior engineer approve this diff?
```

If any answer is “no” or “unsure” → fix, test, or register PRB before `done`.

---

## CI mapping

| Job            | Slop checks                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `verify`       | `check:slop-health`, `format:check`, `check:no-mock`, lint, typecheck, unit |
| `e2e` / `a11y` | Layer 2 (when secrets present)                                              |

---

## Traceability

| Requirement | Doc                                               |
| ----------- | ------------------------------------------------- |
| REQ-SLOP-01 | Five-layer detection (this file)                  |
| REQ-SLOP-02 | Automated gates (`scripts/check-slop-health.mjs`) |
| REQ-SLOP-03 | Agent suspicion loop (`AI_BUILD_PROTOCOL.md` §1)  |
