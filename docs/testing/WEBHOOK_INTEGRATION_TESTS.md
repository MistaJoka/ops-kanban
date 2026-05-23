# Webhook & integration tests (T11)

**Run alone:** `npm run test:webhooks`  
**When:** Wave 1+ enabled (`PLATFORM_CAPABILITIES.md`)  
**Couples:** FMEA F-W1-\*, R-20 R-21, T03 forged webhook

## Test harness

- Mock provider payloads in `tests/fixtures/webhooks/{paypal,stripe,twilio,docusign}/`
- POST to `/api/webhooks/{provider}`
- Assert `integration_events` + card state

## WH-PAY — Payments (Wave 1)

| ID         | Event                      | Expected                            | P   |
| ---------- | -------------------------- | ----------------------------------- | --- |
| WH-PAY-001 | Invalid signature          | 401, no DB change                   | P0  |
| WH-PAY-002 | payment.completed valid    | invoice paid, card `paid`, activity | P0  |
| WH-PAY-003 | Duplicate same external_id | idempotent skip                     | P0  |
| WH-PAY-004 | Amount mismatch            | fail + integration_events failed    | P0  |
| WH-PAY-005 | Pay link wrong invoice id  | no update                           | P0  |
| WH-PAY-006 | payment.failed             | activity, balance unchanged         | P1  |

## WH-SMS — Twilio (Wave 2)

| ID         | Event                   | Expected                  | P   |
| ---------- | ----------------------- | ------------------------- | --- |
| WH-SMS-001 | Inbound SMS known phone | comment on matched card   | P0  |
| WH-SMS-002 | Inbound unknown phone   | new inquiry card optional | P1  |
| WH-SMS-003 | Invalid signature       | 401                       | P0  |

## WH-SIGN — DocuSign (Wave 3)

| ID          | Event              | Expected                        | P   |
| ----------- | ------------------ | ------------------------------- | --- |
| WH-SIGN-001 | envelope.completed | card `approved`, signatures row | P0  |
| WH-SIGN-002 | envelope.declined  | activity, no approve            | P1  |

## WH-BOOK — Calendly (Wave 2)

| ID          | Event           | Expected             | P   |
| ----------- | --------------- | -------------------- | --- |
| WH-BOOK-001 | invitee.created | card in `site_visit` | P1  |

## Modular run

Wave 1 release gate: **WH-PAY-\* all P0 pass** before enabling prod keys.
