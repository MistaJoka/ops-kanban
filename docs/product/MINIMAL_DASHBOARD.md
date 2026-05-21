# Minimal dashboard — Wave 0 (Phase 6)

Deferred full reports; ship a **single summary page** with real SQL aggregates only.

Route: `/dashboard`  
Nav: visible with “Soon” optional — MVP may ship as **read-only** summary.

---

## Widgets (MVP)

| Widget | Query | Empty state |
|--------|-------|-------------|
| Scheduled today | cards where `scheduled_start` is today, not archived | “No jobs scheduled today.” |
| Overdue | `due_date < today` and not archived | “No overdue follow-ups.” |
| Unpaid balance | sum `invoices.balance_due` for org | “$0 outstanding” (real zero) |
| Pipeline snapshot | count per column (compact) | Link to Job Pipeline |

**No** fake revenue charts or sample percentages.

---

## Out of scope (Wave 0)

- AI daily briefing (board dock covers Analyze)
- Funnel conversion charts
- Crew utilization maps
- Export CSV

---

## API

`GET /api/dashboard/summary` — see `docs/api/API_ROUTES.md`.

---

## Tests

- UAT-08 partial
- REQ add in traceability when implemented
