# Superpowers workflow (distilled)

> Advisory only. [`AGENTS.md`](../../AGENTS.md) and canonical docs override this file.

## When to use

- Starting a build session or multi-step implementation
- Before claiming work is complete, fixed, or passing
- When choosing between plan-first vs dive-in approaches

## Adopted patterns (repo-safe)

- **Session loop alignment:** Follow [`AI_BUILD_PROTOCOL.md`](../roadmap/AI_BUILD_PROTOCOL.md) — read PROGRESS → pick one task → implement → LOG + PROGRESS at end.
- **Plan before large work:** Multi-file or ambiguous features benefit from a written plan; small scoped fixes do not need ceremony.
- **Evidence before claims:** Run verification commands fresh before stating tests pass, linter clean, or bug fixed.
- **One task per session:** Default to one `TASK-Px-xxx` row unless user directs otherwise.
- **Brainstorm when creative:** New UI features or product behavior → clarify intent before coding (see [`UI_MASTER_FORMULA.md`](../product/UI_MASTER_FORMULA.md)).

## Canonical overrides

| External impulse | Repo wins |
| --- | --- |
| Always use TDD | Task row in [`PHASE_TASKS.md`](../roadmap/PHASE_TASKS.md) specifies tests |
| Skills override AGENTS.md | [`AGENTS.md`](../../AGENTS.md) start-here list |
| Skip session LOG | End-of-session LOG + PROGRESS is mandatory |
| Superpowers session loop | [`AI_BUILD_PROTOCOL.md`](../roadmap/AI_BUILD_PROTOCOL.md) §1 |

## Deferred / rejected

- Mandatory skill invocation before every response → Cursor uses rules + AGENTS.md instead
- Universal subagent dispatch → use only when task complexity warrants it

## Source map

[`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md) → [obra/superpowers](https://github.com/obra/superpowers) (`superpowers-*`), [gstack](https://github.com/garrytan/gstack) (`gstack-root`, partial)
