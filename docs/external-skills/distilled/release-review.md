# Release review (distilled)

> Advisory only. [`AGENTS.md`](../../AGENTS.md) and canonical docs override this file.

## When to use

- Implementation complete and tests verified
- Deciding merge vs PR vs cleanup
- Pre-merge or pre-pilot checklist

## Adopted patterns (repo-safe)

- **Verify first:** Tests and checks pass before presenting merge/PR options.
- **Structured options:** Present clear choices (merge locally, open PR, continue on branch) — do not assume.
- **Gate alignment:** PR merge meets [`RELEASE_GATES.md`](../testing/RELEASE_GATES.md) G0; staging/pilot meet G1/G2.
- **DoD check:** Phase work references [`DEFINITION_OF_DONE.md`](../roadmap/DEFINITION_OF_DONE.md) exit criteria.
- **Session closure:** LOG + PROGRESS updated even if stopping before merge ([`AI_BUILD_PROTOCOL.md`](../roadmap/AI_BUILD_PROTOCOL.md) §1 END).

## Canonical overrides

| External impulse | Repo wins |
| --- | --- |
| Merge without slop attestation | G0 requires Suspicion Scan attestation when AI-assisted |
| Skip PROGRESS update | AGENTS.md end-of-session table |
| Generic test command | Task-specific tests + [`REGRESSION_MATRIX.md`](../testing/REGRESSION_MATRIX.md) |

## Deferred / rejected

- Auto-push to remote → only when user explicitly requests

## Source map

[`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md) → [gstack/ship](https://github.com/garrytan/gstack) (`gstack-ship`), [obra/superpowers](https://github.com/obra/superpowers) (`superpowers-finishing-branch`)

Gate reference: [`RELEASE_GATES.md`](../testing/RELEASE_GATES.md) G0 (PR) · G1 (staging) · G2 (MVP pilot).
