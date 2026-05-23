# Card design — landscaping MVP

Cards are **property jobs** on the Job Pipeline board. This document defines logic, layout, style, and capabilities for:

1. **Board card** — scan and move work in the column
2. **Detail panel** — run the job (customer, scope, estimate, schedule, money, history)

Related: `DEFAULT_PIPELINE.md`, `VERTICAL_LANDSCAPING.md`, `MVP_SCHEMA.md`.

---

## 1. Card identity and logic

### What a card represents

| Rule     | Detail                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| One card | One job at one property for one sales→production→billing cycle                  |
| State    | `columns.state_key` only — no separate `cards.status`                           |
| Customer | Optional at create; required before `estimate_sent`                             |
| Money    | 0–1 active estimate (`quotes`), 0–1 active invoice (`invoices`) per card in MVP |
| Archive  | `archived_at` set when moved to `archived` (or explicit archive action)         |

### Title convention

Default pattern on create:

```txt
{Customer last name or property label} — {Short service}
```

Examples:

- `Rivera — Spring cleanup`
- `Oak St rental — Weekly mow`
- `Miller HOA — Mulch install`

Parser is not required; AI and quick-create suggest this format.

### Recommended schema addition (migration `002`)

Store job type explicitly instead of parsing the title:

```sql
alter table cards add column if not exists job_type text
  check (job_type in ('maintenance','install','hardscape','cleanup','irrigation','other'));
```

### Computed fields (client + API)

Derived when loading cards for the board or detail:

| Field              | Logic                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `daysInColumn`     | `now - column_entered_at`; reset when `column_id` changes (migration 017)                   |
| `isOverdue`        | `due_date < today` and not in `archived` column                                             |
| `isScheduledToday` | `scheduled_start` is today (org timezone)                                                   |
| `moneyBadge`       | `none` \| `estimate_draft` \| `estimate_sent` \| `invoice_draft` \| `balance_due` \| `paid` |
| `scheduleLabel`    | e.g. `Thu 5/22 · Crew A` from `scheduled_start` + assignee                                  |
| `columnCategory`   | `sales` \| `production` \| `billing` from `state_key` map below                             |

```ts
const COLUMN_CATEGORY: Record<StateKey, 'sales' | 'production' | 'billing' | 'aftercare'> = {
  inquiry: 'sales',
  site_visit: 'sales',
  estimating: 'sales',
  estimate_sent: 'sales',
  approved: 'production',
  scheduled: 'production',
  on_site: 'production',
  complete: 'billing',
  archived: 'aftercare',
};
```

### Move validation (domain layer)

| Target `state_key` | Validation                                        | Prompt                       |
| ------------------ | ------------------------------------------------- | ---------------------------- |
| `site_visit`       | —                                                 | Suggest `due_date` for visit |
| `estimating`       | Customer or title identifies property             | —                            |
| `estimate_sent`    | Customer + ≥1 quote line or total > 0             | Block if empty estimate      |
| `approved`         | —                                                 | —                            |
| `scheduled`        | `scheduled_start` required                        | Modal if missing             |
| `on_site`          | —                                                 | Log activity `work.started`  |
| `complete`         | —                                                 | Prompt: create invoice draft |
| `archived`         | Invoice paid OR user confirms archive without pay | Set `archived_at`            |

**Skips** (owner/manager): `inquiry→estimating`, `estimate_sent→approved`, `on_site→complete`, `complete→archived` — require `reason` in activity metadata.

**Workers**: can move card and edit scope/schedule on assigned cards; cannot skip columns or close without pay.

**Viewers**: read-only; no drag.

### Optimistic UI

- Drag updates column immediately; rollback on API error with toast.
- Detail saves debounce 400ms on text fields; instant on select/date/assignee.

### Realtime

Subscribe per board: `cards` insert/update/delete, `columns` reorder. Merge by `id`; do not full-page refresh.

---

## 2. Board card — layout

### Size and density

**Default: comfortable** (readable on laptop and tablet in the truck).

| Token             | Value                       |
| ----------------- | --------------------------- |
| Min height        | 128px                       |
| Width             | Column width − 16px padding |
| Max visible lines | Title 2, meta 1, footer 1   |

Optional compact mode (settings post-MVP): 96px min, single-line title.

### Wireframe (board card)

```txt
┌─ 4px category accent (sales | production | billing) ─────────────┐
│ Rivera — Spring cleanup                          [urgent] [●]   │
│ 142 Oak Lane · maintenance                                       │
│ ┌──────┐  $1,240 est.    📅 Thu 5/22    👤 J. Torres           │
│ │ mow  │  balance due                                       ⋮  │
│ └──────┘                                                         │
│ Next: Send estimate follow-up · 3d in column                     │
└──────────────────────────────────────────────────────────────────┘
```

### Information hierarchy (top → bottom)

1. **Title** — primary scan
2. **Property line** — `address` truncated 32 chars OR `customer.name` if no address
3. **Meta row** — job type chip, money badge, schedule (if `scheduled`+), assignee avatar
4. **Footer** — `next_action` truncated; secondary: days in column / overdue

