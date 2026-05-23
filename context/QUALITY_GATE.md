# Quality Gate

Use this before marking a task complete.

## Product fit

- The change supports the Job Pipeline board.
- The card remains the source of truth.
- The UI stays understandable for a non-technical landscaping operator.
- The change does not introduce a separate truth system.
- The change does not expand scope beyond the active task.

## Data fit

- Data flows through the intended app/database path.
- Production flows do not depend on fake records.
- Environment values are used in the correct client/server layer.
- Supabase behavior stays aligned with the documented migrations and RLS intent.
- Any new field/table/API is reflected in the correct canonical doc.

## AI fit

- AI behavior follows `docs/ai/`.
- AI actions that affect business records follow the intended tool/approval flow.
- AI output is reviewable when it changes operational data.
- AI does not create hidden side effects.

## Code fit

- Smallest useful change was made.
- Existing types/constants were reused where possible.
- Business rules are not trapped in UI-only code.
- Naming matches the product language.
- Error states and loading states are considered.
- Mobile behavior is considered for user-facing UI.

## Test fit

Run the most relevant checks available for the task.

Common checks:

```txt
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e:smoke
npm run test:wave4
```

Not every task needs every command. Pick the smallest useful proof.

## Documentation fit

- `DEVELOPMENT_LOG.md` updated.
- `PROGRESS.md` updated.
- `PHASE_TASKS.md` updated.
- Any relevant product/API/database/AI docs updated.
- No duplicate roadmap or schema created.

## Definition of done

```txt
The feature works.
The risk is known.
The proof is recorded.
The docs are aligned.
The next step is clear.
```
