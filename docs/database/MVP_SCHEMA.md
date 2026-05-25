# MVP database schema

> **Wave 0 core only.** Post-MVP tables and RPCs (migrations `007`–`021`) are documented in [`SCHEMA_CHANGELOG.md`](./SCHEMA_CHANGELOG.md).

Tables **implemented** in `supabase/migrations/001_core_schema.sql`. Long-term reference for deferred items: `DATABASE_SCHEMA.md` (legacy banner).

## MVP tables

```txt
organizations (+ settings jsonb — migration 003)
profiles
organization_members
boards
columns
customers
cards (+ job_type, checklist_json — migration 003)
activities
comments
quotes
quote_items
invoices
ai_tool_calls
ai_action_approvals
```

Migrations: `001` core → `002` auth FK → `003` extensions → `004` RLS → `005` indexes → `006` triggers.

**Extensions:** See [`SCHEMA_CHANGELOG.md`](./SCHEMA_CHANGELOG.md) for `007`–`021`.

## Pipeline terminal state

Compact and full pipelines end at **`archived`** (`state_key`). See `DEFAULT_PIPELINE.md`.

## Not in MVP migration (defer or moved to changelog)

```txt
checklists, checklist_items          — still defer (use checklist_json on cards)
invoice_items, payments              — → SCHEMA_CHANGELOG 007
schedules, work_orders               — → SCHEMA_CHANGELOG 009 (schedule_events)
notifications                        — still defer (inline UI)
automations, automation_runs         — → SCHEMA_CHANGELOG 013
attachments, signatures, envelopes   — → SCHEMA_CHANGELOG 011
ai_conversations, ai_messages        — still defer
ai_memories                          — → SCHEMA_CHANGELOG 018
ai_summaries, ai_insights            — still defer
client_mutations, inquiry_*          — → SCHEMA_CHANGELOG 019–021
accounting_transactions              — → SCHEMA_CHANGELOG 016
```

## Auth linkage (required before production)

`profiles.id` must reference `auth.users(id)`. Add in migration `002_auth_profiles.sql`:

```sql
alter table profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;
```

## Landscaping pipeline

Columns are seeded with `state_key` values from `docs/product/DEFAULT_PIPELINE.md`. See `supabase/seed/landscaping_default_columns.sql`.

## Card model notes

- No separate `cards.status` — **column `state_key`** is the job state.
- Financial state lives on `quotes.status` and `invoices.status` (`draft`, `sent`, `paid`, etc. — enforce in app layer for MVP).
- Property address: `customers.address`; job site same as billing unless noted in `customers.notes`.

## RLS (Phase 1 — not optional)

Every MVP table with `organization_id` needs policies scoped to `organization_members` for the authenticated user. Template in `docs/database/SIGNUP_BOOTSTRAP.md` § RLS.

## Indexes (add in `002` or `003`)

```txt
cards (organization_id, board_id, column_id)
cards (organization_id, archived_at) where archived_at is null
activities (organization_id, entity_type, entity_id, created_at desc)
customers (organization_id, name)
```

## Activity log contract

| `action`           | When                                                      |
| ------------------ | --------------------------------------------------------- |
| `card.created`     | New card                                                  |
| `card.moved`       | Column change; metadata: `from_state_key`, `to_state_key` |
| `card.updated`     | Title, dates, assignment                                  |
| `customer.updated` | Property/customer fields                                  |
| `quote.drafted`    | Estimate created/updated                                  |
| `invoice.drafted`  | Invoice created                                           |
| `invoice.paid`     | Marked paid                                               |
| `ai.tool_executed` | Approved tool ran                                         |
| `inquiry.received` | Intake attached or new inquiry card (see SCHEMA_CHANGELOG) |