### Interactions (board)

| Action                   | Behavior                             |
| ------------------------ | ------------------------------------ |
| Click card body          | Open detail panel                    |
| Drag handle / whole card | Move column (role-gated)             |
| `⋮` menu                 | Assign, set date, move to…, archive  |
| Double-click title       | Inline rename (owner/manager/worker) |
| Hover                    | Lift shadow + show `⋮`               |

### Board card — do not show

- Full description, line items, comment thread, timeline
- More than two badges (collapse to `+2`)

---

## 3. Detail panel — layout

### Container

| Viewport | Pattern                                             |
| -------- | --------------------------------------------------- |
| Desktop  | **Slide-over** from right, 720px wide, board dimmed |
| Mobile   | Full-screen sheet, sticky header + back             |

Not a small centered modal — this is the operational record.

### Structure

```txt
┌ Header ──────────────────────────────────────────────────────────┐
│ [←]  Rivera — Spring cleanup          [Estimating ▼]  [⋮]       │
│      142 Oak Lane · maintenance · $1,240                         │
└──────────────────────────────────────────────────────────────────┘
┌ Tabs (scroll) ───────────────────────────────────────────────────┐
│ Overview │ Property │ Scope │ Estimate │ Schedule │ Money │ ···  │
└──────────────────────────────────────────────────────────────────┘
┌ Main (flex) ────────────────────────┬ Right rail (desktop only) ─┐
│  [active tab content]               │  Activity timeline         │
│                                     │  ─────────────────         │
│                                     │  AI copilot (collapsed)    │
└─────────────────────────────────────┴────────────────────────────┘
```

**Tabs (MVP)**

| Tab                              | Contents                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| **Overview**                     | Priority, `next_action`, `due_date`, assignee, revenue, AI summary block, quick move buttons |
| **Property**                     | Customer CRUD: name, phone, email, address, gate/access notes                                |
| **Scope**                        | `description` rich text (markdown-lite), job type select                                     |
| **Estimate**                     | Quote status, line items table, subtotal/tax/total, "Mark sent"                              |
| **Schedule**                     | `scheduled_start/end`, assignee, weather/note field in comments                              |
| **Money**                        | Invoice draft, balance, pay link (Wave 1), mark paid                                         |
| **Comms** (Wave 2)               | SMS/email thread on card                                                                     |
| **Integrations strip** (Wave 1+) | PayPal/Stripe, DocuSign, Twilio status — `PLATFORM_CAPABILITIES.md`                          |
| **Checklist**                    | Simple checklist (local state or JSON in description until table exists)                     |
| **Comments**                     | Thread + @mention post-MVP                                                                   |

**Right rail**

- Reverse-chronological **activity** (moves, money, AI, comments)
- **AI command** compact bar (same as board, `page: 'card'`)

Mobile: Timeline and AI move to **Overview** bottom or overflow tab "Activity".

### Header capabilities

- **Column dropdown** — move with validation prompts
- **Priority** — low / medium / high / urgent
- **⋮** — Duplicate (post-MVP), Archive, Copy link

---

## 4. Visual style

Visual direction and attention hierarchy defer to [`UI_MASTER_FORMULA.md`](UI_MASTER_FORMULA.md). Token values live in [`DESIGN_TOKENS.md`](DESIGN_TOKENS.md).

### Direction: **Field ledger**

Utilitarian job-ticket clarity for office staff and crew leads — not a generic SaaS dashboard. Feels like a well-organized paper board digitized: crisp type, earthy palette, strong hierarchy.

### Color system (CSS variables)

```css
/* Surfaces */
--surface-board: #f4f1ec; /* warm stone */
--surface-card: #ffffff;
--surface-rail: #faf8f5;

/* Text */
--text-primary: #1a1f16;
--text-secondary: #5c6356;

/* Accent — single brand green */
--accent: #2d5a3d;
--accent-muted: #e8f0eb;

/* Column category accents (left border) */
--cat-sales: #4a6fa5;
--cat-production: #2d5a3d;
--cat-billing: #b8860b;

/* Semantic */
--urgent: #c44d34;
--overdue: #c44d34;
--paid: #2d5a3d;
--draft: #8a8478;
```

Dark mode post-MVP.

### Typography

| Role                    | Font                                  | Notes                           |
| ----------------------- | ------------------------------------- | ------------------------------- |
| UI / body               | **DM Sans**                           | Legible at small sizes          |
| Titles / column headers | **Fraunces** or **Libre Baskerville** | Slight character, “job ticket”  |
| Mono (money, dates)     | **IBM Plex Mono**                     | Align numbers in estimate table |

Avoid Inter, Roboto, system-ui-only stacks.

### Board card styling

- White card on stone board; `border-radius: 10px`
- **4px left border** = column category color
- Shadow: `0 1px 2px rgba(26,31,22,.06)`; hover `0 4px 12px rgba(26,31,22,.1)`
- Dragging: slight rotate (1deg) + elevated shadow
- Urgent: thin top stripe `--urgent`, not full red card
- Overdue: dotted outline `--overdue` + footer label

