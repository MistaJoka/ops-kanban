# App Pages

**Status column:** `P0` = Wave 0 · `Shipped` = built in app · `Public` = unauthenticated

## Public pages

| Page | Status | Route | Notes |
| ---- | ------ | ----- | ----- |
| Landing | P0 optional | `/` | Redirect to login or pipeline |
| Login | P0 | `/login` | Supabase auth |
| Signup | P0 | `/signup` | Org + board + 9 columns, **zero cards** |
| **Inquiry form** | Shipped | `/inquiry/[slug]` | Public quote request → `processIntake` — [`INQUIRY_INTAKE.md`](../ops/INQUIRY_INTAKE.md) |
| **Booking page** | Shipped | `/book/[slug]` | Site visit / consultation slots |
| **Customer portal** | Shipped | `/p/[token]` | Approve estimate, payment link |

## App pages (authenticated)

| Page | Status | Route | Notes |
| ---- | ------ | ----- | ----- |
| **Job Pipeline** | P0 | `/pipeline` | Primary workspace — `WORKSPACE_DESIGN.md` |
| **Card detail** (slide-over) | P0 | (panel) | Not a separate route |
| Dashboard | Shipped | `/dashboard` | `MINIMAL_DASHBOARD.md` — real aggregates |
| Customers | Shipped | `/customers` | CRM lens, linked cards |
| Calendar | Shipped | `/calendar` | Week view, scheduled cards |
| Reports | Shipped | `/reports` | Velocity, AR, ledger |
| Settings | Shipped | `/settings/*` | Org, team, integrations, templates, automations, contracts |
| Support | Shipped | `/support/*` | Help, contact, changelog |

Notifications: inline on pipeline (AI approval bell) — no separate notifications page for MVP.

---

## Job Pipeline (P0)

- Universal Kanban pipeline (compact 9 / full 19)
- Board cards, column metrics, stuck-card signal
- AI command dock
- Filters, search, quick actions
- Drag/drop movement

## Card detail (P0)

- Overview, Property, Scope, Estimate, Schedule, Money
- Comments, Checklist (`checklist_json`)
- Timeline, AI copilot rail
- Files tab (attachments — Wave 3 shipped)

## Dashboard

- Today's schedule, overdue, unpaid total
- See `MINIMAL_DASHBOARD.md`

## Customers

- Customer list, profile, linked cards, history

## Calendar

- Week table, scheduled cards, assignments

## Reports

- Pipeline velocity, AR register, accounting CSV export

## Settings

| Section | Status |
| ------- | ------ |
| Overview / General | Shipped — org name, pipeline mode |
| Team | Shipped — members & roles |
| Integrations | Shipped — inquiry URL, preset links, Stripe/Twilio toggles |
| Templates | Shipped — message templates |
| Automations | Shipped — column-enter rules |
| Contracts | Shipped — recurring contracts |

## Public intake (operator setup)

Settings → Integrations: copy inquiry URL, QR preset links with `?src=` tracking. See [`INQUIRY_INTAKE.md`](../ops/INQUIRY_INTAKE.md).
