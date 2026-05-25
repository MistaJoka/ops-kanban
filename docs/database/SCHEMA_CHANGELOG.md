# Schema changelog — migrations 007–021

Extensions to the Wave 0 core in [`MVP_SCHEMA.md`](./MVP_SCHEMA.md). Apply in order via `npm run db:migrate`.

Full migration files: `supabase/migrations/`.

---

## 007 — Wave 1 payments (`007_wave1_payments.sql`)

| Table | Purpose |
| ----- | ------- |
| `payments` | Payment records linked to invoices |
| `integration_events` | Webhook event log + dedupe |
| `integration_accounts` | Org integration toggles (Stripe, Twilio, etc.) |
| `portal_tokens` | Customer portal access tokens |

RLS: `008_wave1_rls.sql`

---

## 009 — Wave 2 comms & scheduling (`009_wave2_comms_scheduling.sql`)

| Table | Purpose |
| ----- | ------- |
| `booking_pages` | Public `/book/{slug}` config |
| `booking_requests` | Booking submissions |
| `schedule_events` | Crew schedule entries |
| `message_templates` | SMS/email templates |
| `messages` | Inbound/outbound comms on cards |

RLS: `010_wave2_rls.sql`

---

## 011 — Wave 3 documents (`011_wave3_documents.sql`)

| Table | Purpose |
| ----- | ------- |
| `attachments` | Supabase Storage file refs on cards |
| `signatures` | Native portal e-sign audit trail |
| `envelopes` | Legacy envelope ids (native path primary) |

RLS: `012_wave3_rls.sql`

Card extensions: `parent_card_id` for change orders.

---

## 013 — Wave 4 scale (`013_wave4_scale.sql`)

| Table | Purpose |
| ----- | ------- |
| `automations` | Column-enter automation rules |
| `automation_runs` | Automation execution log |
| `accounting_sync_log` | Historical sync log (legacy; native ledger primary) |
| `contracts` | Recurring contract definitions |

RLS: `014_wave4_rls.sql`

---

## 015 — Polish automations (`015_polish_automations.sql`)

Automation trigger refinements and indexes.

---

## 016 — Native accounting (`016_native_accounting.sql`)

| Table | Purpose |
| ----- | ------- |
| `accounting_transactions` | Native AR/income ledger (replaces QuickBooks sync) |

---

## 017 — Column timing (`017_column_entered_at.sql`)

| Change | Purpose |
| ------ | ------- |
| `cards.column_entered_at` | Stuck-card signals, column dwell metrics |

---

## 018 — AI memories (`018_ai_memories.sql`)

| Table | Purpose |
| ----- | ------- |
| `ai_memories` | Org-scoped AI preference memory |

---

## 019 — Client idempotency (`019_client_mutations.sql`)

| Table | Purpose |
| ----- | ------- |
| `client_mutations` | Claim-first idempotency for authenticated card writes |

Header: `X-Client-Mutation-Id`. See [`API_PATTERNS.md`](../api/API_PATTERNS.md).

---

## 020 — Inquiry intake (`020_inquiry_intake.sql`)

| Table | Purpose |
| ----- | ------- |
| `inquiry_pages` | Public `/inquiry/{slug}` page config per org |
| `inquiry_requests` | Claim-first idempotency for public intake POSTs |

Domain: `lib/domain/intake/processIntake.ts`. Runbook: [`INQUIRY_INTAKE.md`](../ops/INQUIRY_INTAKE.md).

---

## 021 — Atomic intake RPCs (`021_atomic_intake.sql`)

| RPC | Purpose |
| --- | ------- |
| `process_intake_create_atomic` | Single-transaction intake: customer + card + activity |
| `create_booking_atomic` | Single-transaction booking create |

Used by public inquiry/book routes to avoid partial failure.

---

## RLS reminder

Every new table with `organization_id` needs policies in the matching `*_rls.sql` migration or additive policy file. Template: [`SIGNUP_BOOTSTRAP.md`](./SIGNUP_BOOTSTRAP.md) § RLS.
