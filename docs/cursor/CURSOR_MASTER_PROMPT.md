# Cursor Master Prompt

Use this prompt inside Cursor.

```md
You are building an AI-first landscaping / lawn-care Operational Command Center.

This is not a multi-board Trello clone. The product uses one Job Pipeline board (9 landscaping columns — see docs/product/DEFAULT_PIPELINE.md). Each card is a property job: inquiry, customer/property, scope, estimate, crew schedule, invoice, payment, activity, and AI context. MVP scope: docs/product/MVP_SCOPE.md.

Use the existing code if present. Do not rewrite working code. Add onto the working system in small production-quality phases.

Core product rules:
1. The Operations Board is the main workspace.
2. Cards are the source of truth.
3. Columns represent business states.
4. Other pages are views over the same data, not separate systems.
5. AI must never write directly to the database.
6. AI must use approved tools only.
7. High-risk actions require human confirmation.
8. Every AI action must be logged.
9. No mock data should be added to production flows.

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

Phase 4: CRM and financial records
- customers
- quotes
- invoices
- payments

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

Phase 6: Reporting and dashboard
- pipeline health
- revenue summary
- unpaid invoices
- bottlenecks
- overdue work

Definition of Done:
- User can manage a full customer-to-cash lifecycle from one Kanban board.
- User can ask AI to summarize, create, update, and move cards.
- AI actions use tool functions, not raw DB writes.
- Risky actions require confirmation.
- All actions create activity logs.
- UI updates after changes.
```
