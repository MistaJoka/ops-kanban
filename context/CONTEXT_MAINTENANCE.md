# Context Maintenance

This file explains how to keep `context/` useful.

## Purpose

`context/` should stay small, current, and easy for AI tools to scan.

It should not become a second `docs/` folder.

## Maintenance rules

- Keep files short.
- Prefer links to canonical docs over copied content.
- Update context only when the mission, active workflow, or locked decisions change.
- Do not add one-off notes here.
- Do not add full specs here.
- Do not add duplicate task lists here.
- Do not add duplicate database schemas here.

## File size target

| File type | Target size |
|---|---:|
| Briefing files | 50–150 lines |
| Checklists | 50–180 lines |
| File maps | As short as possible |
| Locked decisions | Only stable decisions |

## When to update each file

| File | Update when |
|---|---|
| `START_HERE.md` | Startup flow changes |
| `PROJECT_NORTH_STAR.md` | Product identity changes |
| `CURRENT_STATE.md` | Repo state meaningfully changes |
| `DECISIONS_LOCKED.md` | A stable decision changes |
| `BUILD_NEXT.md` | Build-selection process changes |
| `AI_SESSION_CHECKLIST.md` | Session workflow changes |
| `QUALITY_GATE.md` | Acceptance standards change |
| `DO_NOT_BREAK.md` | New critical constraint appears |
| `FILE_MAP.md` | Important docs/code paths move |
| `CONTEXT_MAINTENANCE.md` | Context-folder rules change |

## Cleanup trigger

Clean this folder if:

- Files start repeating `docs/` content.
- Cursor gets conflicting instructions.
- More than 10–12 files exist.
- A file becomes long enough that it is no longer a briefing.

## Primitive compression

```txt
Context = short.
Docs = deep.
No duplicate truth.
No stale mission.
No junk drawer.
```