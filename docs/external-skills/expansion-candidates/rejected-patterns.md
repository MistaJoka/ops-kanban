# Rejected patterns

External guidance explicitly **not** adopted, with reason and canonical alternative.

| Pattern | External source | Reason rejected | Canonical alternative |
| --- | --- | --- | --- |
| Ban Inter, Roboto, Arial, and system fonts globally | `anthropic-frontend-design` | Repo uses a defined token-driven font stack; blanket bans conflict with DESIGN_TOKENS | [`DESIGN_TOKENS.md`](../../product/DESIGN_TOKENS.md) |
| Skills override AGENTS.md / user docs | `superpowers-using-superpowers` | Build protocol and frozen MVP scope must stay authoritative | [`AGENTS.md`](../../AGENTS.md), [`AI_BUILD_PROTOCOL.md`](../../roadmap/AI_BUILD_PROTOCOL.md) |
| Read raw vendor SKILL.md in normal sessions | external-skills anti-pattern | Raw sources can drift from repo constraints | [`docs/external-skills/distilled/`](../distilled/) |
| Add sample/demo cards for UI polish | common AI UI skill impulse | Violates no-mock policy | [`NO_MOCK_DATA_POLICY.md`](../../product/NO_MOCK_DATA_POLICY.md) |
| Skip session LOG when "just docs" | informal agent habit | AGENTS.md requires LOG for traceability | [`DEVELOPMENT_LOG.md`](../../roadmap/DEVELOPMENT_LOG.md) |
| claude-mem external memory DB | [claude-mem](https://github.com/thedotmack/claude-mem) | Repo traceability via LOG/PROGRESS/BUILD_KNOWLEDGE | [`DEVELOPMENT_LOG.md`](../../roadmap/DEVELOPMENT_LOG.md), AGENTS.md |
| Full gstack ship/install flows | [gstack](https://github.com/garrytan/gstack) | Exceeds MVP scope; no gstack runtime dependency | [`RELEASE_GATES.md`](../../testing/RELEASE_GATES.md), [`PHASE_TASKS.md`](../../roadmap/PHASE_TASKS.md) |

Add rows when audit rejects external guidance. Link from distilled "Deferred / rejected" sections.
