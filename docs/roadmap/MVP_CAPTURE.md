# MVP capture — frozen Wave 0 scope

> **Frozen Wave 0 intent** — implementation through **P17** exceeds this capture (Waves 1–4, intake, reliability). Do not relitigate Wave 0 scope here; see [`PROGRESS.md`](./PROGRESS.md) and [`SCHEMA_CHANGELOG.md`](../database/SCHEMA_CHANGELOG.md).

**Version:** 0.1.0-planning  
**Vertical:** Landscaping / lawn-care SMB  
**Codename:** OpsBoard AI  
**Status:** Pre-build blueprint (this document locks intent before code) — **historical label; app is built**

---

## One-sentence MVP

A **single Job Pipeline board** where each **card is a property job** from inquiry through paid and **`archived`**, with **deep card records**, **estimate/invoice drafts**, **manual payment**, and an **AI copilot** (board + card)—multi-tenant and RLS-safe.

---

## In scope (Wave 0)

| Area           | Deliverable                              | Spec                                      |
| -------------- | ---------------------------------------- | ----------------------------------------- |
| Auth & tenancy | Signup → org → board → 9 columns         | `SIGNUP_BOOTSTRAP.md`                     |
| Workspace      | Sidebar, support pages, pipeline UI      | `WORKSPACE_DESIGN.md`                     |
| Pipeline       | Compact 9 columns; optional full 19      | `DEFAULT_PIPELINE.md`, `FULL_PIPELINE.md` |
| Cards          | Board card + detail slide-over           | `CARD_DESIGN.md`                          |
| Money          | Quote + invoice drafts; manual paid      | `MVP_SCHEMA.md`                           |
| Schedule       | Card date fields (not full calendar app) | `CARD_DESIGN.md`                          |
| AI             | Tier 1–3 tools, approval, dock + rail    | `AI_UTILIZATION.md`                       |
| Security       | RLS all MVP tables                       | `SECURITY_RLS.md` (tests)                 |
| QA             | Modular test pack + gate G2              | `docs/testing/`                           |

---

## Out of scope (Wave 0 — later waves)

PayPal/Stripe live, Twilio/SMS, DocuSign, Calendly, QuickBooks, customer portal, automations, recurring contracts, live file storage — see `PLATFORM_CAPABILITIES.md` Waves 1–4.

---

## Success criteria (product)

From `PRODUCT_BRIEF.md` — owner can:

1. Create inquiry → 2. Move pipeline → 3. Store customer/job → 4. Draft estimate → 5. Schedule → 6. Complete → 7. Invoice → 8. Track payment → 9. Archive → 10. Use AI safely.

**UAT:** `UAT-01` … `UAT-10` in `docs/testing/UAT_SCRIPTS.md`.

---

## Technical stack (locked)

- Next.js App Router, TypeScript, Tailwind, shadcn/ui
- Supabase: Auth, Postgres, Realtime
- Gemini 2.5 Flash (AI)
- Vitest + Playwright (tests)

---

## Key constraints (non-negotiable)

1. **Card is source of truth** — features attach to `card_id`
2. **AI uses tools only** — no direct DB writes from model
3. **RLS from day one** — no retrofit
4. **Manual fallback** for money/comms until Wave 1+
5. **Compact pipeline default** — full 19 optional
6. **No mock data in production** — empty states only; see `NO_MOCK_DATA_POLICY.md`

---

## Reference map

| Topic                | Document                     |
| -------------------- | ---------------------------- |
| Build phases & tasks | `PHASE_TASKS.md`             |
| DoD                  | `DEFINITION_OF_DONE.md`      |
| Dev log              | `DEVELOPMENT_LOG.md`         |
| Master roadmap       | `DEVELOPMENT_ROADMAP.md`     |
| Stable architecture  | `ARCHITECTURE_PRINCIPLES.md` |

**Change control:** MVP scope changes require update to this file + `MVP_SCOPE.md` + traceability matrix.
