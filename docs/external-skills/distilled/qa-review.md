# QA review (distilled)

> Advisory only. [`AGENTS.md`](../../AGENTS.md) and canonical docs override this file.

## When to use

- Before claiming work is complete, fixed, or passing
- Before commit or PR when user has requested verification
- After multi-file AI sessions touching pipeline or card UI

## Adopted patterns (repo-safe)

- **Iron law:** No completion claims without fresh verification evidence in the same session.
- **Gate function:** Identify proving command → run full command → read full output → verify claim → then state claim with evidence.
- **Slop integration:** When >3 files or `components/pipeline/` touched, run Suspicion Scan per [`AI_SLOP_DETECTION.md`](../testing/AI_SLOP_DETECTION.md).
- **Structural checks:** `npm run check:slop-health` on structural changes; `npm run check:css-health` after UI CSS work (use `dev:clean` if CSS 404).
- **Test IDs:** Reference test ID in PR when fixing a bug ([`RELEASE_GATES.md`](../testing/RELEASE_GATES.md) G0).

## Canonical overrides

| External impulse | Repo wins |
| --- | --- |
| Generic "npm test" | Task row test list in [`PHASE_TASKS.md`](../roadmap/PHASE_TASKS.md) |
| Linter alone proves quality | [`AI_SLOP_DETECTION.md`](../testing/AI_SLOP_DETECTION.md) five layers |
| Skip E2E for pipeline changes | [`REGRESSION_MATRIX.md`](../testing/REGRESSION_MATRIX.md) smoke tests |

## Deferred / rejected

- Red-green TDD cycle on every fix → when task spec requires it only

## Source map

[`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md) → [gstack/qa](https://github.com/garrytan/gstack) (`gstack-qa`), [obra/superpowers](https://github.com/obra/superpowers) (`superpowers-verification`)
