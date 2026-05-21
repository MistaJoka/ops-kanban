# Build knowledge — reinforced learning for agents

Durable patterns discovered during build. **Search here before debugging.**

Format: **LEARN-NNN** — When / Problem / Solution / Verify / Refs

---

## Agent discipline

### LEARN-001 — Canonical pipeline terminal state

| | |
|-|-|
| **When** | Adding columns, move validation, or AI moveCard |
| **Problem** | `closed` vs `archived` drift breaks move rules and tests |
| **Solution** | Use `archived` only; compact 9-col ends at `archived`; see `DEFAULT_PIPELINE.md` |
| **Verify** | `rg "state_key.*closed" docs src` returns none |
| **Refs** | PRB-000, `landscaping-default-columns.ts` |

### LEARN-002 — No mock production data

| | |
|-|-|
| **When** | Seeding, demos, AI tools, onboarding |
| **Problem** | Sample cards look real; pilots lose trust |
| **Solution** | Signup inserts 0 cards; empty states only; `NO_MOCK_DATA_POLICY.md` |
| **Verify** | `npm run check:no-mock`; new signup → empty pipeline |
| **Refs** | `scripts/check-no-mock.sh` |

### LEARN-003 — AI executor must persist

| | |
|-|-|
| **When** | Wiring Phase 5 AI |
| **Problem** | Stub executor returns success without DB write |
| **Solution** | `executeToolCall` → `lib/domain/*` only; log `ai_tool_calls` + activities |
| **Verify** | `AI-LOG-001`; refresh page shows persisted change |
| **Refs** | `tool-executor.ts`, `APPROVAL_FLOW.md` |

---

## Tooling

<!-- LEARN-004+ Next.js, Supabase CLI, env -->

---

## Database & RLS

<!-- LEARN-0xx auth, migrations order, RLS policies -->

---

## Frontend

<!-- LEARN-0xx Kanban, slide-over, design tokens -->

---

## AI / Gemini

<!-- LEARN-0xx tool calling, context size, approval -->

---

## Testing

<!-- LEARN-0xx flaky tests, fixtures -->

---

## Integrations (Wave 1+)

<!-- LEARN-0xx webhooks, PayPal, Twilio -->

---

## Release

<!-- LEARN-0xx G2 gate, staging -->

---

## Promotion rule

If the same issue appears in **2+ PRB entries**, promote fix to LEARN and reference from both PRBs.
