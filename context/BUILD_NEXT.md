# Build Next

How to choose the next task without creating a second backlog.

## Source of truth

- [`docs/roadmap/PROGRESS.md`](../docs/roadmap/PROGRESS.md) — live dashboard (**read first**)
- [`docs/roadmap/PHASE_TASKS.md`](../docs/roadmap/PHASE_TASKS.md) — task IDs P0–P17
- [`docs/ops/PILOT_DEPLOY_CHECKLIST.md`](../docs/ops/PILOT_DEPLOY_CHECKLIST.md) — staging/prod deploy
- [`docs/ops/PILOT_DAY_ONE.md`](../docs/ops/PILOT_DAY_ONE.md) — operator onboarding

## Current mode: pilot ops (post-P17)

Build phases P0–P17 are complete. Next work is **operational**, not greenfield scaffold:

1. Apply migrations **020–021** via `npm run db:migrate` on staging
2. Run `npm run test:integration -- inquiry idempotency api-contracts`
3. Set `SENTRY_DSN` on Vercel staging; verify error capture
4. Pilot UAT: public inquiry form + QR preset links (Settings → Integrations)
5. Deploy staging with inquiry URL on pilot customer website

See [`PROGRESS.md`](../docs/roadmap/PROGRESS.md) § Next recommended tasks for the live list.

## Selection rule

```txt
Read PROGRESS.
If pilot ops → follow deploy/UAT checklist.
If new feature → one TASK-Px-xxx or new phase task in PHASE_TASKS.
Confirm definition of done.
Make smallest safe change.
Run relevant proof + check:doc-sync when docs touched.
Update logs.
```

## Task card template

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

- Listed in PROGRESS or PHASE_TASKS
- Small enough for one focused session
- Testable and loggable
- Doc-sync updated when behavior changes

## Bad next tasks

- Invented mid-session roadmap
- Wide redesign with no task ID
- Speculative integration without operator need
- Doc changes without check:doc-sync when canonical files touched

## Primitive compression

```txt
Read PROGRESS.
Pilot or task.
Small cut.
Proof.
Log.
Next.
```
