# Build Next

This file explains how to choose the next task without creating a second backlog.

## Source of truth

Use these files for the real build order:

- `docs/roadmap/PROGRESS.md`
- `docs/roadmap/PHASE_TASKS.md`
- `docs/roadmap/DEVELOPMENT_ROADMAP.md`
- `docs/roadmap/DEFINITION_OF_DONE.md`

## Build selection rule

```txt
Read PROGRESS.
Find active phase.
Pick one open TASK-Px-xxx.
Confirm definition of done.
Make smallest safe change.
Run relevant proof.
Update logs.
```

## Preferred phase order

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

## Do not skip ahead

Avoid jumping to:

- Money features before pipeline/card foundation
- AI features before stable tool/action paths
- Integrations before core records work
- Platform waves before MVP release
- New dashboards before the board is solid

## Task card template

Use this mini-template before work:

```txt
Task ID:
Active phase:
User-visible outcome:
Canonical docs:
Files to inspect first:
Files likely changed:
Proof command/check:
Rollback risk:
```

## Good next tasks

A good next task is:

- Already listed in `PHASE_TASKS.md`
- Small enough to finish in one focused session
- Aligned with the active phase
- Testable
- Loggable
- Not dependent on unclear product decisions

## Bad next tasks

A bad next task is:

- A brand-new roadmap invented mid-session
- A wide redesign with no task ID
- A feature that bypasses the phase order
- A speculative integration
- A visual polish pass that hides broken data flow

## Primitive compression

```txt
One phase.
One task.
Small cut.
Proof.
Log.
Next.
```