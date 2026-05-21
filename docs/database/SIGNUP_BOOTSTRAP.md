# Signup bootstrap

On first signup, the system must provision a landscaping workspace in one transaction.

## Flow

```txt
auth.users insert (Supabase Auth)
→ trigger: profiles row
→ API or trigger: organization + organization_members (owner)
→ primary board
→ 9 default columns (landscaping pipeline)
→ optional: welcome activity on org
```

## Implementation options

| Approach | Pros |
|----------|------|
| **Postgres trigger** on `auth.users` | Atomic, no race on refresh |
| **Next.js signup Server Action** | Easier to debug; call service role once |

Recommendation: **Server Action** for MVP, move to trigger when stable.

## Server Action pseudocode

```ts
// After supabase.auth.signUp succeeds and session exists:
1. upsert profiles (id = user.id, email, full_name)
2. insert organizations (name from signup form or "{name}'s Landscaping")
3. insert organization_members (role: owner)
4. insert boards (name: 'Job Pipeline', is_primary: true)
5. insert columns from LANDSCAPING_COLUMNS constant (see seed SQL)
```

## Column seed

Use `supabase/seed/landscaping_default_columns.sql` as the source of truth for names, positions, and `state_key` values.

## RLS policies (Phase 1)

Enable RLS on all MVP tables. Minimum policies:

```txt
SELECT/INSERT/UPDATE/DELETE on org-scoped tables
  WHERE organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
```

Stricter rules:

- `viewer`: SELECT only on cards, customers, quotes, invoices
- `worker`: no DELETE on cards; no org settings
- `owner` / `manager`: full CRUD within org

`profiles`: users can read/update own row; read org members in same org.

## Service role

Use service role only in:

- signup bootstrap (if not using trigger)
- AI tool executor (server-side, after auth check)

Never expose service role to the client.

## Environment

See `.env.example`. Required before Phase 1 done:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `GEMINI_API_KEY` (Phase 5)
