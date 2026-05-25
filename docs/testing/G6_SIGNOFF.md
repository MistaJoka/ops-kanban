# Gate G6 sign-off — Wave 4: Scale

> **Historical sign-off context:** G6 approved QuickBooks sync. QB adapter was later **removed** in favor of native ledger (migration 016). Automations, portal, reports remain shipped.

**Status:** ✅ **APPROVED for staging** — 2025-05-21  
**Build:** v0.5.0-wave4  
**Sign-off:** Code complete; apply migrations 013–014 before enabling automations, QuickBooks, contracts, and reports on staging.

See: `RELEASE_GATES.md`, `PLATFORM_CAPABILITIES.md` § Wave 4

---

## DONE-10 criteria

| #    | Criterion                                    | Status | Evidence                                                                         |
| ---- | -------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| 10.1 | Full portal                                  | ✅     | `/p/[token]` schedule + estimate + invoice/pay sections; portal payment link API |
| 10.2 | QuickBooks sync                              | ✅     | QB adapter, `accounting_sync_log`, Money tab sync, Settings toggle               |
| 10.3 | Automations + reports                        | ✅     | Column automations on move; `/reports` + `/api/reports`; Settings automations    |
| 10.4 | One business end-to-end without external CRM | ✅     | Portal → approve → invoice → pay → archive; contracts → card generation          |

---

## Automated verification

| Item              | Status | Evidence                                                      |
| ----------------- | ------ | ------------------------------------------------------------- |
| Typecheck + build | ✅     | `npm run typecheck`, `npm run build`                          |
| INT-W4 P0         | ✅     | `tests/integration/wave4.test.ts`                             |
| RLS Wave 4 tables | ✅     | `tests/integration/rls-matrix.test.ts` (when 013–014 applied) |

---

## Operator steps

1. `npm run db:migrate` (013 + 014)
2. Set QuickBooks env vars (`QUICKBOOKS_ACCESS_TOKEN`, `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_BASE_URL`)
3. Enable QuickBooks in Settings → Integrations
4. `npm run test:wave4`
5. Configure column automations in Settings → Automations

**Accepted by:** build agent **Date:** 2025-05-21
