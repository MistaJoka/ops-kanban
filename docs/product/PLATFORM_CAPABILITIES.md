# Platform capabilities — best-of-SaaS, scaled for landscaping SMBs

OpsBoard replaces a **stack of disconnected tools** with one **card-centric platform**. Each capability is a **module** attached to property jobs—not a separate app to learn.

**Design rule:** If it does not link to a `card_id` (or `customer_id` on a card), it does not ship.

Related: `MVP_SCOPE.md` (lean v1), `docs/roadmap/DEVELOPMENT_ROADMAP.md`, `AI_UTILIZATION.md`, `docs/integrations/INTEGRATION_ARCHITECTURE.md`.

---

## 1. Philosophy

| Top SaaS pattern             | OpsBoard scaled approach                                          |
| ---------------------------- | ----------------------------------------------------------------- |
| Best-in-class point solution | **Good-enough module** on the job card                            |
| Enterprise configuration     | **Sensible defaults** + 5–10 settings per module                  |
| Unlimited integrations       | **Curated providers** with manual fallback                        |
| AI everywhere                | AI **drafts and routes**; human approves external sends and money |
| Multiple sources of truth    | **Card + pipeline** remain canonical                              |

**Reliability over breadth:** A feature ships when it has webhook reconciliation, clear failure UI, and works offline-from-integration (manual override).

---

## 2. Capability map (inspired by top SaaS)

```txt
                    ┌─────────────────────────────────────┐
                    │         Job card (source of truth)   │
                    └─────────────────────────────────────┘
        ┌──────────┬──────────┬──────────┬──────────┬──────────┐
        ▼          ▼          ▼          ▼          ▼          ▼
     Pipeline   Schedule   Comms     Documents  Payments   Portal
   (Salesforce) (Calendly) (Twilio)  (DocuSign) (PayPal)  (Stripe)
        │          │          │          │          │          │
        └──────────┴──────────┴──── AI copilot ────┴──────────┘
```

### Module reference

| Module                  | Inspired by                              | Scaled OpsBoard feature                                   | Primary anchor      |
| ----------------------- | ---------------------------------------- | --------------------------------------------------------- | ------------------- |
| **Pipeline & CRM**      | Salesforce, HubSpot, Pipedrive           | Kanban job pipeline, customer/property, activity timeline | Card + customer     |
| **Scheduling**          | Calendly, Acuity                         | Booking links, crew calendar, conflict detection          | Card dates + events |
| **Communications**      | Intercom, Front, Twilio                  | SMS/email threads, templates, missed-call log             | Card timeline       |
| **E-sign & PDF**        | DocuSign, PandaDoc                       | Estimate/contract sign, PDF export, audit trail           | Quote on card       |
| **Payments**            | Stripe, PayPal, Square                   | Pay link, partial pay, mark paid, receipts                | Invoice on card     |
| **Documents**           | Dropbox, Google Drive                    | Photos, plans, signed PDFs per job                        | Card attachments    |
| **Accounting**          | QuickBooks, Xero                         | Native AR ledger, income transactions, CSV export         | Invoice + customer  |
| **Automations**         | Zapier, Make                             | When card enters X → send Y (approval optional)           | Card + column       |
| **Analytics**           | Mixpanel, Looker                         | Pipeline velocity, $ funnel, crew utilization             | Board aggregates    |
| **Customer portal**     | Stripe Billing Portal, Jobber client hub | Approve estimate, pay invoice, view schedule              | Magic link per card |
| **Reviews & retention** | Birdeye, NiceJob                         | Request review after `paid`                               | Card → retention    |
| **Team & access**       | Rippling-lite, Notion permissions        | Roles, assignees, audit                                   | Org + RLS           |
| **AI copilot**          | Cursor for ops                           | Draft, analyze, act via tools                             | Board + card        |

---

## 3. Release waves (feature-rich, phased)

### Wave 0 — MVP core (ship first)

Already specified in `MVP_SCOPE.md`.

- Pipeline, deep card, estimate/invoice **drafts**, manual paid, AI Tier 1–3, RLS, support shell.

**Explicitly manual:** send comms, collect payment, e-sign, calendar booking.

---

### Wave 1 — Money & trust (reliability priority)

| Capability            | Scaled feature                                                              | Provider options                      |
| --------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| **PayPal / card pay** | “Pay this invoice” link on card; webhook → `payment_pending` → `paid`       | PayPal Checkout, Stripe Payment Links |
| **PDF estimates**     | Branded estimate PDF + email **draft**                                      | React-PDF / Puppeteer, Resend         |
| **E-sign lite**       | Click-to-accept estimate on portal OR embedded sign (name + IP + timestamp) | Native first; DocuSign API optional   |
| **Receipts**          | Auto-receipt email on paid webhook                                          | Resend + template                     |

