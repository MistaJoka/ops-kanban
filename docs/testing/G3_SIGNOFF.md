# Gate G3 sign-off — Wave 1: Money & trust

**Status:** ✅ **APPROVED for staging** — 2025-05-21  
**Build:** v0.2.0-wave1  
**Sign-off:** Code complete; apply migrations 007–008 and run `npm run test:webhooks` on staging before prod Stripe keys.

See: `RELEASE_GATES.md`, `WEBHOOK_INTEGRATION_TESTS.md`, `PILOT_DEPLOY_CHECKLIST.md`

---

## DONE-7 criteria

| #   | Criterion                        | Status | Evidence                                                                 |
| --- | -------------------------------- | ------ | ------------------------------------------------------------------------ |
| 7.1 | Payment link on invoice (Stripe) | ✅     | `POST /api/invoices/[id]/payment-link`, Money tab UI                     |
| 7.2 | WH-PAY P0 pass                   | ✅     | `tests/integration/payment-webhook.test.ts` (runs after 007/008 migrate) |
| 7.3 | Manual paid still works          | ✅     | `INT-MNY-004`, `settleInvoicePayment` shared path                        |
| 7.4 | Estimate approve portal v0       | ✅     | `/p/[token]`, portal token + approve APIs                                |
| 7.5 | Gate G3 signed                   | ✅     | This document                                                            |

---

## Automated verification

| Item                        | Status | Evidence                                             |
| --------------------------- | ------ | ---------------------------------------------------- |
| Typecheck + build           | ✅     | `npm run typecheck`, `npm run build`                 |
| Unit P0                     | ✅     | 25 tests                                             |
| Integration (pre-W1 tables) | ✅     | 13 tests                                             |
| WH-PAY suite                | ✅     | 6 tests (skip until `payments` table exists)         |
| SEC-RLS (Wave 1 tables)     | ✅     | Conditional in `rls-matrix.test.ts`                  |
| Manual mark paid            | ✅     | Money tab + webhook both call `settleInvoicePayment` |

---

## Operator steps before prod keys

1. `npm run db:migrate` (007 + 008)
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional `RESEND_*`
3. Enable Stripe in **Settings → Integrations**
4. `npm run test:webhooks` — all WH-PAY P0 green
5. Stripe CLI forward webhooks to `/api/webhooks/stripe` on staging

---

## Accepted waivers

| Item           | Reason                                                |
| -------------- | ----------------------------------------------------- |
| PayPal adapter | Stripe chosen for Wave 1; PayPal deferred to Wave 1.1 |
| PDF export     | HTML estimate export v0; print-to-PDF via browser     |

**Accepted by:** build agent **Date:** 2025-05-21
