# Memory and rules (distilled)

> Advisory only. [`AGENTS.md`](../../AGENTS.md) and canonical docs override this file.

## When to use

- Creating or updating Cursor project rules (`.cursor/rules/*.mdc`)
- Deciding what belongs in repo docs vs user-global rules
- Avoiding duplicate or conflicting agent guidance

## Adopted patterns (repo-safe)

- **Repo rules over global rules:** Project conventions live in `.cursor/rules/` and `AGENTS.md`; user-global rules supplement, never replace canonical docs.
- **`.mdc` format:** YAML frontmatter with `description`, optional `globs`, and `alwaysApply` boolean.
- **Scoped rules:** File-specific rules use glob patterns (e.g. `**/*.ts`); universal standards use `alwaysApply: true`.
- **Single source of truth:** Do not duplicate the AGENTS.md start-here list in rules — link to it instead.
- **External skills hierarchy:** See [`.cursor/rules/external-skills.mdc`](../../.cursor/rules/external-skills.mdc).
- **Context injection awareness:** claude-mem hook patterns are advisory; repo memory stays in AGENTS.md + roadmap LOG/PROGRESS — no external memory DB.

## Canonical overrides

| External impulse | Repo wins |
| --- | --- |
| New rule duplicates PHASE_TASKS | Link to [`PHASE_TASKS.md`](../roadmap/PHASE_TASKS.md) |
| Rule overrides NO_MOCK | [`NO_MOCK_DATA_POLICY.md`](../product/NO_MOCK_DATA_POLICY.md) |
| Store product rules in user memory | [`CURSOR_MASTER_PROMPT.md`](../cursor/CURSOR_MASTER_PROMPT.md) + AGENTS.md |

## Deferred / rejected

- Auto-creating rules from every chat → rules require explicit user approval
- Compressing AGENTS.md into caveman format → keep AGENTS.md human-readable

## Source map

[`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md) → [claude-mem](https://github.com/thedotmack/claude-mem) (`claude-mem-*`), `cursor-create-rule` (supplementary)
