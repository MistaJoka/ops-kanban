# Task Packet Template

Use this to package one unit of work for Cursor.

Do not use this as a replacement for `docs/roadmap/PHASE_TASKS.md`.

## Blank packet

```md
# Task Packet — TASK-Px-xxx

## Task

TASK-Px-xxx — [task name]

## Goal

[What should be true when this is done?]

## User-visible outcome

[What will the user notice?]

## Canonical docs

- `docs/roadmap/PHASE_TASKS.md`
- `docs/roadmap/DEFINITION_OF_DONE.md`
- [area-specific doc]

## Files to inspect first

- [file/path]
- [file/path]

## Files likely changed

- [file/path]
- [file/path]

## Constraints

- Keep board as main workspace.
- Keep card as source of truth.
- Do not create duplicate roadmap/schema/docs.
- Reuse existing types/constants/functions.
- Keep changes small.

## Implementation notes

- [note]
- [note]

## Proof

Run or explain:

- [command/check]

## Documentation updates

- `docs/roadmap/DEVELOPMENT_LOG.md`
- `docs/roadmap/PROGRESS.md`
- `docs/roadmap/PHASE_TASKS.md`
- [area doc if needed]

## Completion output

Return:

- Changed files
- Verification result
- Docs updated
- Risk/notes
- Next recommended task
```

## Mini packet

Use this for small fixes:

```txt
Task:
Goal:
Files:
Constraint:
Proof:
Docs to update:
```

## Primitive compression

```txt
Task packet = work order.
One job.
Clear target.
Known files.
Proof required.
Log required.
```