**Card UX:** Money tab shows Pay link status, last webhook event, “Mark paid manually” always visible.

**AI:** Draft payment reminder email; **never** charge or send without approval.

---

### Wave 2 — Time & conversation

| Capability        | Scaled feature                                                           | Provider options                                 |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| **Calendly-lite** | Org booking page: site visit / consultation slots → creates inquiry card | Native scheduler + optional Calendly embed/OAuth |
| **Crew calendar** | Day/week view of `scheduled_start` cards; drag reschedule                | Full calendar page                               |
| **SMS**           | Send/receive SMS on card thread; templates (“On our way”)                | Twilio                                           |
| **Email**         | Sync send via Resend/Postmark; thread on timeline                        | Resend, SendGrid                                 |
| **Click-to-call** | `tel:` + log “called customer” activity                                  | Native                                           |

**Reliability:** Inbound SMS webhook matches `customer.phone` → attaches to open card or creates inquiry.

---

### Wave 3 — Documents & compliance

| Capability         | Scaled feature                                       | Provider options                      |
| ------------------ | ---------------------------------------------------- | ------------------------------------- |
| **DocuSign-class** | Send estimate/contract for signature; status on card | DocuSign eSignature API, Dropbox Sign |
| **File vault**     | Before/after photos, insurance COI, permits          | Supabase Storage                      |
| **Versioned PDFs** | Estimate v1/v2 with sign on v2 only                  | Internal                              |
| **Change orders**  | Amendment card linked to parent job                  | `parent_card_id`                      |

---

### Wave 4 — Scale & ops intelligence

| Capability           | Scaled feature                                  | Provider options                |
| -------------------- | ----------------------------------------------- | ------------------------------- |
| **QuickBooks sync**  | Native accounting ledger                        | In-app AR + income transactions |
| **Automations**      | Column triggers + delays + conditions           | Internal `automations` table    |
| **Customer portal**  | Homeowner: approve estimate, pay, see schedule  | Magic link JWT                  |
| **Reports**          | Conversion, cycle time, revenue by job type     | Internal                        |
| **Review requests**  | SMS after paid → Google review link             | Twilio + template               |
| **Recurring routes** | Maintenance contract → recurring card instances | `contracts` table               |

---

## 4. Deep dives (scaled “best SaaS” behavior)

### 4.1 E-sign (DocuSign → Estimate Sign)

**Enterprise:** Multi-signer, CLM, legal audit.

**OpsBoard scaled:**

1. Estimate finalized on card → **Send for approval**
2. **Path A (native):** Customer portal → review line items → “Approve estimate” (name, checkbox, IP, timestamp) → card → `approved`
3. **Path B (DocuSign):** API envelope from PDF → webhook `envelope.completed` → same column move

Stored: `signatures` table (`card_id`, `quote_id`, `signer_name`, `signed_at`, `ip`, `provider`, `envelope_id`).

**AI:** Draft cover email; user sends. AI cannot sign on behalf of customer.

---

### 4.2 Scheduling (Calendly → Visit Book + Crew Schedule)

**Enterprise:** Round-robin, buffers, CRM sync.

**OpsBoard scaled:**

| Type              | Behavior                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Visit book**    | Public `/book/{org}` — pick service type → pick slot → creates `inquiry` card + `site_visit` |
| **Crew schedule** | Internal calendar filters `scheduled` / `on_site`; assignee, drive buffer (post-MVP)         |
| **Reschedule**    | Customer link or office drag → updates `scheduled_start` + activity                          |

**Reliability:** Idempotent booking token; double-book warning per crew per day.

**Calendly integration (optional):** OAuth; webhook `invitee.created` → `createCard` in `site_visit`.

---

### 4.3 Communications (Intercom + Twilio → Card Comms)

**Enterprise:** Shared inbox, bots, campaigns.

**OpsBoard scaled:**

- **Thread per card** (not per user inbox globally)
- **Templates:** estimate sent, reminder, on-the-way, review ask
- **Channels:** SMS, email (MVP Wave 2); voice log manual (post)
- **Inbound:** Webhook → match phone/email → append to card or new inquiry

**AI:** Draft message from card context; **send** = high-risk approval.

---

### 4.4 Payments (PayPal / Stripe → Collect on card)

**Enterprise:** Subscriptions, revenue recognition, multi-currency.

