# External skills (advisory layer)

Repo-safe guidance distilled from external Cursor/Claude skills. **Advisory only** — never overrides [`AGENTS.md`](../../AGENTS.md) or canonical docs.

## Precedence

1. User explicit request
2. [`AGENTS.md`](../../AGENTS.md) + [`docs/roadmap/DOC_INDEX.md`](../roadmap/DOC_INDEX.md) canonical docs
3. **`docs/external-skills/distilled/`** ← daily operating layer
4. [`expansion-candidates/`](expansion-candidates/) — ideas not yet adopted
5. [`vendor-skills/raw/`](../../vendor-skills/raw/) — audit-only archive (do not read by default)

## When to read what

| Layer | Path | Use when |
| --- | --- | --- |
| Distilled | [`distilled/`](distilled/) | Normal build sessions — UI polish, review discipline, verification |
| Expansion | [`expansion-candidates/`](expansion-candidates/) | Evaluating new external ideas before adoption |
| Raw archive | [`vendor-skills/raw/`](../../vendor-skills/raw/) | User requests audit/expansion review only |
| Index | [`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md) | Mapping raw sources → distilled files |

## Distilled files

| File | Topic |
| --- | --- |
| [`frontend-design.md`](distilled/frontend-design.md) | Distinctive UI without generic AI aesthetics |
| [`superpowers-workflow.md`](distilled/superpowers-workflow.md) | Plan → implement → verify session discipline |
| [`memory-rules.md`](distilled/memory-rules.md) | Cursor rule conventions; repo over global rules |
| [`advisor-roles.md`](distilled/advisor-roles.md) | Code review reception and advisor behavior |
| [`qa-review.md`](distilled/qa-review.md) | Verification before completion claims |
| [`security-review.md`](distilled/security-review.md) | RLS, secrets, server-side env |
| [`release-review.md`](distilled/release-review.md) | Pre-merge and release gates |

## Hard overrides (never from external skills)

- [`NO_MOCK_DATA_POLICY.md`](../product/NO_MOCK_DATA_POLICY.md)
- [`UI_MASTER_FORMULA.md`](../product/UI_MASTER_FORMULA.md)
- [`AI_BUILD_PROTOCOL.md`](../roadmap/AI_BUILD_PROTOCOL.md)
- [`DESIGN_TOKENS.md`](../product/DESIGN_TOKENS.md)

## Upstream sources (archived in `vendor-skills/raw/`)

| Upstream | Creator | Distilled into |
| --- | --- | --- |
| [garrytan/gstack](https://github.com/garrytan/gstack) | Garry Tan / contributors | advisor-roles, qa-review, release-review, frontend-design |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | thedotmack / contributors | memory-rules |
| [anthropics/skills](https://github.com/anthropics/skills) | Anthropic | frontend-design |
| [obra/superpowers](https://github.com/obra/superpowers) | Jesse Vincent (obra) | superpowers-workflow, advisor-roles, qa-review, release-review |

Full provenance: [`vendor-skills/SOURCE_NOTES.md`](../../vendor-skills/SOURCE_NOTES.md).

## Relationship to `.agents/skills/`

[`.agents/skills/`](../../.agents/skills/) holds **runtime** agent skills (e.g. Supabase). `vendor-skills/` is **archival reference** for distillation — different purpose, same advisory hierarchy.

## Cursor enforcement

Hierarchy is enforced by [`.cursor/rules/external-skills.mdc`](../../.cursor/rules/external-skills.mdc). Raw sources are excluded from indexing via [`.cursorignore`](../../.cursorignore).

**Upstream maintenance:** Pinned commit SHAs and re-fetch schedule in [`vendor-skills/SOURCE_NOTES.md`](../../vendor-skills/SOURCE_NOTES.md) and [`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md).

## Promotion workflow

```txt
external idea → expansion-candidates/ideas-to-evaluate.md
             → audit against AGENTS.md
             → adopt into distilled/ OR reject into rejected-patterns.md
             → never raw → code directly
```
