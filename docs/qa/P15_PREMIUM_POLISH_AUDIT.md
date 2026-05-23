# P15 — Premium Product Polish Audit

**Date:** 2026-05-23  
**Scope:** `/pipeline` and adjacent workspace surfaces  
**Goal:** $100M product feel — Linear clarity, Notion calm density, field-ledger trust

Scoring: **1** = broken/generic · **3** = functional · **5** = premium operational

---

## Summary scores (before → after)

| Surface           | Before | After | Priority |
| ----------------- | ------ | ----- | -------- |
| Pipeline board    | 3      | 4     | P0       |
| Toolbar           | 3      | 4     | P0       |
| Board card        | 3      | 4     | P0       |
| Column            | 3      | 4     | P1       |
| Card detail panel | 3      | 4     | P1       |
| AI dock           | 4      | 4     | —        |
| Sidebar           | 4      | 4     | —        |
| Settings          | 4      | 4     | —        |
| Dashboard         | 3      | 3     | defer    |
| Loading states    | 2      | 4     | P1       |
| Empty states      | 3      | 4     | P1       |
| Error states      | 3      | 3     | —        |
| Mobile layout     | 2      | 4     | P0       |
| Dark mode         | 3      | 4     | P1       |

---

## Pipeline board

| Field           | Detail                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------- |
| **Score**       | 3 → 4                                                                                          |
| **Issue**       | Horizontal scroll had no edge affordance; column rhythm felt flat; group jump buried on mobile |
| **User impact** | Crew leads miss columns off-screen; board feels like a generic scroll div                      |
| **Premium fix** | Scroll fade edges, snap-friendly spacing, topo surface tuning, drop-target glow refinement     |
| **Files**       | `app/globals.css`, `KanbanBoardDndArea.tsx`, `BoardScrollAffordance.tsx`                       |
| **Risk**        | Low — CSS + wrapper only                                                                       |

---

## Toolbar

| Field           | Detail                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Score**       | 3 → 4                                                                                                                           |
| **Issue**       | Title block + sync pill stacked awkwardly; search plain; AI label generic; filters compete with create                          |
| **User impact** | Command center doesn’t scan in 2s; sync truth buried under title                                                                |
| **Premium fix** | Command bar layout: health chips (jobs · overdue · unassigned), search with icon + `/` hint, Copilot label, sync in actions row |
| **Files**       | `KanbanBoardToolbar.tsx`, `KanbanBoard.tsx`, `globals.css`                                                                      |
| **Risk**        | Low — layout only; no filter logic change                                                                                       |

---

## Board card

| Field           | Detail                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Score**       | 3 → 4                                                                                                                       |
| **Issue**       | Money/due signals compete; stuck jobs subtle; temp cards show blank; hover actions hidden until hover                       |
| **User impact** | Hard to scan money + urgency on a truck laptop at 7am                                                                       |
| **Premium fix** | Stuck ring (5d+), skeleton for optimistic cards, footer “Next” emphasis, meta row hierarchy, selected/urgent states refined |
| **Files**       | `BoardCard.tsx`, `board-card-primitives.tsx`, `BoardCardSkeleton.tsx`, `globals.css`                                        |
| **Risk**        | Low — visual; card data model unchanged                                                                                     |

---

## Column

| Field           | Detail                                                         |
| --------------- | -------------------------------------------------------------- |
| **Score**       | 3 → 4                                                          |
| **Issue**       | Empty columns say “Empty” only; drop zone feedback minimal     |
| **User impact** | Dropping cards feels uncertain; empty stages look abandoned    |
| **Premium fix** | Operational empty copy, dashed drop target, count badge polish |
| **Files**       | `KanbanColumn.tsx`, `globals.css`                              |
| **Risk**        | Low                                                            |

---

## Card detail panel

| Field           | Detail                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| **Score**       | 3 → 4                                                                                                |
| **Issue**       | Loading is text-only; header dense on mobile; tabs scroll without affordance                         |
| **User impact** | Panel open feels slower than board; job record doesn’t feel authoritative                            |
| **Premium fix** | Skeleton loader mirroring header + tabs; tab bar scroll fade; summary strip unchanged (already good) |
| **Files**       | `CardPanel.tsx`, `CardPanelSkeleton.tsx`, `globals.css`                                              |
| **Risk**        | Low                                                                                                  |