### Badges

| Badge       | When                                        |
| ----------- | ------------------------------------------- |
| `$1.2k`     | `revenue_value > 0` or quote total          |
| `Est. sent` | quote status sent                           |
| `Due $400`  | invoice `balance_due > 0`                   |
| `Paid`      | invoice paid                                |
| `Today`     | scheduled today                             |
| `3d`        | days in column (sales columns only if > 2d) |

### Detail panel styling

- Header: `--surface-rail`, title in Fraunces 20px
- Tabs: underline active in `--accent`, no pill overload
- Estimate table: zebra rows, right-aligned money in mono
- Empty states: illustration-free; one line + CTA ("Add line item")

### Motion

- Card drag: 150ms ease on drop slot highlight
- Panel open: slide 280ms cubic-bezier(.2,.8,.2,1)
- Tab switch: cross-fade 120ms
- No gratuitous page-load animations

---

## 5. Capabilities matrix

### Board card

| Capability         | MVP | Role                                          |
| ------------------ | --- | --------------------------------------------- |
| Create (quick)     | ✓   | owner, manager, worker                        |
| Create from AI     | ✓   | via tool + approval                           |
| Drag move          | ✓   | owner, manager, worker\*                      |
| Menu move          | ✓   | all non-viewer                                |
| Inline title edit  | ✓   | non-viewer (double-click)                     |
| Filter/sort column | ✓   | all                                           |
| Assign from menu   | ✓   | owner, manager                                |
| Archive from menu  | ✓   | owner, manager                                |
| Advanced filters   | ✓   | assigned, unassigned, balance, job type, week |

\*Worker: only cards assigned to them or unassigned (configurable).

### Detail panel

| Capability                  | MVP      | Role                    |
| --------------------------- | -------- | ----------------------- |
| Edit all card fields        | ✓        | non-viewer              |
| Edit customer               | ✓        | owner, manager          |
| Customer read               | ✓        | all                     |
| Estimate CRUD               | ✓        | owner, manager          |
| Invoice + mark paid         | ✓        | owner, manager          |
| Mark estimate sent          | ✓        | owner, manager          |
| Comments                    | ✓        | non-viewer              |
| Checklist                   | ✓ simple | non-viewer              |
| Files upload                | ✓        | owner, manager (Wave 3) |
| AI summarize / draft / move | ✓        | per tool registry       |
| Activity timeline           | ✓ read   | all                     |

### Quick create (board `+`)

Minimal fields:

1. Title (required)
2. Property / customer name (optional)
3. Address (optional)
4. Job type (optional)
5. Column default: `inquiry`

Opens detail after create if address or customer missing and user moves toward `estimate_sent`.

---

## 6. Filters and board-level card queries

MVP board filter bar:

| Filter              | Query                     |
| ------------------- | ------------------------- |
| Assigned to me      | `assigned_to = uid`       |
| Unassigned          | `assigned_to is null`     |
| Overdue             | `due_date < today`        |
| Scheduled this week | `scheduled_start` in week |
| Has balance         | invoice `balance_due > 0` |
| Job type            | `job_type = X`            |

Search: title, customer name, address (ilike).

---

## 7. AI + card integration

See `docs/ai/AI_UTILIZATION.md` for full copilot behavior.

When detail open, AI context includes: card, customer, quote, invoice, last 15 activities, 5 comments, column `state_key`.

| Command           | Tool                | UI feedback                                 |
| ----------------- | ------------------- | ------------------------------------------- |
| Summarize         | `summarizeCard`     | Overview summary block (inline on open)     |
| Draft estimate    | `createQuoteDraft`  | Estimate tab preview + approve              |
| Move              | `moveCard`          | Approval modal if medium/high risk          |
| Suggest next step | `suggestNextAction` | Fills `next_action` with approve for medium |

**Inline CTAs:** estimating → “Draft estimate from notes”; complete → “Create invoice draft” (post-MVP tool).

After AI mutation: append `ai.tool_executed` to timeline; realtime refresh card.

---

## 8. Acceptance (card-specific)

1. Board card shows title, property line, money/schedule cues in &lt; 2s scan.
2. Drag from `inquiry` → `scheduled` without date shows validation modal.
3. Detail Estimate tab blocks `estimate_sent` until line items exist.
4. Move to `archived` sets `archived_at` and hides card on board (default filter).
5. Worker cannot close unpaid job without manager role.
6. Activity shows every column change with from/to `state_key`.

---

## 9. Open decisions (pick before build)

| #   | Decision              | Options                                                      |
| --- | --------------------- | ------------------------------------------------------------ |
| A   | Board card density    | **Comfortable (recommended)** vs Compact                     |
| B   | Detail pattern        | **Slide-over (recommended)** vs Full page route `/jobs/[id]` |
| C   | `job_type` column     | **Add in migration 002 (recommended)** vs title prefix only  |
| D   | Checklist storage     | **JSON on card** for MVP vs wait for table                   |
| E   | Closed cards on board | **Hidden by default** vs collapsed column                    |

Default recommendations marked above.
