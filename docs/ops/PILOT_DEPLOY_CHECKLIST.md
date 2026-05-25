# Pilot deploy checklist (Wave 0)

Use before promoting MVP to a pilot production environment. Couples to `RELEASE_GATES.md` G2 ops section.

## Environment

- [ ] Create Supabase production project (separate from dev/test)
- [ ] Apply migrations `001` → `021` in order (`npm run db:migrate`)
- [ ] Set `DISABLE_AUTH=false` in production
- [ ] Configure production env vars on host (Vercel or equivalent):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose to client bundle)
  - `GEMINI_API_KEY` (optional — intent router works without it)
  - `SENTRY_DSN` (optional — error monitoring; see `docs/ops/MONITORING.md`)
  - `CRON_SECRET` (optional — Vercel Cron auth for `/api/contracts/run-due`)
  - Optional delivery pipes: Stripe, Twilio, Resend
- [ ] Rotate any keys that were used in dev/staging
- [ ] Confirm RLS enabled on all public tables (`004_rls_policies.sql`)

## Deploy

- [ ] Run CI green on release commit (`.github/workflows/ci.yml`)
- [ ] `npm run check:no-mock` pass
- [ ] `npm run check:doc-sync` pass
- [ ] Deploy preview → smoke `@smoke` E2E against preview URL
- [ ] Promote to production URL
- [ ] Verify new signup shows **0 cards**, 9 columns (NO_MOCK V1)

## Monitoring

- [ ] Enable error monitoring (Sentry, Vercel logs, or equivalent)
- [ ] Alert on 5xx rate > 1% for 5 minutes
- [ ] Weekly review: AI tool rejection rate, failed moves, auth errors

## Rollback

- [ ] Document previous deployment ID / git tag
- [ ] Rollback command documented for host (e.g. Vercel instant rollback)
- [ ] DB migrations are forward-only — document manual revert if needed

## Post-deploy (48h)

- [ ] Monitor REL metrics
- [ ] Review `ai_tool_calls` rejection rate
- [ ] Schedule full regression within 7 days of any hotfix

- [ ] Verify inquiry URL in Settings → Integrations (see [`INQUIRY_INTAKE.md`](./INQUIRY_INTAKE.md))

**Owner sign-off:** **\*\***\_\_\_**\*\*** **Date:** **\*\***\_\_\_**\*\***