---

## AI dock

| Field           | Detail                                                      |
| --------------- | ----------------------------------------------------------- |
| **Score**       | 4 (maintain)                                                |
| **Issue**       | Already peripheral per UI_MASTER_FORMULA — no change needed |
| **User impact** | —                                                           |
| **Premium fix** | —                                                           |
| **Files**       | —                                                           |
| **Risk**        | —                                                           |

---

## Sidebar

| Field           | Detail                                        |
| --------------- | --------------------------------------------- |
| **Score**       | 4 (maintain)                                  |
| **Issue**       | Forest nav + brand mark already aligned (P12) |
| **User impact** | —                                             |
| **Premium fix** | —                                             |
| **Files**       | —                                             |
| **Risk**        | —                                             |

---

## Settings / Dashboard

| Field           | Detail                                          |
| --------------- | ----------------------------------------------- |
| **Score**       | 3–4 (defer)                                     |
| **Issue**       | Secondary surfaces; P15 scope is pipeline-first |
| **User impact** | Low for pilot board UAT                         |
| **Premium fix** | Deferred to post-P15 pass                       |
| **Files**       | —                                               |
| **Risk**        | —                                               |

---

## Loading / empty / error states

| Surface | Score | Issue                          | Fix               | Files                            | Risk |
| ------- | ----- | ------------------------------ | ----------------- | -------------------------------- | ---- |
| Loading | 2→4   | Panel + temp cards no skeleton | Shimmer skeletons | `CardPanelSkeleton`, `BoardCard` | Low  |
| Empty   | 3→4   | Filter no-results plain        | Styled status bar | `KanbanBoard.tsx`, CSS           | Low  |
| Error   | 3     | Alert styling OK               | No change         | —                                | —    |

---

## Mobile layout

| Field           | Detail                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Score**       | 2 → 4                                                                                                               |
| **Issue**       | Compressed desktop — no stage picker in compact mode; columns squeeze                                               |
| **User impact** | Field use on phone feels accidental                                                                                 |
| **Premium fix** | `PipelineMobileStageNav` — horizontal stage chips, scroll-to-column; full-width panel; group jump horizontal scroll |
| **Files**       | `PipelineMobileStageNav.tsx`, `KanbanBoardDndArea.tsx`, `globals.css`                                               |
| **Risk**        | Medium — test mobile e2e snapshots                                                                                  |

---

## Dark mode

| Field           | Detail                                                     |
| --------------- | ---------------------------------------------------------- |
| **Score**       | 3 → 4                                                      |
| **Issue**       | Scroll fades + stuck ring used light-only mixes            |
| **User impact** | Night office use loses depth cues                          |
| **Premium fix** | Token-based fades; stuck/overdue rings use semantic tokens |
| **Files**       | `globals.css`                                              |
| **Risk**        | Low                                                        |

---

## Visual QA (Playwright)

| ID          | Scenario            | Selector / state       |
| ----------- | ------------------- | ---------------------- |
| VIS-P15-001 | Empty pipeline      | `.ops-pipeline-root`   |
| VIS-P15-002 | Populated pipeline  | After job create       |
| VIS-P15-003 | Dragging card       | During drag overlay    |
| VIS-P15-004 | Filtered no-results | Search nonsense query  |
| VIS-P15-005 | Card panel          | Open job panel         |
| VIS-P15-006 | New job modal       | Create menu → New job  |
| VIS-P15-007 | Mobile pipeline     | iPhone viewport        |
| VIS-P15-008 | Dark mode pipeline  | `html.dark` + pipeline |

File: `tests/e2e/p15-visual.spec.ts` (@visual tag)

---

## Out of scope (intentional)

- Dashboard chart polish
- Notifications bell (Phase B)
- New design system / non-`ops-*` classes
- Mock/demo cards
- Core product model changes

---

## Definition of done checklist

- [x] Audit doc published
- [x] `/pipeline` premium at first glance
- [x] Cards easier to scan (money, due, stuck, next)
- [x] Toolbar command-center layout
- [x] Mobile stage navigation
- [x] Visual screenshots exist
- [x] Regression checks pass
- [x] PROGRESS + LOG + CHANGELOG updated
