# Development log

Chronological record of build progress, decisions, blockers, troubles, fixes, and releases.  
**Append new entries at the top** (newest first).

**AI agents:** Follow [`AI_BUILD_PROTOCOL.md`](./AI_BUILD_PROTOCOL.md) — every session updates this file, [`PROGRESS.md`](./PROGRESS.md), and (when applicable) [`PROBLEM_REGISTRY.md`](./PROBLEM_REGISTRY.md) + [`BUILD_KNOWLEDGE.md`](./BUILD_KNOWLEDGE.md).

---

## How to write an entry

```markdown
### LOG-YYYY-MM-DD-NN — Short title

| Field | Value |
|-------|-------|
| **Phase** | P0–P10 |
| **Tasks** | TASK-Px-xxx, … |
| **Author** | name / agent |
| **Type** | progress \| complete \| blocked \| decision \| scope \| release \| incident \| fix |

**Summary:** 1–3 sentences.

**Progress:** What moved forward (files, features, % if known).

**Troubles:** Symptom + context, or "none". Link PRB-NNN if registered.

**Fix:** What resolved the trouble, or "n/a".

**Learning:** LEARN-NNN added/updated, or "none new".

**Changes:**
- bullet

**Tests run:** TEST-IDs or "none"

**DoD:** DONE-N items satisfied (or waiver ref)

**Next:** next task(s)
```

**Types:**

- `progress` — partial work
- `complete` — task(s) or phase done
- `blocked` — waiting on decision/deps
- `decision` — architecture/product choice
- `scope` — MVP capture change (update `MVP_CAPTURE.md`)
- `release` — version tagged
- `incident` — bug/outage post-mortem
- `fix` — trouble resolved (pair with PRB + LEARN when reusable)

---

## Phase status dashboard

| Phase | Name | Status | Started | Completed | DoD |
|-------|------|--------|---------|-----------|-----|
| P0 | Scaffold | `not_started` | — | — | DONE-0 |
| P1 | Foundation | `not_started` | — | — | DONE-1 |
| P2 | Workspace | `not_started` | — | — | DONE-2 |
| P3 | Deep card | `not_started` | — | — | DONE-3 |
| P4 | Money | `not_started` | — | — | DONE-4 |
| P5 | AI | `not_started` | — | — | DONE-5 |
| P6 | MVP release | `not_started` | — | — | DONE-6 |
| P7 | Wave 1 | `not_started` | — | — | DONE-7 |
| P8 | Wave 2 | `not_started` | — | — | DONE-8 |
| P9 | Wave 3 | `not_started` | — | — | DONE-9 |
| P10 | Wave 4 | `not_started` | — | — | DONE-10 |

Update this table when a phase starts or completes. Mirror status in [`PROGRESS.md`](./PROGRESS.md).

---

## Entries

### LOG-2025-05-21-04 — AI build protocol + reinforced learning loop

| Field | Value |
|-------|-------|
| **Phase** | Planning |
| **Tasks** | — |
| **Author** | planning session |
| **Type** | decision |

**Summary:** Added AI-facing build protocol so agents read/update progress, register troubles (PRB), and capture durable fixes (LEARN) every session.

**Progress:** New docs `AI_BUILD_PROTOCOL.md`, `PROGRESS.md`, `PROBLEM_REGISTRY.md`, `BUILD_KNOWLEDGE.md`; enhanced LOG template; AGENTS.md and roadmap index updated.

**Troubles:** none

**Fix:** n/a

**Learning:** LEARN-001–003 seeded from pre-build audit decisions.

**Changes:**
- Session loop: read PROGRESS → work one task → LOG + PROGRESS + PRB/LEARN
- Per-phase AI checklists (P0–P10)
- Problem sourcing via PROBLEM_REGISTRY search before debug

**Tests run:** none

**DoD:** N/A

**Next:** TASK-P0-001

---

### LOG-2025-05-21-03 — Audit fixes: archived pipeline + missing artifacts

| Field | Value |
|-------|-------|
| **Phase** | Planning |
| **Tasks** | — |
| **Author** | planning session |
| **Type** | decision |

**Summary:** Unified terminal column on `archived`. Fixed doc contradictions. Added migrations 002–006 (auth FK, card extensions, RLS, indexes, triggers), API_ROUTES, APPROVAL_FLOW, DESIGN_TOKENS, MINIMAL_DASHBOARD, AGENTS.md, domain README, check-no-mock script, legal stubs, assignCard tool, createCard medium risk.

**Changes:** See `REPO_COMPLETENESS_AUDIT.md` §3.

**Tests run:** none

**Next:** TASK-P0-001

---

### LOG-2025-05-21-02 — No mock data policy confirmed (pre-build)

| Field | Value |
|-------|-------|
| **Phase** | Planning |
| **Tasks** | — |
| **Author** | planning session |
| **Type** | decision |

**Summary:** Confirmed MVP has no mock production data requirement. Added `NO_MOCK_DATA_POLICY.md`, release gate checks, DoD G8, PRE_BUILD_CONFIRMATION. Starter `tool-executor` now throws until Phase 5 wires domain services.

**Changes:**
- Policy doc + audit of blueprint contradictions
- MVP_SCOPE, CARD_DESIGN, RELEASE_GATES aligned
- TASK-P6-011 CI no-mock verification

**Tests run:** none

**DoD:** N/A

**Next:** TASK-P0-001

---

### LOG-2025-05-21-01 — Roadmap and QA pack finalized (pre-build)

| Field | Value |
|-------|-------|
| **Phase** | Planning |
| **Tasks** | — |
| **Author** | planning session |
| **Type** | decision |

**Summary:** MVP captured in `MVP_CAPTURE.md`. Development roadmap, phase tasks (P0–P10), definitions of done, architecture principles, and modular QA pack (`docs/testing/`) are ready before implementation.

**Changes:**
- Added `docs/roadmap/*` (this log, tasks, DoD, principles)
- Product/design/AI/integration docs aligned to landscaping vertical
- Testing pack with FMEA, RBT, STRIDE, regression matrix

**Tests run:** none (documentation only)

**DoD:** N/A — pre-build

**Next:** TASK-P0-001 Create Next.js app

---

<!-- Append new entries above this line -->
