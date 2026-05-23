# Build Next

This file is a short pointer, not the full backlog.

## Source of truth

Use these files for the real build order:

- `docs/roadmap/PROGRESS.md`
- `docs/roadmap/PHASE_TASKS.md`
- `docs/roadmap/DEVELOPMENT_ROADMAP.md`
- `docs/roadmap/DEFINITION_OF_DONE.md`

## Session rule

Work on one task at a time.

Do not jump to money, AI, integrations, or platform waves unless the current roadmap/progress files say that foundation work is complete.

## Preferred build order

```txt
P0 scaffold
P1 foundation, auth, RLS, signup bootstrap
P2 job pipeline workspace
P3 deep card record
P4 money drafts
P5 AI subsystem
P6 MVP release
P7-P10 platform waves
```

## Next-work checklist

Before choosing a coding task:

1. Read `docs/roadmap/PROGRESS.md`.
2. Find the active phase.
3. Pick one open `TASK-Px-xxx` from `docs/roadmap/PHASE_TASKS.md`.
4. Confirm the definition of done.
5. Touch the smallest useful set of files.
6. Run relevant tests or checks.
7. Update progress/log docs.

## Avoid

- Building from vibes only
- Creating a new backlog
- Skipping foundation tasks
- Adding demo data to production paths
- Expanding scope before the pipeline/card system is solid