**OpsBoard scaled:**

| Step           | Behavior                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Invoice issued | Generate **payment link** (`payments` row: `card_id`, `invoice_id`, `provider`, `external_id`)        |
| Customer pays  | Webhook `payment.completed` → `invoice.balance_due = 0`, card → `archived` (compact) or `paid` (full) |
| Partial pay    | Support deposit on approve (hardscape); balance tracked                                               |
| Failure        | Webhook `failed` → activity + notify office; manual retry link                                        |

**PayPal:** Checkout Orders API or Payment Links.  
**Stripe:** Payment Links + Connect (if multi-tenant payouts later).

**Always:** Manual “Record check/cash” for field reality.

**AI:** “Who owes us money?” Analyze only; mark paid = high-risk tool.

---

### 4.5 Customer portal (Jobber / Stripe portal lite)

Single **magic link** per card (expires, revocable):

- View estimate → approve (native sign)
- View invoice → pay
- View scheduled date
- Upload gate code photo (Wave 3)

No full account required for homeowner.

---

### 4.6 Accounting (native ledger)

**Wave 4+:** In-app ledger — no QuickBooks API.

| Event                              | Ledger entry       |
| ---------------------------------- | ------------------ |
| Invoice created                    | `invoice_issued`   |
| Payment settled (manual or Stripe) | `payment_received` |

Reports: AR register, aging buckets, CSV export. OpsBoard card remains canonical for job status.

---

## 5. Settings → Integrations hub

```txt
Settings → Integrations
  ├── Payments      [PayPal] [Stripe]     status: connected / error
  ├── Scheduling    [Calendly] [Native]
  ├── E-sign        [Native portal]
  ├── Comms         [Twilio] [Resend]
  ├── Accounting    [Native ledger]
  └── Webhooks      (advanced, post-MVP)
```

Each tile: connect OAuth, test ping, last sync, disconnect.

Store credentials in Supabase vault / encrypted `integration_accounts` table.

---

## 6. Data model additions (by wave)

| Wave | New tables / fields                                                      |
| ---- | ------------------------------------------------------------------------ |
| 1    | `payments`, `payment_events`, `document_exports`                         |
| 1    | `signatures` (native approve)                                            |
| 2    | `schedule_events`, `booking_pages`, `messages`, `message_templates`      |
| 2    | `integration_accounts`                                                   |
| 3    | `attachments`, `envelopes` (DocuSign ids), `parent_card_id`              |
| 4    | `automations`, `automation_runs`, `portal_tokens`, `accounting_sync_log` |

All FK to `cards` or `customers` on cards.

---

## 7. AI across modules

| Module      | AI helps                     | AI must not             |
| ----------- | ---------------------------- | ----------------------- |
| Comms       | Draft SMS/email              | Send without approval   |
| E-sign      | Cover letter draft           | Sign                    |
| Payments    | Remind who to bill           | Charge cards            |
| Schedule    | Suggest slots from crew load | Book without confirm    |
| Accounting  | Explain sync errors          | Post journals           |
| Automations | Suggest rules from patterns  | Enable without approval |

Expand tools in `AI_TOOL_REGISTRY.md` per wave—each external action = tool + webhook proof.

---

## 8. Reliability checklist (every module)

- [ ] OAuth token refresh job
- [ ] Webhook signature verification
- [ ] Idempotency keys on payment/booking
- [ ] Dead-letter queue or `integration_events` log
- [ ] Manual override UI on card
- [ ] Activity log entry for every external event
- [ ] Feature flag per org
- [ ] Sandbox mode for PayPal/Stripe test keys

---

## 9. What “feature rich” does not mean

- 100 separate settings pages
- Replacing QuickBooks GL inside OpsBoard
- Marketing automation blasts
- Custom workflow builder for day one
- AI autopilot on customer-facing actions

It means: **one board** where a landscaping owner can sell, schedule, communicate, sign, collect, and reconcile—without leaving the job card.

---

## 10. Updated build sequence (capabilities)

```txt
Wave 0  MVP core (pipeline, card, drafts, AI, RLS)
Wave 1  Pay link + PDF + native estimate approve + receipts
Wave 2  Booking page + calendar + SMS/email threads
Wave 3  DocuSign + files + change orders
Wave 4  Portal + QB + automations + reports + reviews
```

Parallel track: expand AI tools as each wave ships.

Engineering phases: `docs/roadmap/PHASE_TASKS.md` (P7–P10 = Waves 1–4). Map: `docs/cursor/PHASED_BUILD_PLAN.md`.
