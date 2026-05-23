# E2E regression suites (T09)

**Run alone:** `npm run test:e2e` or `npm run test:e2e:smoke`  
**Tool:** Playwright  
**Tags:** `@smoke` `@regression` `@wave0`

## Suite R0 — Wave 0 critical path (P0)

| ID           | Journey                                                             | Tags       | P   |
| ------------ | ------------------------------------------------------------------- | ---------- | --- |
| E2E-BOOT-001 | Signup → land on `/pipeline` → 9 columns visible                    | smoke      | P0  |
| CSS-001      | App shell loads compiled CSS (no stylesheet 404 on `/support/help`) | smoke      | P0  |
| E2E-JOB-001  | Create inquiry card from + button                                   | smoke      | P0  |
| E2E-JOB-002  | Drag card inquiry→site_visit; fail rollback on mock 500             | regression | P0  |
| E2E-JOB-003  | Open card slide-over → Property tab → save address                  | smoke      | P0  |
| E2E-JOB-004  | Add estimate lines → move to estimate_sent blocked at $0            | regression | P0  |
| E2E-JOB-005  | Move to approved → scheduled with date picker                       | regression | P0  |
| E2E-JOB-006  | scheduled without date shows validation                             | regression | P0  |
| E2E-JOB-007  | Flow to complete → invoice draft                                    | regression | P0  |
| E2E-MNY-001  | Manual mark paid → archived → card hidden default filter            | regression | P0  |
| E2E-AI-001   | AI summarize card → summary on Overview                             | smoke      | P0  |
| E2E-AI-002   | AI move card → approval modal → approve → column change             | regression | P0  |
| E2E-AI-003   | Viewer login → no Run on destructive AI                             | regression | P0  |
| E2E-NAV-001  | Sidebar collapse persists reload                                    | regression | P2  |
| E2E-SUP-001  | Help page loads inside shell                                        | regression | P2  |

## Suite R1 — Full pipeline mode (P1)

| ID           | Case                                 | P   |
| ------------ | ------------------------------------ | --- |
| E2E-PIPE-001 | Toggle full → 19 columns in 4 groups | P1  |
| E2E-PIPE-002 | Collapse sales group → cards hidden  | P2  |

## Suite R2 — Regression extended (P1, pre-release)

All R0 + filter bar, search, assignee menu, activity timeline entries, comment post, checklist toggle.

## Suite RX — Full regression (run together)

```txt
R0 + R1 + R2 + SEC spot (login boundaries) + A11Y smoke
```

**Max duration target:** 15 min parallel workers.

## Visual regression (optional)

- Board card snapshot: stone bg, left accent
- Card panel header
- Store in `tests/e2e/snapshots/` — review on UI intentional change

## Failure protocol

1. Screenshot + trace on fail
2. Map to FMEA id if new failure mode
3. Add test if gap found (regression prevention)
