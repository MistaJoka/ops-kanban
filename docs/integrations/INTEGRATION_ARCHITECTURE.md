# Integration architecture

How optional delivery pipes connect to OpsBoard. Business primitives (accounting, e-sign, booking) are **native domain code** — not third-party sync.

Parent doc: `PLATFORM_CAPABILITIES.md`.

---

## 1. Integration pattern

```txt
Optional provider (Stripe, Twilio, Resend)
    ↕ API key (Settings)
Next.js API route (/api/integrations/... or /api/webhooks/{provider})
    ↕ domain service (validate, map, idempotent write)
Supabase (cards, invoices, messages, payments, integration_events)
    ↕ realtime + activity log
UI (card tab + integration status)

Native modules (always on):
  accounting_transactions ← invoice issue / payment received
  signatures ← portal approve
  booking_pages ← public /book/{slug}
```

**Inbound webhooks:** `/api/webhooks/{provider}` → verify signature → `integration_events` → processor → update card.

**Outbound actions:** User or approved AI tool → queue or sync call → provider API → log result.

---

## 2. `integration_accounts` (Wave 1+)

```txt
id
organization_id
provider          -- stripe | paypal | twilio | resend
status            -- active | error | disconnected
credentials_ref   -- vault secret id (never plain JSON in row)
scopes[]
last_sync_at
error_message
created_at
```

One row per provider per org. Test connection writes `integration.test` activity.

---

## 3. `integration_events` (reliability backbone)

```txt
id
organization_id
provider
event_type        -- payment.completed | sms.received | ...
external_id       -- provider idempotency key
payload_json
process_status    -- pending | processed | failed
card_id           -- resolved after match
error_message
created_at
processed_at
```

Processor runs idempotent: if `external_id` exists and `processed`, skip.

---

## 4. Native accounting ledger

**Replaces QuickBooks sync.** No external accounting API.

| Event | Ledger entry | Hook |
|-------|--------------|------|
| Invoice created | `invoice_issued` | `createInvoiceDraft` |
| Payment settled | `payment_received` | `settleInvoicePayment` (manual + Stripe webhook) |

Table: `accounting_transactions` — org-scoped, RLS, CSV export via `/api/accounting/export`.

Reports page: AR register, aging buckets, income ledger.

---

## 5. Native e-sign

Portal magic link → customer approves estimate (name + IP) → `signatures` row (`provider: native`).

No DocuSign or third-party e-sign API.

---

## 6. Native booking

Public `/book/{org-slug}` → `createBooking` → `site_visit` card.

No Calendly integration.

---

## 7. Provider-specific notes (optional pipes)

### Stripe

- Payment Links on invoice total.
- Webhook → `settleInvoicePayment` → ledger + archive card.
- **Fallback:** Manual mark paid

### Twilio

- **Outbound:** SMS from card comms UI
- **Inbound:** webhook → normalize phone → find customer → card thread

### Resend / SendGrid (email)

- Outbound only MVP; inbound parse post-MVP

---

## 8. Customer portal auth

```txt
portal_tokens
  card_id
  token_hash
  expires_at
  scopes[]   -- view_estimate | approve | pay | view_schedule
```

Magic link: `/p/{token}` → read-only + scoped actions (approve, pay redirect).

---

## 9. Security

- Webhook secrets per org or global + org resolved from payload metadata
- RLS: integration tables scoped by `organization_id`
- Service role only in webhook handlers

---

## 10. Environment variables

```env
# Wave 1
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Wave 2
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
RESEND_API_KEY=
```

No QuickBooks, DocuSign, or Calendly env vars.

---

## 11. Card UI: Integration strip

```txt
Integrations
  Stripe       ● Paid $1,240 · 5/20/26
  Estimate sign ○ Awaiting portal approval
  Twilio       ● 2 unread SMS
  Accounting   ● AR $420 due
```

Errors surface inline—not buried in Settings only.
