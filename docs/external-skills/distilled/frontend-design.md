# Frontend design (distilled)

> Advisory only. [`AGENTS.md`](../../AGENTS.md) and canonical docs override this file.

## When to use

- Building or polishing UI under `components/`, `app/`, or pipeline/card surfaces
- Choosing layout, motion, or visual hierarchy for operator-facing screens
- Avoiding generic "AI slop" aesthetics

## Adopted patterns (repo-safe)

- **Intentionality first:** Pick a clear aesthetic direction and execute with precision — bold maximalism and refined minimalism both work when deliberate.
- **Context before code:** Understand purpose, audience (landscaping operator), and constraints before styling.
- **Differentiation:** One memorable visual choice beats scattered decorative noise.
- **Motion with purpose:** High-impact moments (page load stagger, hover states) over scattered micro-interactions. Prefer CSS; use Motion library when already in stack.
- **Spatial composition:** Asymmetry, overlap, and grid-breaking elements are fine when they serve scanability for field use.
- **Anti-slop:** Reject cookie-cutter purple gradients, predictable card chrome, and feature sprawl on board cards.

## Canonical overrides

| External impulse | Repo wins |
| --- | --- |
| Pick any distinctive font | [`DESIGN_TOKENS.md`](../product/DESIGN_TOKENS.md) font stack |
| Invent color palette | [`DESIGN_TOKENS.md`](../product/DESIGN_TOKENS.md) + [`UI_MASTER_FORMULA.md`](../product/UI_MASTER_FORMULA.md) |
| Card layout freedom | [`CARD_DESIGN.md`](../product/CARD_DESIGN.md) board card chrome |
| Pipeline structure | [`DEFAULT_PIPELINE.md`](../product/DEFAULT_PIPELINE.md) |
| Slop checks | [`AI_SLOP_DETECTION.md`](../testing/AI_SLOP_DETECTION.md) layer 1 |

## Deferred / rejected

- Banning Inter/system fonts outright → see [`rejected-patterns.md`](../expansion-candidates/rejected-patterns.md)
- Elaborate animation for minimal surfaces → defer to task scope

## Source map

[`vendor-skills/INDEX.md`](../../vendor-skills/INDEX.md) → [anthropics/skills frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [gstack/design-review](https://github.com/garrytan/gstack) (`gstack-design-review`)
