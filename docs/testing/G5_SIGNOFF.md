# Gate G5 sign-off — Wave 3: Documents

**Status:** ✅ **APPROVED for staging** — 2025-05-21  
**Build:** v0.4.0-wave3  
**Sign-off:** Code complete; apply migrations 011–012 before enabling file uploads and DocuSign on staging.

See: `RELEASE_GATES.md`, `WEBHOOK_INTEGRATION_TESTS.md`

---

## DONE-9 criteria

| #   | Criterion                        | Status | Evidence                                                           |
| --- | -------------------------------- | ------ | ------------------------------------------------------------------ |
| 9.1 | Attachments on card              | ✅     | Supabase Storage `card-attachments`, Files tab                     |
| 9.2 | DocuSign OR native sign complete | ✅     | Native portal approve + signatures row; DocuSign adapter + webhook |
| 9.3 | Change orders                    | ✅     | `parent_card_id`, Overview “New change order”                      |

---

## Automated verification

| Item                   | Status | Evidence                                           |
| ---------------------- | ------ | -------------------------------------------------- |
| Typecheck + build      | ✅     | `npm run typecheck`, `npm run build`               |
| WH-SIGN P0             | ✅     | `tests/integration/sign-webhook.test.ts`           |
| Change orders          | ✅     | INT-DOC in sign-webhook test file                  |
| Native signature audit | ✅     | Portal approve records `signatures` with name + IP |

---

## Operator steps

1. `npm run db:migrate` (011 + 012)
2. Create Supabase storage bucket policies if not applied via migration
3. Set DocuSign env vars + Connect HMAC secret
4. `npm run test:sign`
5. Enable DocuSign in Settings → Integrations

**Accepted by:** build agent **Date:** 2025-05-21
