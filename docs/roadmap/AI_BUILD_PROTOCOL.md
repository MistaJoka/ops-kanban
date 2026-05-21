# AI build protocol — phases, progress, reinforced learning

**Mandatory for every AI/agent build session.** Humans may follow the same protocol.

Companion files (update every session):

| File | Purpose |
|------|---------|
| [`PROGRESS.md`](./PROGRESS.md) | Live status — **read first, update last** |
| [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md) | Chronological session entries |
| [`PROBLEM_REGISTRY.md`](./PROBLEM_REGISTRY.md) | Troubles → root cause → fix (searchable) |
| [`BUILD_KNOWLEDGE.md`](./BUILD_KNOWLEDGE.md) | Durable patterns for future agents |
| [`PHASE_TASKS.md`](./PHASE_TASKS.md) | Task statuses `todo` → `doing` → `done` |

---

## 1. Session loop (every run)

```txt
START
  1. Read PROGRESS.md
  2. Read open items in PROBLEM_REGISTRY.md
  3. Scan BUILD_KNOWLEDGE.md (section for current phase)
  4. Pick ONE task from PHASE_TASKS.md (or continue `doing`)
  5. Set task status → doing in PHASE_TASKS + PROGRESS.md

WORK
  6. Implement per task spec + linked product docs
  7. Run tests listed on task row
  8. If blocked → PROBLEM_REGISTRY + LOG type blocked (stop or parallelize)

END (required — do not skip)
  9.  Append DEVELOPMENT_LOG entry
  10. Update PROGRESS.md (dashboard + metrics)
  11. If trouble found/fixed → PROBLEM_REGISTRY row
  12. If reusable insight → BUILD_KNOWLEDGE entry
  13. Set task status → done (or doing/blocked) in PHASE_TASKS.md
  14. If phase DoD complete → phase dashboard + LOG type complete
```

**Rule:** No silent merges. If code changed, a LOG entry exists.

---

## 2. AI phases (what to do when)

### Phase 0 — Scaffold

| Step | Action |
|------|--------|
| Read | `ARCHITECTURE_PRINCIPLES.md`, `DESIGN_TOKENS.md` |
| Build | Next.js, folders, Vitest, Playwright, CI, copy `src-starter` → `lib/ai` |
| Log | Tooling versions pinned in LOG |
| Learn | Document path aliases, env layout in BUILD_KNOWLEDGE § Tooling |

**Exit:** DONE-0 + first LEARN entries for repo layout.

---

### Phase 1 — Foundation

| Step | Action |
|------|--------|
| Read | `SIGNUP_BOOTSTRAP.md`, `MVP_SCHEMA.md`, migrations `001`–`006` |
| Build | Auth, bootstrap (9 columns, **zero cards**), RLS verified |
| Test | `SEC-RLS-*`, `INT-BOOT-001`, `E2E-BOOT-001` |
| Log | RLS waiver notes if any policy deferred |
| Learn | Supabase auth + RLS patterns → BUILD_KNOWLEDGE § Database |

**Exit:** DONE-1. Register any RLS gotchas in PROBLEM_REGISTRY.

---

### Phase 2 — Workspace + pipeline

| Step | Action |
|------|--------|
| Read | `WORKSPACE_DESIGN.md`, `CARD_DESIGN.md` (board card only), `DEFAULT_PIPELINE.md` |
| Build | Shell, `/pipeline`, Kanban, move validation, activity log |
| Test | `E2E-JOB-*`, `UNIT-PIPE-*` |
| Learn | DnD + optimistic rollback → BUILD_KNOWLEDGE § Frontend |

**Exit:** DONE-2. Manual path inquiry → archived without AI.

---

### Phase 3 — Deep card

| Step | Action |
|------|--------|
| Read | `CARD_DESIGN.md` (panel + tabs) |
| Build | Slide-over, tabs, customer, scope, checklist_json |
| Test | `E2E-JOB-003`, `MOB-001`, move validation modals |
| Learn | Panel state URL vs local state |

**Exit:** DONE-3.

---

### Phase 4 — Money

