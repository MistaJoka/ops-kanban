# No mock data & no fake placeholders — MVP policy

**Rule:** Production and pilot environments show **only real org data** from Supabase (or intentional **empty states**). Nothing that looks like real jobs, customers, or money unless it was created by a user, bootstrap, or approved AI tool.

Couples to: `CURSOR_MASTER_PROMPT.md` rule 9, `RELEASE_GATES.md` G2, `DEFINITION_OF_DONE.md` global DoD.

---

## 1. Definitions

| Term | Meaning |
|------|---------|
| **Mock data** | Fictional cards, customers, invoices, or metrics presented as live (e.g. “Rivera — Demo”, seeded arrays in UI) |
| **Generic placeholder** | Lorem ipsum, “Sample Customer”, “$999.99”, “Acme Corp”, hardcoded pipeline filled for demo |
| **Empty state** | Allowed — honest UI when count = 0 (“No jobs in this column”, “Create your first inquiry”) |
| **Input placeholder** | Allowed — HTML `placeholder` on empty fields (“Ask about today’s jobs…”) |
| **Test fixtures** | Allowed **only** under `tests/` — never imported by `app/` or `components/` |
| **Bootstrap data** | Allowed — org/board/columns on signup; **zero sample cards** |

---

## 2. Forbidden in MVP (production paths)

### Data & API

- [ ] Hardcoded `cards[]`, `customers[]`, or column counts in UI components
- [ ] `if (process.env.NODE_ENV === 'development')` injecting demo jobs on pipeline load
- [ ] API routes returning static JSON samples instead of Supabase queries
- [ ] AI returning fabricated record IDs or “created” without tool execution + DB row
- [ ] Fake payment/sign/comms success without webhook or domain write
- [ ] Dashboard/reports numbers not computed from DB (Wave 0: minimal dashboard only real aggregates)

### UI copy masquerading as records

- [ ] Pre-filled Property tab with example homeowner
- [ ] Estimate line items on new card except user/AI explicit action
- [ ] Comments/activity not backed by `activities` / `comments` tables
- [ ] Avatar/name chips for crew that are not `profiles` in org

### Seeding in production

- [ ] `seed.sql` or scripts that insert **sample jobs** into production/staging pilot orgs
- [ ] Shared “demo org” on production URL with fake data

### Starter / dev leftovers

- [ ] `tool-executor` message-only “executed” without domain write (must wire in P5)
- [ ] `context-loader` returning empty stub objects presented as real context in UI
- [ ] `generateContent` responses shown as card/invoice updates without tool pipeline

---

## 3. Allowed

| Item | Notes |
|------|--------|
| Empty pipeline | 9 real columns, 0 cards — correct |
| Signup bootstrap | Org, board, columns only — `SIGNUP_BOOTSTRAP.md` |
| User-created data | All cards/customers from UI, AI tools, or imports (post-MVP) |
| Test DB seeds | `tests/fixtures`, `DATA_FIXTURES.md` — isolated orgs `alpha`/`beta` |
| Mocked Gemini in **CI only** | `tests/fixtures/ai/*` — not user-facing |
| Mock HTTP 500 in E2E | `E2E-JOB-002` rollback test only |
| Input placeholders | Search, AI dock, form hints |
| Static **help/legal** copy | Support pages are documentation, not operational records |
| Brand assets missing | Use text logomark “OpsBoard” until SVGs exist — not fake jobs |
| Files tab (Wave 0) | **Hide tab** or empty state “No files yet” — no stock photos |

---

## 4. Empty states (required copy patterns)

Use **action-oriented** empty states, never fake rows:

| Surface | Copy example |
|---------|----------------|
| Empty column | “No jobs here. Drag a card or **+ Add job**.” |
| Empty board (new org) | “Your pipeline is ready. **Create your first inquiry**.” |
| No estimate | “No estimate yet. Add line items or ask AI to draft from scope notes.” |
| No invoice | “No invoice yet. Create from estimate when job is complete.” |
| No activity | “No activity yet.” |
| AI no selection | “Open a job card for job-specific AI, or ask about the whole board.” |

