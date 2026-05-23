# Context Folder

This folder is the fast briefing layer for `ops-kanban`.

It helps Cursor and AI-assisted coding sessions understand the mission before reading the larger documentation system.

## What this folder is

```txt
context/ = mission control
AGENTS.md = work protocol
docs/ = canonical library
src/app + lib/ = implementation
```

## Use order

1. `START_HERE.md` — first briefing
2. `PROJECT_NORTH_STAR.md` — product identity
3. `CURRENT_STATE.md` — repo and build state
4. `DECISIONS_LOCKED.md` — decisions not to relitigate
5. `BUILD_NEXT.md` — how to select the next task
6. `AI_SESSION_CHECKLIST.md` — session flow
7. `QUALITY_GATE.md` — acceptance checks
8. `DO_NOT_BREAK.md` — stable assumptions
9. `FILE_MAP.md` — where to find things
10. `CONTEXT_MAINTENANCE.md` — how to keep this folder clean

## What belongs here

- Short orientation
- Current direction
- Locked product decisions
- Safe implementation reminders
- Links to canonical docs
- Session checklists

## What does not belong here

- Full roadmap copies
- Full schema copies
- Long product specs
- Duplicate task backlogs
- Large implementation plans
- One-off brainstorming notes

## Golden rule

When context and docs disagree, use `docs/roadmap/DOC_INDEX.md` to find the canonical source.

## Primitive compression

```txt
Need speed? Read context.
Need truth? Read docs.
Need workflow? Read AGENTS.
Need code? Edit small.
Need done? Log it.
```
