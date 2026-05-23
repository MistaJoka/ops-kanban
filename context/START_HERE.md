# Start Here

This is the first file to read before using Cursor or another AI coding agent on `ops-kanban`.

The goal is fast orientation, not full documentation.

## One-screen briefing

```txt
Product: AI-first operations Kanban for a landscaping SMB.
Workspace: one universal Job Pipeline board.
Truth: each card is the full operational record for a job.
AI role: operational copilot, not hidden autopilot.
Canonical docs: AGENTS.md + docs/roadmap/DOC_INDEX.md.
```

## Read order

1. `context/README.md`
2. `context/PROJECT_NORTH_STAR.md`
3. `context/CURRENT_STATE.md`
4. `context/DECISIONS_LOCKED.md`
5. `context/BUILD_NEXT.md`
6. `context/AI_SESSION_CHECKLIST.md`
7. `context/QUALITY_GATE.md`
8. `context/DO_NOT_BREAK.md`
9. `AGENTS.md`
10. `docs/roadmap/DOC_INDEX.md`
11. `docs/roadmap/PROGRESS.md`
12. `docs/roadmap/PHASE_TASKS.md`

## Mental model

```txt
Business = landscaping operation
Board = job pipeline
Column = job state
Card = source of truth
AI = office + field copilot
Docs = canonical library
Context = mission briefing
```

## Before coding

Answer these:

- What phase/task is active in `docs/roadmap/PROGRESS.md`?
- Which `TASK-Px-xxx` from `docs/roadmap/PHASE_TASKS.md` is being worked?
- Which canonical doc controls this area?
- Which existing code or type should be reused?
- What is the smallest safe change?
- Which test/check proves the change works?

## Cursor session starter

```txt
Read context/START_HERE.md first.
Then follow AGENTS.md and docs/roadmap/DOC_INDEX.md.
Use context/ as mission briefing only.
Use docs/ as canonical truth.
Pick one task from docs/roadmap/PHASE_TASKS.md.
Make the smallest safe change.
Do not create duplicate roadmaps, schemas, or task systems.
End by updating the required progress/log docs.
```

## Done means

```txt
Code works.
Tests/checks run.
Docs updated.
Progress recorded.
No duplicate truth created.
```
