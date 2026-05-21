# Contributing

## Workflow

**AI agents:** follow `docs/roadmap/AI_BUILD_PROTOCOL.md` and `AGENTS.md`.

1. Read `docs/roadmap/PROGRESS.md` and open items in `PROBLEM_REGISTRY.md`
2. Pick one task from `docs/roadmap/PHASE_TASKS.md`
3. Branch: `task/P2-008-move-card` (example)
4. Implement with tests from task **Test IDs**
5. End of session:
   - `DEVELOPMENT_LOG.md` (Progress, Troubles, Fix, Learning)
   - `PROGRESS.md` dashboard
   - `PROBLEM_REGISTRY.md` / `BUILD_KNOWLEDGE.md` if applicable
6. PR: reference task + DoD items

## Requirements

- `npm run lint` / `typecheck` / relevant `test:*` pass
- No mock data in `app/`, `components/`, `lib/domain/` — `NO_MOCK_DATA_POLICY.md`
- Run `scripts/check-no-mock.sh` before release PRs
- RLS on any new table in same migration
- Activity log on user-visible mutations

## Commits

Conventional style: `feat(pipeline): validate scheduled date on move (TASK-P3-010)`

## Docs

Update product doc if behavior changes; add REQ row in `docs/testing/TRACEABILITY.md`.
