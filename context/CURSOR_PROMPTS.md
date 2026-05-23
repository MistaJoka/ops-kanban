# Cursor Prompts

Ready-to-paste prompts for working inside this repo.

Use these with `context/START_HERE.md`, `AGENTS.md`, and `docs/roadmap/DOC_INDEX.md`.

## 1. Start session

```txt
Read context/START_HERE.md first.
Then read AGENTS.md, docs/roadmap/DOC_INDEX.md, docs/roadmap/PROGRESS.md, and docs/roadmap/PHASE_TASKS.md.

Summarize:
- active phase
- next best TASK-Px-xxx
- canonical docs for that task
- files likely affected
- proof command/check

Do not edit files yet.
```

## 2. Execute one task

```txt
Work on this task only: TASK-Px-xxx.

Before editing:
- inspect existing code and docs
- identify the smallest safe change
- reuse existing types/constants/functions
- avoid duplicate roadmaps, schemas, or product plans

After editing:
- run the smallest relevant proof
- update DEVELOPMENT_LOG.md, PROGRESS.md, and PHASE_TASKS.md
- report changed files, verification, docs updated, and next step
```

## 3. Bug fix mode

```txt
Investigate this bug without changing code first:
[describe bug]

Return:
- likely root cause
- files inspected
- exact fix plan
- risk level
- proof command/check

Then wait for approval before editing.
```

## 4. Refactor mode

```txt
Refactor only the minimum needed area.

Rules:
- no product behavior changes unless required
- no broad rewrites
- keep public interfaces stable unless the task requires change
- preserve existing tests
- update docs only if architecture or behavior changed

Return a before/after summary and proof command/check.
```

## 5. UI polish mode

```txt
Improve the UI for this specific area only:
[area]

Product constraints:
- mobile-first
- fast field use
- card remains source of truth
- board remains primary workspace
- clear for non-technical operator
- industrial/modern feel without clutter

Do not change data flow unless required.
```

## 6. AI feature mode

```txt
Implement this AI capability:
[capability]

Rules:
- follow docs/ai/ and docs/api/APPROVAL_FLOW.md
- AI must not create hidden side effects
- business-record changes should be reviewable or reversible
- use existing tool/action patterns where possible
- update AI docs if behavior or tool contracts change

Return the action path, safety checks, and proof command/check.
```

## 7. End-session audit

```txt
Audit this session before calling it complete.

Check:
- one task only
- no duplicate truth created
- product direction preserved
- tests/checks run or limitation documented
- DEVELOPMENT_LOG.md updated
- PROGRESS.md updated
- PHASE_TASKS.md updated
- PRB-* added if blocked
- LEARN-* added if reusable pattern found

Return pass/fail with fixes needed.
```

## Primitive compression

```txt
Start clean.
Pick one task.
Patch small.
Prove it.
Log it.
Stop.
```
