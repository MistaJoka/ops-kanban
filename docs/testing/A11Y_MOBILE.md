# Accessibility & mobile (T14)

**Run alone:** `npm run test:a11y` (axe-playwright on smoke routes)

## WCAG 2.2 AA targets (MVP)

| Area | Requirement | Test |
|------|-------------|------|
| Pipeline | Keyboard drag alternative (menu move) | manual + E2E |
| Focus | Visible focus ring on cards, tabs | axe |
| Contrast | 4.5:1 body text on stone board | axe |
| Forms | Labels on Property/Money tabs | axe |
| AI dock | `aria-expanded`, label on input | axe |
| Modals | Focus trap, Esc close | E2E |
| Errors | `aria-live` on toasts | manual |

## A11Y test cases

| ID | Page | Tool | P |
|----|------|------|---|
| A11Y-001 | /pipeline | axe zero critical | P1 |
| A11Y-002 | card panel open | axe zero critical | P1 |
| A11Y-003 | /support/help | axe | P2 |
| A11Y-004 | Keyboard-only create job | manual | P1 |

## Mobile (landscaping field)

| ID | Case | P |
|----|------|---|
| MOB-001 | 390px width card panel full screen | P0 |
| MOB-002 | Board horizontal scroll usable | P0 |
| MOB-003 | Tap targets ≥ 44px | P1 |
| MOB-004 | Sidebar overlay drawer | P1 |

## Reduced motion

`prefers-reduced-motion` disables panel slide animation (CSS test).
