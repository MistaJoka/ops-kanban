# Phased Build Plan — landscaping + platform waves

Engineering phases aligned to **Wave 0–4** in `PLATFORM_CAPABILITIES.md`.  
Product scope: `MVP_SCOPE.md`, `WORKSPACE_DESIGN.md`, `CARD_DESIGN.md`, `AI_UTILIZATION.md`.

---

## Wave 0 — MVP core (Phases 1–5)

### Phase 1: Foundation

- Supabase, auth, profiles ↔ `auth.users`
- organizations, RLS on all MVP tables
- signup bootstrap: org + board + landscaping columns (compact default)
- indexes

**Done when:** signup works; cross-org isolation verified.

### Phase 2: Workspace + pipeline

- App shell: collapsible nav, support pages, Job Pipeline board
- Column groups, filters, search, compact/full pipeline toggle
- Board cards + drag/drop + activity log

**Done when:** job runs through 9 columns manually.

### Phase 3: Deep card

- Detail slide-over, tabs (Overview → Money)
- Customer/property, scope, checklist, comments, timeline

**Done when:** real job data lives on one card.

### Phase 4: Money drafts

- Estimate + line items, invoice draft, manual paid, archive

**Done when:** estimate → invoice → mark paid without integrations.

### Phase 5: AI copilot

- Context loader, tools Tier 1–3, dock + card rail, approvals
- Inline summary + estimate draft CTA

**Done when:** AI assists without external sends.

---

## Wave 1 — Money & trust (Phase 6)

- Stripe **or** PayPal payment links on invoice
- Webhook handler + `payments` + `integration_events`
- Branded estimate PDF + email send (Resend)
- **Native estimate approve** on customer portal v0 (magic link)
- Receipt email on paid webhook
- Settings → Integrations (payments + email)

**Done when:** customer can pay invoice via link; card auto-updates to paid.

---

## Wave 2 — Time & conversation (Phase 7)

- Public booking page → inquiry/site visit card
- Crew calendar page (day/week)
- Twilio SMS thread on card
- Resend email thread on card
- Message templates
- AI: draft comms (send = approved)

**Done when:** inbound SMS attaches to card; visit books from public link.

---

## Wave 3 — Documents & compliance (Phase 8)

- Supabase Storage attachments on card
- DocuSign envelope from estimate (optional provider)
- Native sign fallback always available
- Change orders (`parent_card_id`)

**Done when:** signed estimate PDF stored on card with audit trail.

---

## Wave 4 — Scale (Phase 9+)

- Full customer portal (approve, pay, schedule view)
- QuickBooks sync
- Automations (column triggers)
- Reports + reviews request after paid
- Recurring maintenance contracts

**Done when:** one pilot business runs sales→production→billing→accounting without leaving OpsBoard.

---

## Hardening (continuous)

- Rate limits, error/empty states, mobile polish
- Integration health dashboard
- Webhook replay from `integration_events`
- Audit review

**Done when:** safe for production pilot with real money and messages.
