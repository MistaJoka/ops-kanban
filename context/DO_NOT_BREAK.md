# Do Not Break

This file lists the product and engineering assumptions that should stay stable during normal implementation work.

## Product rules

- The Kanban board is the main workspace.
- The card is the source of truth for a job.
- Columns represent important job states.
- Views are lenses over the same data.
- The MVP is landscaping-first.
- The interface should stay clear for a non-technical operator.

## Data rules

- Keep production flows connected to real data paths.
- Keep Supabase security rules aligned with the documented migrations.
- Keep private environment values server-side.
- Keep migration order documented.
- Keep typed constants and product docs synchronized.

## AI rules

- AI should assist operations.
- AI actions that affect business records should follow the designed approval and tool flow.
- AI behavior should match `docs/ai/` and `docs/api/APPROVAL_FLOW.md`.
- AI should not introduce hidden workflows that the user cannot review.

## Architecture rules

- Keep business logic out of UI components when possible.
- Prefer domain functions under `lib/domain/*`.
- Keep adapters separate from core logic.
- Reuse existing types and constants before adding new ones.
- Do not create duplicate schema, roadmap, or task systems.

## UX rules

- Optimize for fast field use.
- Mobile-first matters.
- Keep card summaries scannable.
- Keep detail views rich but controlled.
- Do not make the main job pipeline feel secondary.

## Primitive compression

```txt
One board.
One card truth.
One roadmap.
Real data paths.
Safe AI actions.
Simple operator UX.
```
