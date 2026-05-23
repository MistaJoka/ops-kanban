# Advisor roles (distilled)

> Advisory only. [`AGENTS.md`](../../AGENTS.md) and canonical docs override this file.

## When to use

- Receiving code review feedback (human or bot)
- Requesting review before merge
- Acting as implementation advisor without overriding product rules

## Adopted patterns (repo-safe)

- **Verify before implementing:** Read feedback fully → restate requirement → check against codebase → implement one item at a time.
- **Technical pushback is OK:** Push back with reasoning when feedback conflicts with canonical docs or domain rules.
- **No performative agreement:** Avoid "You're absolutely right!" — use technical acknowledgment or clarifying questions.
- **Advisor, not authority:** External review patterns suggest; [`ARCHITECTURE_PRINCIPLES.md`](../roadmap/ARCHITECTURE_PRINCIPLES.md) and domain layer decide.
- **Unclear feedback:** Ask before assuming intent.

## Canonical overrides

| External impulse | Repo wins |
| --- | --- |
| Implement all review comments blindly | Verify each against [`BUILD_KNOWLEDGE.md`](../roadmap/BUILD_KNOWLEDGE.md) and domain code |
| Refactor beyond PR scope | Task row scope in [`PHASE_TASKS.md`](../roadmap/PHASE_TASKS.md) |
| Skip slop scan after review fixes | [`AI_SLOP_DETECTION.md`](../testing/AI_SLOP_DETECTION.md) when >3 files touched |

## Deferred / rejected

- Mandatory review subagent on every change → use when user requests or PR workflow requires

## Source map

[`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md) → [gstack/review](https://github.com/garrytan/gstack) (`gstack-review`), [obra/superpowers](https://github.com/obra/superpowers) (`superpowers-receiving-review`, `superpowers-requesting-review`)
