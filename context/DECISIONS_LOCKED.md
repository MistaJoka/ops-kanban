# Locked Decisions

These decisions should not be reopened during normal implementation unless the user explicitly changes direction.

## Product decisions

| Decision | Locked direction |
|---|---|
| Main workspace | One universal Job Pipeline Kanban board |
| Core record | Card is the source of truth for each job |
| Columns | Columns represent job states, not every small task |
| Views | Views are lenses over the same job/card data |
| MVP vertical | Landscaping / lawn-care SMB first |
| User type | Solo or small operator, not enterprise admin first |
| Mobile priority | Mobile-first field use matters |
| Dashboard role | Dashboard supports the board; it does not replace it |
| AI role | Operational copilot with reviewable actions |
| Data posture | Real data paths over fake production placeholders |

## Technical decisions

| Decision | Locked direction |
|---|---|
| App stack | Next.js App Router + TypeScript |
| Styling | Tailwind + shadcn/ui direction |
| Backend | Supabase Auth, Postgres, Realtime |
| AI provider | Gemini 2.5 Flash via `GEMINI_API_KEY` |
| Secrets | Private keys stay server-side |
| Security | Supabase RLS stays aligned with migrations |
| Architecture | Business logic belongs in domain layers where possible |
| AI writes | AI follows the designed tool/approval flow |

## Documentation decisions

| Decision | Locked direction |
|---|---|
| Canonical doc map | `docs/roadmap/DOC_INDEX.md` |
| Agent workflow | `AGENTS.md` |
| Active status | `docs/roadmap/PROGRESS.md` |
| Task backlog | `docs/roadmap/PHASE_TASKS.md` |
| Completion criteria | `docs/roadmap/DEFINITION_OF_DONE.md` |
| This folder | Briefing layer only, not canonical replacement |

## If a locked decision seems wrong

Do not silently change direction.

Create a short note in the relevant roadmap/progress docs explaining:

```txt
Decision under pressure:
Why it may need to change:
Impact if changed:
Files affected:
Recommended action:
```

## Primitive compression

```txt
One board.
One card truth.
One doc map.
One task at a time.
AI helps, user controls.
```