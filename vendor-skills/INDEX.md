# Vendor skills index

Catalog of external skill sources archived under [`raw/`](raw/). See [`SOURCE_NOTES.md`](SOURCE_NOTES.md) for upstream URLs.

## Primary upstream sources

| Upstream repo | Distilled targets | Status |
| --- | --- | --- |
| [garrytan/gstack](https://github.com/garrytan/gstack) | advisor-roles, qa-review, release-review, frontend-design | archived |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | memory-rules | archived |
| [anthropics/skills](https://github.com/anthropics/skills) (frontend-design) | frontend-design | archived |
| [obra/superpowers](https://github.com/obra/superpowers) | superpowers-workflow, advisor-roles, qa-review, release-review | archived |

## File index

| ID | Upstream | Raw path | Distilled target | Status |
| --- | --- | --- | --- | --- |
| `gstack-root` | garrytan/gstack | `raw/gstack/SKILL.md` | superpowers-workflow (partial) | archived |
| `gstack-review` | garrytan/gstack | `raw/gstack/review/SKILL.md` | [`advisor-roles.md`](../docs/external-skills/distilled/advisor-roles.md) | archived |
| `gstack-qa` | garrytan/gstack | `raw/gstack/qa/SKILL.md` | [`qa-review.md`](../docs/external-skills/distilled/qa-review.md) | archived |
| `gstack-ship` | garrytan/gstack | `raw/gstack/ship/SKILL.md` | [`release-review.md`](../docs/external-skills/distilled/release-review.md) | archived |
| `gstack-design-review` | garrytan/gstack | `raw/gstack/design-review/SKILL.md` | [`frontend-design.md`](../docs/external-skills/distilled/frontend-design.md) | archived |
| `claude-mem-readme` | thedotmack/claude-mem | `raw/claude-mem/README.md` | [`memory-rules.md`](../docs/external-skills/distilled/memory-rules.md) | archived |
| `claude-mem-hooks` | thedotmack/claude-mem | `raw/claude-mem/cursor-hooks/*.md` | [`memory-rules.md`](../docs/external-skills/distilled/memory-rules.md) | archived |
| `claude-mem-context` | thedotmack/claude-mem | `raw/claude-mem/.agent/rules/claude-mem-context.md` | [`memory-rules.md`](../docs/external-skills/distilled/memory-rules.md) | archived |
| `anthropic-frontend-design` | anthropics/skills | `raw/anthropic-frontend-design/SKILL.md` | [`frontend-design.md`](../docs/external-skills/distilled/frontend-design.md) | archived |
| `superpowers-using-superpowers` | obra/superpowers | `raw/superpowers/using-superpowers/SKILL.md` | [`superpowers-workflow.md`](../docs/external-skills/distilled/superpowers-workflow.md) | archived |
| `superpowers-verification` | obra/superpowers | `raw/superpowers/verification-before-completion/SKILL.md` | superpowers-workflow, qa-review | archived |
| `superpowers-brainstorming` | obra/superpowers | `raw/superpowers/brainstorming/SKILL.md` | superpowers-workflow | archived |
| `superpowers-executing-plans` | obra/superpowers | `raw/superpowers/executing-plans/SKILL.md` | superpowers-workflow | archived |
| `superpowers-tdd` | obra/superpowers | `raw/superpowers/test-driven-development/SKILL.md` | superpowers-workflow | archived |
| `superpowers-receiving-review` | obra/superpowers | `raw/superpowers/receiving-code-review/SKILL.md` | advisor-roles | archived |
| `superpowers-requesting-review` | obra/superpowers | `raw/superpowers/requesting-code-review/SKILL.md` | advisor-roles | archived |
| `superpowers-finishing-branch` | obra/superpowers | `raw/superpowers/finishing-a-development-branch/SKILL.md` | release-review | archived |
| `cursor-create-rule` | Cursor bundled | `raw/cursor/create-rule/SKILL.md` | memory-rules (supplementary) | archived |
| `supabase-security-refs` | supabase/agent-skills | `raw/supabase-postgres-best-practices/references/security-*.md` | security-review | archived |

## Reconcile after upstream changes

1. Re-fetch from upstream URLs in [`SOURCE_NOTES.md`](SOURCE_NOTES.md) at pinned SHAs or latest `main`.
2. Update copy date, pinned SHAs, and reconcile distilled files.
3. Move gaps to [`docs/external-skills/expansion-candidates/`](../docs/external-skills/expansion-candidates/).

## Periodic re-fetch schedule

| Trigger | Action |
| --- | --- |
| **Quarterly** (Jan / Apr / Jul / Oct) | Check upstream `main` for drift; re-fetch if distilled layer is stale |
| **Before major release** (G2 in [`RELEASE_GATES.md`](../docs/testing/RELEASE_GATES.md)) | Verify pinned SHAs; reconcile security-review and release-review distilled docs |
| **After upstream breaking change** | User-reported or audit-found conflict → immediate re-fetch + expansion-candidates review |
| **New external skill adoption** | Add INDEX row → archive to `raw/` → pin SHA → distill → update LICENSES |

Quick drift check:

```bash
# Compare local pin vs remote HEAD (run from repo root)
for repo in garrytan/gstack thedotmack/claude-mem anthropics/skills obra/superpowers; do
  echo -n "$repo: "
  git ls-remote "https://github.com/$repo.git" HEAD | awk '{print $1}'
done
```

If remote HEAD differs from [`SOURCE_NOTES.md`](SOURCE_NOTES.md) pinned SHA, schedule a reconcile pass — do not auto-promote raw changes into distilled or code.
