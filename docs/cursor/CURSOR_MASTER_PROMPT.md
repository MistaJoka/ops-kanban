# Cursor Master Prompt

Use this prompt inside Cursor.

```md
You are building an AI-first landscaping / lawn-care Operational Command Center.

**Build protocol (mandatory):** docs/roadmap/AI_BUILD_PROTOCOL.md · Doc map: docs/roadmap/DOC_INDEX.md

- Start: read PROGRESS.md + open PROBLEM_REGISTRY.md + scan BUILD_KNOWLEDGE.md
- Work: one TASK-Px-xxx from PHASE_TASKS.md per session (roadmap P0–P10; not a second plan)
- End: DEVELOPMENT_LOG + PROGRESS + PRB/LEARN when troubles or reusable fixes occur

**Phase labels below** = product steps **after P0 scaffold**. Map: P0 scaffold → prompt Phase 1 = **P1** … prompt Phase 6 = **P6**.

This is not a multi-board Trello clone. The product uses one Job Pipeline board (9 landscaping columns — see docs/product/DEFAULT_PIPELINE.md). Each card is a property job: inquiry, customer/property, scope, estimate, crew schedule, invoice, payment, activity, and AI context. MVP scope: docs/product/MVP_SCOPE.md.

Use the existing code if present. Do not rewrite working code. Add onto the working system in small production-quality phases.

Core product rules:

1. The Job Pipeline (`/pipeline`) is the main workspace.
2. Cards are the source of truth.
3. Columns represent business states.
4. Other pages are views over the same data, not separate systems.
5. AI must never write directly to the database.
6. AI must use approved tools only.
7. High-risk actions require human confirmation.
8. Every AI action must be logged.
9. No mock data in production flows — see docs/product/NO_MOCK_DATA_POLICY.md:
   - No hardcoded cards/customers/invoices in UI or API.
   - New orgs start with empty pipeline (columns only).
   - Empty states only; never fake “sample” jobs.
   - Test fixtures live under tests/ only.
   - Wire tool-executor to real domain services (no fake “executed” without DB write).
10. UI decisions defer to docs/product/UI_MASTER_FORMULA.md + WORKSPACE_DESIGN.md + CARD_DESIGN.md + DESIGN_TOKENS.md.
11. AI slop: when touching >3 files or anything under components/pipeline/, run the Suspicion Scan in docs/testing/AI_SLOP_DETECTION.md before session end; run npm run check:slop-health on structural changes.

Target stack:

- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- Supabase
- PostgreSQL
- Gemini 2.5 Flash

Build the MVP in phases:

Phase 1: Core data model

- organizations
- profiles
- members
- boards
- columns
- cards
- customers
- activities

Phase 2: Operations board

- drag/drop Kanban
- create card
- update card
- move card
- archive card
- filter/search

Phase 3: Deep card modal

- overview
- customer details
- job scope
- quote section
- schedule section
- financial section
- comments
- checklist
- files
- activity timeline

Phase 4: Money drafts (on card — not separate CRM page)

- quotes + line items on card
- invoices + manual paid
- archive to `archived` column

Phase 5: AI subsystem

- Gemini client
- system prompt
- context loader
- tool registry
- tool executor
- risk classifier
- approval engine
- AI command API route
- AI frontend components

Phase 6: MVP release + minimal dashboard (optional)

- error/empty/loading states, mobile, rate limits
- minimal dashboard: today’s jobs, overdue, unpaid total (not full reports)
- defer: customers page, calendar app, reports — see docs/roadmap/PHASE_TASKS.md P7+

Definition of Done:

- User can manage a full customer-to-cash lifecycle from one Kanban board.
- User can ask AI to summarize, create, update, and move cards.
- AI actions use tool functions, not raw DB writes.
- Risky actions require confirmation.
- All actions create activity logs.
- UI updates after changes.
```
