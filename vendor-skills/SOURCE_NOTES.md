# Source notes

Provenance and distillation notes for external skills archived under [`raw/`](raw/).

## Required upstream sources

| Upstream | Creator | Archived under | Distilled into |
| --- | --- | --- | --- |
| [github.com/garrytan/gstack](https://github.com/garrytan/gstack) | Garry Tan / gstack contributors | [`raw/gstack/`](raw/gstack/) | [`advisor-roles.md`](../docs/external-skills/distilled/advisor-roles.md), [`qa-review.md`](../docs/external-skills/distilled/qa-review.md), [`release-review.md`](../docs/external-skills/distilled/release-review.md), [`frontend-design.md`](../docs/external-skills/distilled/frontend-design.md) |
| [github.com/thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | thedotmack / claude-mem contributors | [`raw/claude-mem/`](raw/claude-mem/) | [`memory-rules.md`](../docs/external-skills/distilled/memory-rules.md) |
| [anthropics/skills — frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Anthropic | [`raw/anthropic-frontend-design/SKILL.md`](raw/anthropic-frontend-design/SKILL.md) | [`frontend-design.md`](../docs/external-skills/distilled/frontend-design.md) |
| [github.com/obra/superpowers](https://github.com/obra/superpowers) | Jesse Vincent (obra) / superpowers contributors | [`raw/superpowers/`](raw/superpowers/) | [`superpowers-workflow.md`](../docs/external-skills/distilled/superpowers-workflow.md), [`advisor-roles.md`](../docs/external-skills/distilled/advisor-roles.md), [`qa-review.md`](../docs/external-skills/distilled/qa-review.md), [`release-review.md`](../docs/external-skills/distilled/release-review.md) |

## Pinned upstream commits

SHAs below were captured at archive refresh (**2026-05-23**). Re-fetch per schedule in [`INDEX.md`](INDEX.md) and update this table.

| Upstream | Branch | Pinned SHA | Pin date |
| --- | --- | --- | --- |
| [garrytan/gstack](https://github.com/garrytan/gstack) | `main` | `61c9a20bd2e3a579c3d6184ed2fc95b51a528f7c` | 2026-05-23 |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | `main` | `c3d2af7c144b886e21e6b4721a9a5e5960482766` | 2026-05-23 |
| [anthropics/skills](https://github.com/anthropics/skills) | `main` | `690f15cac7f7b4c055c5ab109c79ed9259934081` | 2026-05-23 |
| [obra/superpowers](https://github.com/obra/superpowers) | `main` | `f2cbfbefebbfef77321e4c9abc9e949826bea9d7` | 2026-05-23 |
| [supabase/agent-skills](https://github.com/supabase/agent-skills) (supplementary) | `main` | `4e69c80e213f315c02c9ebef9c28dd6e43a4707e` | 2026-05-23 |

Browse pinned trees: `https://github.com/<owner>/<repo>/tree/<sha>/`

---

## Per-source detail

### gstack

- **Upstream:** https://github.com/garrytan/gstack
- **Pinned SHA:** `61c9a20bd2e3a579c3d6184ed2fc95b51a528f7c` (main, 2026-05-23)
- **Copy date:** 2026-05-23
- **Verbatim:** yes — `SKILL.md`, `review/SKILL.md`, `qa/SKILL.md`, `ship/SKILL.md`, `design-review/SKILL.md`
- **Distilled into:** advisor-roles, qa-review, release-review, frontend-design (partial)
- **Distillation notes:** Review/QA/ship workflows adopted as advisory patterns; full gstack install/skillify flows not adopted.
- **Conflicts:** gstack ship/review depth exceeds MVP scope — defer to [`RELEASE_GATES.md`](../docs/testing/RELEASE_GATES.md) and [`PHASE_TASKS.md`](../docs/roadmap/PHASE_TASKS.md).

### claude-mem

- **Upstream:** https://github.com/thedotmack/claude-mem
- **Pinned SHA:** `c3d2af7c144b886e21e6b4721a9a5e5960482766` (main, 2026-05-23)
- **Copy date:** 2026-05-23
- **Verbatim:** yes — `README.md`, `cursor-hooks/INTEGRATION.md`, `cursor-hooks/CONTEXT-INJECTION.md`, `.agent/rules/claude-mem-context.md`
- **Distilled into:** [`memory-rules.md`](../docs/external-skills/distilled/memory-rules.md)
- **Distillation notes:** Context injection and Cursor hook patterns noted; repo memory stays in AGENTS.md + roadmap docs, not external DB.
- **Conflicts:** claude-mem persistent memory DB is not adopted — canonical docs and LOG/PROGRESS win.

### anthropic-frontend-design

- **Upstream:** https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- **Pinned SHA:** `690f15cac7f7b4c055c5ab109c79ed9259934081` (anthropics/skills main, 2026-05-23)
- **Copy date:** 2026-05-23
- **Verbatim:** yes — [`raw/anthropic-frontend-design/SKILL.md`](raw/anthropic-frontend-design/SKILL.md)
- **Distilled into:** [`frontend-design.md`](../docs/external-skills/distilled/frontend-design.md)
- **Distillation notes:** Aesthetic intentionality adopted; font/color choices defer to [`DESIGN_TOKENS.md`](../docs/product/DESIGN_TOKENS.md).
- **Conflicts:** External skill bans Inter/system fonts; repo uses token-driven font stack — tokens win.

### superpowers (obra)

- **Upstream:** https://github.com/obra/superpowers
- **Pinned SHA:** `f2cbfbefebbfef77321e4c9abc9e949826bea9d7` (main, 2026-05-23)
- **Copy date:** 2026-05-23
- **Verbatim:** yes — 8 skills under [`raw/superpowers/`](raw/superpowers/)
- **Distilled into:** superpowers-workflow, advisor-roles, qa-review, release-review
- **Distillation notes:** Session loop aligned with [`AI_BUILD_PROTOCOL.md`](../docs/roadmap/AI_BUILD_PROTOCOL.md); verification gate cross-linked to slop detection.
- **Conflicts:** Superpowers may mandate TDD universally; repo uses TDD when task spec calls for it — task row wins.

### cursor-create-rule (supplementary)

- **Upstream:** Cursor bundled skill (`~/.cursor/skills-cursor/create-rule`)
- **Copy date:** 2026-05-23
- **Verbatim:** yes — [`raw/cursor/create-rule/SKILL.md`](raw/cursor/create-rule/SKILL.md)
- **Distilled into:** [`memory-rules.md`](../docs/external-skills/distilled/memory-rules.md)
- **Distillation notes:** `.mdc` frontmatter conventions; secondary to claude-mem for memory patterns.
- **Conflicts:** None identified.

### supabase-security-refs (supplementary)

- **Upstream:** [supabase/agent-skills](https://github.com/supabase/agent-skills) (in-repo [`.agents/skills/`](../.agents/skills/))
- **Pinned SHA:** `4e69c80e213f315c02c9ebef9c28dd6e43a4707e` (main, 2026-05-23)
- **Copy date:** 2026-05-23
- **Verbatim:** yes — 3 security reference files under [`raw/supabase-postgres-best-practices/references/`](raw/supabase-postgres-best-practices/references/)
- **Distilled into:** [`security-review.md`](../docs/external-skills/distilled/security-review.md)
- **Distillation notes:** RLS-first patterns; cross-link migrations and release gates.
- **Conflicts:** None identified — complements existing DB docs.
