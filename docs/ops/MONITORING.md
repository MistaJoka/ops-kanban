# Monitoring setup (Wave 0 MVP)

Enable after first staging deploy. Couples to `PILOT_DEPLOY_CHECKLIST.md`.

## Vercel (minimum)

1. Link repo in Vercel dashboard
2. Set production env vars (see `PILOT_DEPLOY_CHECKLIST.md`)
3. Enable **Deployment Protection** on production
4. Watch **Functions** logs for `/api/*` 5xx spikes
5. Optional: Vercel Observability / Log Drains to your SIEM

## Recommended: Sentry (errors)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Set `SENTRY_DSN` in Vercel env. Verify a test error appears in Sentry after deploy.

## AI-specific metrics (weekly review)

Query Supabase:

```sql
-- Rejection rate last 7 days
select
  count(*) filter (where approval_status = 'rejected') as rejected,
  count(*) filter (where status = 'executed') as executed
from ai_tool_calls
where created_at > now() - interval '7 days';
```

## Alert thresholds (pilot)

| Signal | Threshold | Action |
|--------|-----------|--------|
| API 5xx rate | > 1% for 5 min | Page on-call |
| Auth failures | spike 3× baseline | Check Supabase status |
| AI reject rate | > 40% | Review prompt chips / UX |

**Configured:** documented — enable Sentry + Vercel alerts on first prod deploy.

See `PILOT_DEPLOY_CHECKLIST.md` for the deploy sequence.
