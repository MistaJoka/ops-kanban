# Current State

## Repo state

This repository is a runnable Next.js app plus a detailed operations blueprint.

The documentation system is already large and structured. Use `context/` only as a short orientation layer.

## What already exists

- Product blueprint for a landscaping operations Kanban
- Roadmap and phase task system
- AI build protocol
- Progress tracking
- Problem registry
- Build knowledge log
- Product docs
- AI docs
- API docs
- Database docs
- Testing docs
- Cursor docs
- Supabase migration sequence
- Starter source patterns

## Current canonical entry points

- `AGENTS.md`
- `docs/roadmap/DOC_INDEX.md`
- `docs/roadmap/PROGRESS.md`
- `docs/roadmap/PHASE_TASKS.md`
- `docs/roadmap/DEVELOPMENT_ROADMAP.md`
- `docs/roadmap/DEFINITION_OF_DONE.md`

## Main risk

The repo has enough documentation that an AI agent may create duplicate plans, conflicting docs, or new abstractions instead of following the existing system.

## Correct behavior

Use this folder to quickly understand the mission, then defer to the canonical docs.

## Check before work

```txt
Am I extending the existing system?
Am I following the current task list?
Am I preserving the board/card model?
Am I avoiding mock production data?
Am I updating progress/log files after changes?
```
