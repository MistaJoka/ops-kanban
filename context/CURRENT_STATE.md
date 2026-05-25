# Current State

## Repo state

**Runnable Next.js app** at **pilot staging ready** (`mvp_status: pilot_staging_ready`).

- **Current phase:** P17 — backend reliability complete
- **Active task:** Apply migrations **020–021** on staging; pilot UAT for inquiry intake
- **Migrations on disk:** `001` through `021`

Use `context/` for fast orientation; use `docs/` for canonical truth.

## What exists

- Full Job Pipeline workspace with deep card panel, money, AI copilot, calendar, customers, reports
- Public intake: `/inquiry/{slug}`, booking: `/book/{slug}`, customer portal: `/p/{token}`
- Native accounting ledger, e-sign, booking (no QuickBooks/DocuSign adapters)
- 49 wrapped API routes; claim-first idempotency; public rate limits
- Supabase migrations through `021_atomic_intake.sql`

## Canonical entry points

- [`AGENTS.md`](../AGENTS.md)
- [`docs/roadmap/DOC_INDEX.md`](../docs/roadmap/DOC_INDEX.md)
- [`docs/roadmap/PROGRESS.md`](../docs/roadmap/PROGRESS.md)
- [`docs/roadmap/PHASE_TASKS.md`](../docs/roadmap/PHASE_TASKS.md)

## Main risk

Documentation volume can drift from code. Run `npm run check:doc-sync` after behavior changes. Session truth (`PROGRESS`, `LEARN`, `API_CONTRACTS` inventory) should match canonical specs.

## Check before work

```txt
Am I extending the existing system?
Am I following PROGRESS next tasks?
Am I preserving the board/card model?
Am I avoiding mock production data?
Am I updating progress/log docs after changes?
```
