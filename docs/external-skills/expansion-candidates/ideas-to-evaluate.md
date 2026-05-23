# Ideas to evaluate

Candidate patterns awaiting audit against [`AGENTS.md`](../../AGENTS.md) and canonical docs.

## Evaluation template

```txt
Idea:
Source:
Proposed distilled target:
Conflict check (AGENTS / NO_MOCK / UI_MASTER / AI_BUILD):
Decision: adopt | defer | reject
Notes:
```

---

## Queue

### Mandatory skill read before every response

- **Source:** `superpowers-using-superpowers`
- **Proposed target:** `superpowers-workflow.md`
- **Conflict check:** Cursor uses rules + AGENTS.md; skill tool not universal in Cursor agent
- **Decision:** defer
- **Notes:** Revisit if Cursor skill invocation becomes first-class in agent loop

### Universal TDD on all fixes

- **Source:** `superpowers-tdd`
- **Proposed target:** `superpowers-workflow.md`
- **Conflict check:** PHASE_TASKS row specifies test scope per task
- **Decision:** defer
- **Notes:** Adopt per-task, not globally

### Distinctive non-token fonts for marketing pages

- **Source:** `anthropic-frontend-design`
- **Proposed target:** `frontend-design.md`
- **Conflict check:** DESIGN_TOKENS governs app UI; marketing may differ post-MVP
- **Decision:** defer
- **Notes:** MVP workspace UI stays token-driven
