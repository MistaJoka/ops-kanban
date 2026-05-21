# Full landscaping pipeline — columns

Complete **19-column** lifecycle for landscaping SMBs. Maps to `END_TO_END_WORKFLOWS.md` with stable `state_key` values for DB, AI, and reports.

**MVP default:** 9-column compact pipeline in `DEFAULT_PIPELINE.md`.  
**Full pipeline:** enable in Settings or top bar **Compact / Full** toggle.

Implementation: `src-starter/lib/landscaping-full-pipeline.ts` + optional seed `supabase/seed/landscaping_full_columns.sql`.

---

## Column groups

```txt
┌─ Intake & sales (7) ─────────────────────────────────────────────┐
│ inquiry → qualified → site_visit → estimating → estimate_sent   │
│ → negotiation → approved                                         │
└──────────────────────────────────────────────────────────────────┘
┌─ Production (6) ─────────────────────────────────────────────────┐
│ scheduling → ready → on_site → blocked → walkthrough → complete │
└──────────────────────────────────────────────────────────────────┘
┌─ Billing (5) ────────────────────────────────────────────────────┐
│ invoice_prep → invoice_sent → payment_pending → paid            │
└──────────────────────────────────────────────────────────────────┘
┌─ Aftercare (2) ──────────────────────────────────────────────────┐
│ retention → archived                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## All columns

| Pos | Display name | `state_key` | Group | Landscaping meaning |
|-----|--------------|-------------|-------|---------------------|
| 0 | New inquiry | `inquiry` | sales | Call, form, referral — not qualified |
| 1 | Qualified | `qualified` | sales | Real job; budget/timeline plausible |
| 2 | Site visit | `site_visit` | sales | Measure, photos, access, utilities |
| 3 | Estimating | `estimating` | sales | Building estimate in office |
| 4 | Estimate sent | `estimate_sent` | sales | Waiting on homeowner |
| 5 | Negotiation | `negotiation` | sales | Revisions, counter, follow-ups |
| 6 | Approved | `approved` | sales | Sold; handoff to production |
| 7 | Scheduling | `scheduling` | production | Picking crew day / route slot |
| 8 | Ready | `ready` | production | Materials, checklist, truck loaded |
| 9 | On site | `on_site` | production | Crew at property |
| 10 | Blocked | `blocked` | production | Weather, access, parts — needs action |
| 11 | Walkthrough | `walkthrough` | production | Quality check with customer |
| 12 | Job complete | `complete` | billing | Work done; ready to bill |
| 13 | Invoice prep | `invoice_prep` | billing | Drafting invoice |
| 14 | Invoice sent | `invoice_sent` | billing | Invoice delivered |
| 15 | Payment pending | `payment_pending` | billing | Awaiting check/ACH/cash |
| 16 | Paid | `paid` | billing | Payment recorded |
| 17 | Follow-up | `retention` | aftercare | Review ask, upsell, next season |
| 18 | Archived | `archived` | aftercare | Closed record; `archived_at` set |

**Total: 19 columns.** (Workflow doc “21” counted optional states; use `lost` / `on_hold` below if needed.)

---

## Optional columns (v2)

| Display name | `state_key` | When to use |
|--------------|-------------|-------------|
| On hold | `on_hold` | Customer paused; stays in sales group |
| Lost | `lost` | Did not win job; before archived |

---

## Compact (9) ↔ Full (19) mapping

| Compact `state_key` | Full column(s) merged |
|---------------------|------------------------|
| `inquiry` | `inquiry`, `qualified` |
| `site_visit` | `site_visit` |
| `estimating` | `estimating` |
| `estimate_sent` | `estimate_sent`, `negotiation` |
| `approved` | `approved` |
| `scheduled` | `scheduling`, `ready` |
| `on_site` | `on_site`, `blocked`, `walkthrough` |
| `complete` | `complete`, `invoice_prep`, `invoice_sent`, `payment_pending` |
| `closed` | `paid`, `retention`, `archived` |

When switching **Compact → Full**, split cards by rules in app layer (e.g. `closed` → `paid` unless `archived_at` → `archived`).

When switching **Full → Compact**, map to nearest compact key (document in migration script).

---

## Column category colors (board accent)

Same as `CARD_DESIGN.md` left border:

| Group | CSS var | Keys |
|-------|---------|------|
| sales | `--cat-sales` | inquiry … approved |
| production | `--cat-production` | scheduling … walkthrough |
| billing | `--cat-billing` | complete … paid |
| aftercare | `--cat-aftercare` | retention, archived |

Add `--cat-aftercare: #6b5b73` (muted plum) for archived/follow-up.

---

## Validation by `state_key` (full pipeline)

Extends compact rules in `CARD_DESIGN.md`.

| `state_key` | Gate / prompt |
|-------------|---------------|
| `qualified` | Suggest customer record |
| `site_visit` | Suggest `due_date` |
| `estimate_sent` | Estimate total > 0 |
| `negotiation` | — |
| `approved` | — |
| `scheduling` | `scheduled_start` required |
| `ready` | Checklist complete (soft prompt) |
| `on_site` | Log `work.started` |
| `blocked` | Require `next_action` |
| `walkthrough` | — |
| `complete` | Prompt invoice prep |
| `invoice_sent` | Invoice status sent |
| `payment_pending` | `balance_due > 0` |
| `paid` | Balance zero |
| `retention` | Optional: schedule follow-up date |
| `archived` | Set `archived_at` |

---

## Column metrics (header)

Per column, show:

- **Count** of non-archived cards
- **Sum** of `revenue_value` (or active quote total if higher)

Group header shows sum of child columns.

---

## Board UX with 19 columns

| Technique | Purpose |
|-----------|---------|
| Collapsible groups | Hide whole sales/production/billing/aftercare |
| Group jump chips | Scroll to group |
| Horizontal scroll | Primary navigation |
| Sticky group headers | Headers pin while scrolling vertically within column |
| Compact mode toggle | Fall back to 9 columns on smaller laptops |

**Not recommended:** 19 visible columns without groups on 1440px — requires ~5700px scroll width.

---

## Seed order

Positions 0–18 monotonic. On org create with `pipeline_mode: full`, insert all 19 rows in `columns` table.

See `landscaping-full-pipeline.ts` for bootstrap constant.

---

## AI and reporting

- Tools use `state_key`, not display names.
- Reports group by `group_key` for funnel: lead → sold → produced → paid.
- AI daily briefing uses full keys when mode is full.
