# Default landscaping pipeline

MVP uses **one primary board** with **9 columns** (compact mode). The **19-column full pipeline** is in `FULL_PIPELINE.md` with collapsible groups on the board.

Toggle compact/full in the workspace top bar or Settings (`WORKSPACE_DESIGN.md`).

## Columns (canonical)

| Position | Display name | `state_key` | Meaning |
|----------|--------------|-------------|---------|
| 0 | New inquiry | `inquiry` | Call, form, referral — not yet scoped |
| 1 | Site visit | `site_visit` | Measure, photos, access notes |
| 2 | Estimating | `estimating` | Building the estimate |
| 3 | Estimate sent | `estimate_sent` | Waiting on homeowner approval |
| 4 | Approved | `approved` | Sold; ready to schedule crew |
| 5 | Scheduled | `scheduled` | Date/crew on calendar (card dates set) |
| 6 | On site | `on_site` | Crew working the property |
| 7 | Complete | `complete` | Work done; ready to invoice |
| 8 | Closed | `closed` | Paid or written off; archive |

## Column rules

- **One board per organization** (`boards.is_primary = true`). No secondary boards in MVP.
- **`state_key` is stable** — used by AI tools (`columnStateKey`), automations, and reports. Display names can be renamed in Settings later without breaking keys.
- **Archive** — moving to `closed` sets `cards.archived_at` when payment is recorded or user explicitly closes without pay (document reason in activity log).

## Suggested transitions

```txt
inquiry → site_visit → estimating → estimate_sent → approved → scheduled → on_site → complete → closed
```

Allowed skips (owner/manager only, logged in activity):

- `inquiry` → `estimating` (returning customer, phone quote)
- `estimate_sent` → `approved` (verbal approval)
- `on_site` → `complete` (same-day small job)
- `complete` → `closed` (cash/check on site)

## Side effects by column (implement in domain layer)

| Move to | Optional prompts / writes |
|---------|---------------------------|
| `site_visit` | Set `due_date` for visit |
| `scheduled` | Require `scheduled_start`; set `assigned_to` |
| `on_site` | Log `activity`: work started |
| `complete` | Prompt: create invoice draft |
| `closed` | Set `archived_at`; ensure invoice `paid` or note |

## Seed data

Default columns are inserted on signup. See:

- `supabase/seed/landscaping_default_columns.sql`
- `docs/database/SIGNUP_BOOTSTRAP.md`

## Deferred states (post-MVP)

These map to MVP columns or card metadata until added:

| Full lifecycle state | MVP home |
|---------------------|----------|
| Negotiation | `estimate_sent` + comments |
| Blocked | `on_site` + priority urgent + next_action |
| Quality review | `complete` + checklist |
| Invoice pending/sent | `complete` + invoice draft |
| Payment pending | `complete` / `closed` + invoice status |
| Retention | `closed` + customer notes |
