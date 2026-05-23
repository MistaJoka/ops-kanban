# Security review (distilled)

> Advisory only. [`AGENTS.md`](../../AGENTS.md) and canonical docs override this file.

## When to use

- Adding tables, migrations, or API routes
- Touching auth, RLS, or org-scoped data access
- Pre-deploy or staging gate reviews

## Adopted patterns (repo-safe)

- **RLS first:** New tables get RLS policies in migrations; follow [`004_rls_policies.sql`](../../supabase/migrations/004_rls_policies.sql) patterns.
- **No secrets in repo:** `.env` values stay out of git; production keys rotated before pilot.
- **Server-side env:** Private keys and service roles never reach client bundles.
- **Least privilege:** API routes use authenticated Supabase client; business rules in `lib/domain/*`.
- **Migration order:** Follow AGENTS.md migration sequence (`001` → `016`).

## Canonical overrides

| External impulse | Repo wins |
| --- | --- |
| Generic Postgres hardening | [`MVP_SCHEMA.md`](../database/MVP_SCHEMA.md) + migrations |
| Skip RLS on MVP tables | AGENTS.md "Do not" — Skip RLS on new tables |
| Client-side Supabase writes | [`ARCHITECTURE_PRINCIPLES.md`](../roadmap/ARCHITECTURE_PRINCIPLES.md) — UI never writes directly |

## Deferred / rejected

- Full Supabase best-practices reference dump → use [`.agents/skills/supabase-postgres-best-practices/`](../../.agents/skills/supabase-postgres-best-practices/) at runtime when needed

## Source map

[`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md) → `supabase-security-refs`

Release gate cross-links: [`RELEASE_GATES.md`](../testing/RELEASE_GATES.md) G1 (staging RLS matrix, AI-INJ suite).
