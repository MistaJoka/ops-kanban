# Integration architecture

How external SaaS providers connect to OpsBoard reliably. Every integration serves **cards**, not standalone objects.

Parent doc: `PLATFORM_CAPABILITIES.md`.

---

## 1. Integration pattern

```txt
Provider (PayPal, Twilio, DocuSign, Calendly, QuickBooks)
    ↕ OAuth / API key (Settings)
Next.js API route (/api/integrations/{provider}/...)
    ↕ domain service (validate, map, idempotent write)
Supabase (cards, invoices, messages, payments, integration_events)
    ↕ realtime + activity log
UI (card tab + integration status)
```

**Inbound webhooks:** `/api/webhooks/{provider}` → verify signature → `integration_events` → processor → update card.

**Outbound actions:** User or approved AI tool → queue or sync call → provider API → log result.

---

## 2. `integration_accounts` (Wave 1+)

```txt
id
organization_id
provider          -- paypal | stripe | twilio | resend | docusign | calendly | quickbooks
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
event_type        -- payment.completed | sms.received | envelope.signed | booking.created
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

## 4. Provider-specific notes

### PayPal

- **Use:** Payment Links or Orders v2 capture on invoice total.
- **Webhook:** `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`
- **Card effect:** `payments` row + invoice paid + column `paid`/`closed`
- **Fallback:** Manual mark paid

### Stripe

- Same pattern as PayPal; prefer Payment Links for MVP parity.
- Connect deferred until multi-business marketplace needed.

### Twilio

- **Outbound:** `POST /Messages` from card comms UI
- **Inbound:** webhook → normalize phone → find customer → card thread
- **Store:** `messages` (`card_id`, `direction`, `body`, `provider_sid`)

### Resend / SendGrid (email)

- Outbound only MVP; inbound parse post-MVP
- Thread by `Message-ID` + `card_id` header custom field

### DocuSign

- Create envelope from estimate PDF
- Tabs: customer name, date, signature
- Webhook Connect → `envelope.completed` → `approved` + `signatures` row

### Calendly

- OAuth; subscribe to `invitee.created`
- Map event type → `job_type` + column `site_visit` or `inquiry`
- Optional: embed widget on marketing site

### QuickBooks

- OAuth2 refresh token job (cron)
- Push: Customer, Invoice, Payment
- Pull (later): payment status only
- `accounting_sync_log` for support debugging

---

## 5. Customer portal auth

```txt
portal_tokens
  card_id
  token_hash
  expires_at
  scopes[]   -- view_estimate | approve | pay | view_schedule
```

Magic link: `/p/{token}` → read-only + scoped actions (approve, pay redirect).

No Supabase auth session for homeowners.

---

## 6. Security

- Webhook secrets per org or global + org resolved from payload metadata
- RLS: integration tables scoped by `organization_id`
- Service role only in webhook handlers and token refresh
- PII in `messages` — retention policy in Settings (post-MVP)

---

## 7. Environment variables

```env
# Wave 1
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Wave 2
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
RESEND_API_KEY=

# Wave 3
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_USER_ID=

# Wave 4
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
```

`.env.example` updated when each wave starts implementation.

---

## 8. Card UI: Integration strip

On card **Overview** or **Money** tab:

```txt
Integrations
  PayPal     ● Paid $1,240 · 5/20/26
  DocuSign   ○ Awaiting signature
  Twilio     ● 2 unread SMS
  [Sync now] [View log]
```

Errors surface inline—not buried in Settings only.
