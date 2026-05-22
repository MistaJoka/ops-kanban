# Changelog

Product-facing changes. Development detail: `docs/roadmap/DEVELOPMENT_LOG.md`.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

---

## [0.1.0] — 2025-05-21

Wave 0 MVP — landscaping operations board with AI copilot.

### Added

- **Job Pipeline** — 9-column kanban board with drag-and-drop, search, and filters (all, overdue, scheduled, archived)
- **Deep card panel** — Overview, Property, Scope, Schedule, Comments, Checklist, Estimate, and Money tabs
- **Customer & property** — Link customer name, phone, email, and address to each job
- **Estimates** — Line-item quote drafts, save, and mark sent; move validation blocks empty estimates
- **Invoices** — Create invoice from estimate, manual mark paid, archive on payment
- **Move validation** — Schedule date required, estimate total gate, balance-due reason on archive
- **AI copilot** — Board dock and card rail with prompt chips; summarize, board status, overdue, create, move, and quote draft tools
- **AI approval flow** — Medium/high-risk actions require explicit approve/reject before execution
- **Multi-tenant security** — Supabase RLS on all org-scoped tables
- **Auth** — Sign up, login, org bootstrap; dev bypass via `DISABLE_AUTH` for local build
- **Support pages** — Help, changelog, and contact stubs inside app shell

### Changed

- Archived column hidden from default board view; visible via Archived filter
- Empty states use honest copy (no demo cards or sample jobs)

### Security

- Org isolation enforced via RLS matrix tests
- AI prompt injection guards block destructive commands
- Rate limit on `/api/ai/command` (30 requests/minute per user)

---

## [0.0.0-planning] — 2025-05-21

### Added

- Blueprint documentation, QA pack, development roadmap (pre-code)
