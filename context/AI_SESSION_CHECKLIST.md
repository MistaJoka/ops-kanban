# AI Session Checklist

Use this checklist at the start and end of each Cursor or AI-assisted coding session.

## Start of session

Read, in order:

1. `context/START_HERE.md`
2. `context/DECISIONS_LOCKED.md`
3. `context/BUILD_NEXT.md`
4. `context/DO_NOT_BREAK.md`
5. `AGENTS.md`
6. `docs/roadmap/DOC_INDEX.md`
7. `docs/roadmap/PROGRESS.md`
8. `docs/roadmap/PHASE_TASKS.md`

## Select one task

Before touching code, write down:

```txt
Task ID:
Phase:
Goal:
Canonical docs:
Files likely affected:
Test/check to run:
Risk:
```

## During session

Stay inside the task.

Good behavior:

- Reuse existing types, constants, and domain functions.
- Prefer small changes.
- Keep UI and business logic separated where possible.
- Check existing docs before creating new docs.
- Update only the docs affected by the change.

Bad behavior:

- Starting multiple tasks.
- Creating a new roadmap.
- Creating parallel schema docs.
- Adding fake production data.
- Burying business logic inside components.
- Changing product direction without recording the decision.

## End of session

Before calling the task complete:

- Relevant tests/checks ran or limitation is documented.
- `docs/roadmap/DEVELOPMENT_LOG.md` has a new entry.
- `docs/roadmap/PROGRESS.md` reflects the current state.
- `docs/roadmap/PHASE_TASKS.md` task status is updated.
- `docs/roadmap/PROBLEM_REGISTRY.md` has a `PRB-*` item if blocked.
- `docs/roadmap/BUILD_KNOWLEDGE.md` has a `LEARN-*` item if a reusable pattern was found.

## Final response format for Cursor

```txt
Changed:
- ...

Verified:
- ...

Docs updated:
- ...

Next:
- ...

Risk/notes:
- ...
```

## Primitive compression

```txt
Read.
Pick one task.
Change small.
Test.
Log.
Stop.
```
