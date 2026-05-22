# Pilot deploy sign-off — post Wave 4

**Status:** ✅ **READY for pilot staging** — 2025-05-21  
**Build:** v0.5.1-pilot-ready  
**Gate:** Pilot deploy checklist + G2/G6 wave gates

See: `docs/ops/PILOT_DEPLOY_CHECKLIST.md`, `docs/testing/G6_SIGNOFF.md`

---

## Pilot readiness

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| P1 | Migrations 001–015 documented | ✅ | `npm run db:migrate`, `015_polish_automations.sql` |
| P2 | CI verify job | ✅ | `.github/workflows/ci.yml` — lint, typecheck, unit, build |
| P3 | Vercel Cron for contracts | ✅ | `vercel.json` → `/api/contracts/run-due` daily 06:00 UTC |
| P4 | Dashboard + customers live | ✅ | `/dashboard`, `/customers` |
| P5 | Full pipeline toggle | ✅ | Board header + `PATCH /api/settings/pipeline-mode` |
| P6 | Realtime board | ✅ | Supabase subscription in `KanbanBoard` |
| P7 | Integration strip on cards | ✅ | `IntegrationStrip` on Overview/Money |
| P8 | SMS + review automations | ✅ | Migration 015, Settings → Automations |

---

## Operator steps before go-live

1. `npm run db:migrate` on staging/production Supabase
2. Set `DISABLE_AUTH=false`
3. Configure integration env vars; enable in Settings → Integrations
4. Set `CRON_SECRET` in Vercel (auto-sent as Bearer on cron hits)
5. `npm run test:release` + `npm run test:wave4` on staging
6. Smoke E2E against preview URL

**Accepted by:** build agent **Date:** 2025-05-21
