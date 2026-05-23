# App Pages

**MVP column:** `P0` = Wave 0 ship · `P1+` = later waves · `—` = optional stub only

## Public pages

| Page    | MVP         | Notes                                              |
| ------- | ----------- | -------------------------------------------------- |
| Landing | P0 optional | Real copy or redirect to login — **no demo board** |
| Login   | P0          | Supabase auth                                      |
| Signup  | P0          | Creates org + board + 9 columns, **zero cards**    |

## App pages

| Page                           | MVP        | Notes                                     |
| ------------------------------ | ---------- | ----------------------------------------- |
| **Job Pipeline** (`/pipeline`) | **P0**     | Primary workspace — `WORKSPACE_DESIGN.md` |
| **Card detail** (slide-over)   | **P0**     | Not a separate route; panel on pipeline   |
| Dashboard                      | P0 minimal | `MINIMAL_DASHBOARD.md` — aggregates only  |
| Customers                      | P1+        | CRM lens — defer                          |
| Calendar                       | P2         | Crew schedule — Wave 2                    |
| Reports                        | P4         | Analytics — Wave 4                        |
| Notifications                  | P1+        | Inline approvals on pipeline for MVP      |
| Settings                       | P0 minimal | Org name, pipeline mode; integrations P1+ |

---

## Job Pipeline (P0)

- Universal Kanban pipeline (compact 9 / full 19)
- Board cards, column metrics
- AI command dock
- Filters, search, quick actions
- Drag/drop movement

## Card detail (P0)

- Overview, Property, Scope, Estimate, Schedule, Money
- Comments, Checklist (`checklist_json`)
- Timeline, AI copilot rail
- **Files tab:** hidden or empty — Wave 3

## Dashboard (P0 minimal)

- Today’s schedule, overdue, unpaid total
- See `MINIMAL_DASHBOARD.md`

## Customers (P1+)

- Customer list, profile, linked cards, history

## Calendar (P2)

- Day/week/month, scheduled cards, assignments

## Reports (P4)

- Velocity, bottlenecks, forecast

## Notifications (P1+)

- Overdue, AI approvals, payment reminders

## Settings (P0 / P1+)

| Section                    | MVP                         |
| -------------------------- | --------------------------- |
| Workspace name             | P0                          |
| Pipeline mode compact/full | P0                          |
| Members & roles            | P0 invite basic / P1 polish |
| Integrations               | P1+                         |
| AI rules                   | Hide or “Coming soon”       |
| Billing                    | Post-MVP                    |