| Step | Action |
|------|--------|
| Read | `API_ROUTES.md` money section |
| Build | `lib/domain/money/*`, estimate + invoice + mark paid → `archived` |
| Test | `UNIT-MNY-*`, `E2E-MNY-*`, FMEA F-04 gates |
| Learn | Money precision, quote gate |

**Exit:** DONE-4.

---

### Phase 5 — AI copilot

| Step | Action |
|------|--------|
| Read | `AI_UTILIZATION.md`, `APPROVAL_FLOW.md`, `AI_TEST_PACK.md` |
| Build | Context loader, tool loop, approval API, executors → domain |
| Test | `AI-TOOL-*`, `AI-INJ-*`, `E2E-AI-*` |
| Learn | Gemini tool calling, approval UX → BUILD_KNOWLEDGE § AI |

**Exit:** DONE-5. Remove executor throw stub; wire persistence.

---

### Phase 6 — MVP release

| Step | Action |
|------|--------|
| Read | `RELEASE_GATES.md` G2, `NO_MOCK_DATA_POLICY.md` §8 |
| Run | Full regression + UAT + `npm run check:no-mock` |
| Log | `release` entry + CHANGELOG v0.1.0 |
| Learn | Release checklist → BUILD_KNOWLEDGE § Release |

**Exit:** DONE-6 → MVP SHIPPED.

---

### Phases 7–10 — Platform waves

Follow `PLATFORM_CAPABILITIES.md` wave. Each wave:

1. Add PROBLEM_REGISTRY prefix `W1-`, `W2-`, etc.
2. Webhook tests before enabling prod keys
3. LOG + LEARN for integration adapter patterns

---

## 3. Progress updates (`PROGRESS.md`)

Update **at start and end** of every session:

- `current_phase`, `current_task`, `session_agent_id` (optional)
- `last_updated` ISO timestamp
- `phase_completion` % estimate for active phase
- `blockers` list (PRB-ids)
- `recent_completions` (last 5 tasks)
- `next_recommended_tasks` (1–3 ids)

---

## 4. Trouble & fix (`PROBLEM_REGISTRY.md`)

When anything blocks or wastes >15 min:

1. Add **PRB-NNN** with `status: open`
2. Log symptom, repro, hypothesis, attempted fixes
3. On resolve: `status: resolved`, `fix_summary`, link **LEARN-NNN**, link tests added

**Problem sourcing:** Before fixing, search PROBLEM_REGISTRY + BUILD_KNOWLEDGE for matching symptoms.

---

## 5. Reinforced learning (`BUILD_KNOWLEDGE.md`)

When a fix or pattern will help **future agents**:

Add **LEARN-NNN**:

- **When** (trigger/context)
- **Problem** (1 line)
- **Solution** (actionable steps)
- **Verify** (test or command)
- **Refs** (PRB-, LOG-, file paths)

Promote LEARN entries when seen twice in PROBLEM_REGISTRY.

---

## 6. Development log (enhanced)

Use extended template in `DEVELOPMENT_LOG.md` § Enhanced entry.

Required fields for `complete` and `fix` types:

- **Troubles** (if any)
- **Fix** (what changed)
- **Learning** (LEARN- id or "none new")
- **Problems** (PRB- ids touched)

---

## 7. Reinforcement rules

| Situation | Action |
|-----------|--------|
| Same error twice | LEARN + test |
| Deferred work | LOG `decision` + PROGRESS blocker |
| Scope change | LOG `scope` + update MVP_CAPTURE |
| Test flaky | PRB + quarantine tag in REGRESSION_MATRIX |
| AI repeated bad approach | LEARN in BUILD_KNOWLEDGE § Agent discipline |

---

## 8. Cursor / agent prompt snippet

Paste at session start:

```txt
Follow docs/roadmap/AI_BUILD_PROTOCOL.md.
Read PROGRESS.md and open PROBLEM_REGISTRY items.
Execute one TASK-Px-xxx; end with LOG + PROGRESS + LEARN/PRB as needed.
Do not skip post-session updates.
```

---

## 9. Phase ↔ file checklist

| Phase done | Update |
|------------|--------|
| Any task | PHASE_TASKS, PROGRESS, LOG |
| Trouble | PRB |
| Reusable fix | LEARN |
| Phase complete | Phase dashboard in LOG + PROGRESS phase % |