---

## 5. Module-by-module checklist (Wave 0)

| Module | Real data source | Empty if none |
|--------|------------------|---------------|
| Job Pipeline | `columns` + `cards` query | ✓ |
| Board card | card + customer join | hide or “Unnamed property” |
| Card Property | `customers` | blank form |
| Card Estimate | `quotes` + `quote_items` | empty table |
| Card Money | `invoices` | empty |
| Card Schedule | `cards.scheduled_*` | blank dates |
| Card Timeline | `activities` | empty list |
| Card Comments | `comments` | empty |
| Dashboard (minimal) | SQL aggregates | “0” not fake $|
| AI dock | context from DB | “No jobs match” ok |
| Support pages | static markdown | N/A |

---

## 6. Code boundaries

```txt
app/           → MUST NOT import from tests/
components/    → MUST NOT import mock JSON
lib/domain/    → MUST NOT return hardcoded business entities
lib/ai/        → executors MUST call domain layer (P5)
tests/         → MAY use factories, fixtures, mocks
```

**CI guard (implement TASK-P6-011):** script fails if `app/` or `components/` imports `tests/` or files named `*mock*`, `*fixture*`, `*sample*`.

---

## 7. AI-specific

| Allowed | Forbidden |
|---------|-----------|
| Summarize **existing** card fields | Invent customer phone or address not in DB |
| Draft estimate **preview** before save | Show preview as if already saved |
| “No cards found” when search empty | Hallucinate 3 example cards in prose without marking as suggestions |

Suggested chips are **prompts**, not records.

---

## 8. Verification before MVP release (G2)

| Check | Method |
|-------|--------|
| V1 | New signup → pipeline has **0 cards**, 9 columns |
| V2 | Grep ban: no `mockCards`, `sampleData`, `DEMO_` in `app/` `components/` `lib/domain/` |
| V3 | Network tab: pipeline load hits Supabase, not static JSON |
| V4 | AI move/create updates DB; refresh persists |
| V5 | Staging DB: no `organizations.name` like `%demo%` unless test org flagged |
| V6 | `tool-executor` no stub success without write — code review |
| V7 | UAT uses **user-entered** Rivera/Miller names, not pre-seeded |

Document in `DEVELOPMENT_LOG` as `LOG-*-no-mock-verified`.

---

## 9. Blueprint audit status (pre-build)

| Item | Status | Action at build |
|------|--------|-----------------|
| `CURSOR_MASTER_PROMPT` rule 9 | ✓ Policy | Keep |
| `tool-executor.ts` stub success message | ⚠️ Starter only | Wire P5-006; remove fake “executed” |
| `context-loader.ts` TODO | ⚠️ Not mock; incomplete | Wire P5-001 |
| `MVP_SCOPE` “Landing stub” | ⚠️ Ambiguous | Minimal real landing OR redirect to login — no demo board |
| `CARD_DESIGN` files placeholder | ⚠️ | Hide tab or empty state — no stock files |
| `public/brand/` TODO | ✓ OK | Text mark until SVG; not mock data |
| `tests/fixtures` | ✓ OK | Test-only |
| `DATA_FIXTURES` test orgs | ✓ OK | Never run against prod |
| `SUPPORT_PAGES` legal stubs | ✓ OK | Static copy, not CRM records |
| `WORKSPACE` “AI rules stub” | ⚠️ | Settings shows “Coming soon” or hide — no fake rules |
| `package.json` name `blueprint` | ✓ OK | Rename on scaffold |

**Confirmation:** Blueprint **does not require** mock production data. A few **starter code stubs** and **wording** must be resolved during P5/P6 — not shipped as pilot behavior.

---

## 10. Change control

Any PR that adds seed cards, demo mode, or static pipeline data requires:

1. Update this doc with exception + expiry, or
2. Rejection — use empty states instead.
