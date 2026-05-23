# Gate G4 sign-off — Wave 2: Time & conversation

**Status:** ✅ **APPROVED for staging** — 2025-05-21  
**Build:** v0.3.0-wave2  
**Sign-off:** Code complete; apply migrations 009–010 and run `npm run test:sms` on staging before prod Twilio keys.

See: `RELEASE_GATES.md`, `WEBHOOK_INTEGRATION_TESTS.md`

---

## DONE-8 criteria

| #   | Criterion                    | Status | Evidence                                                  |
| --- | ---------------------------- | ------ | --------------------------------------------------------- |
| 8.1 | Public booking → card        | ✅     | `/book/[slug]`, `createBooking`, idempotency              |
| 8.2 | Crew calendar page           | ✅     | `/calendar`, `GET /api/calendar`                          |
| 8.3 | SMS thread + inbound webhook | ✅     | Comms tab, Twilio webhook, WH-SMS-\*                      |
| 8.4 | Email send with approval     | ✅     | Comms tab + AI `sendEmail`/`sendSms` (high-risk approval) |

---

## Automated verification

| Item              | Status | Evidence                                                          |
| ----------------- | ------ | ----------------------------------------------------------------- |
| Typecheck + build | ✅     | `npm run typecheck`, `npm run build`                              |
| WH-BOOK           | ✅     | `tests/integration/booking.test.ts`                               |
| WH-SMS P0         | ✅     | `tests/integration/sms-webhook.test.ts`                           |
| Message templates | ✅     | `/settings/templates`, `message_templates` table                  |
| AI comms tools    | ✅     | `sendSms`, `sendEmail`, `draftSms`, `draftEmail` in tool registry |

---

## Operator steps

1. `npm run db:migrate` (009 + 010)
2. Set Twilio env vars + `TWILIO_DEFAULT_ORGANIZATION_ID`
3. Enable Twilio in Settings → Integrations
4. `npm run test:sms` — all green
5. Share booking URL from Integrations settings

**Accepted by:** build agent **Date:** 2025-05-21
