# Changelog

Product-facing changes. Development detail: `docs/roadmap/DEVELOPMENT_LOG.md`.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

---

## [0.6.0] — 2026-05-23

Premium pipeline polish — command toolbar, mobile stage navigation, card/panel skeletons, visual regression screenshots.

### Added

- **`docs/qa/P15_PREMIUM_POLISH_AUDIT.md`** — surface scores, fixes, and risk notes
- **Command toolbar** — board health chips (jobs, stages, overdue, unassigned, balance due); search field with icon and `/` hint; Copilot label
- **`BoardScrollAffordance`** — horizontal scroll fade edges on the board
- **`PipelineMobileStageNav`** — mobile stage chips with scroll-to-column
- **`BoardCardSkeleton`** / **`CardPanelSkeleton`** — shimmer loading for optimistic cards and panel fetch
- **Playwright VIS-P15-001–008** — screenshot baselines (`@visual` tag) for empty/populated/drag/filter/panel/modal/mobile/dark pipeline

### Changed

- Board cards show **stuck** signal (5d+ in column) with billing-tinted footer emphasis
- Empty column copy → operational language (“No jobs in stage”, “Add job”)
- Group jump rail uses horizontal scroll track; full pipeline group labels on large screens
- Filter no-results uses structured status bar (`.ops-filter-empty`)
- `/` pipeline search shortcut runs before global `defaultPrevented` guard (Playwright-compatible)

### Fixed

- E2E Create button strict-mode collision with sortable card `role=button`
- A11Y-004 keyboard create flow uses New Job modal instead of deprecated `prompt` dialog

---

## [0.3.0] — 2026-05-22

Card ops complete — domain hardening, scan-rich board cards, modals, drag reorder, panel refactor, and advanced filters.

### Added

- **`column_entered_at`** migration (017) — true stage age on board cards (`Nd in stage`)
- **`authorizeCardMutation`** — app-level role gates for edit, move, comment, archive
- Board card **scan signals** — job type chip, money pill with amount, schedule label, assignee initials; overflow `+N`
- Board card **⋮ menu** — assign, set due date, move to column, archive (role-gated)
- **Inline title edit** — double-click board card title to rename
- **New Job modal** — title, customer, address, job type, starting column; Create + Create & open
- **Customer create modal** — replaces toolbar prompt flow
- **Estimate send** and **mark paid** confirmation modals (no `window.confirm`)
- **`reorderCard`** domain + `POST /api/cards/:id/reorder` — within-column position
- **@dnd-kit** drag-and-drop — cross-column move + within-column reorder with drop indicators
- **Advanced board filters** — assigned to me, unassigned, balance due, job type, scheduled this week
- **`N` keyboard shortcut** — opens New Job modal from pipeline
- **CardPanel refactor** — `useCardDetail`, `useCardMutations`, tab components, header/body/modals split

### Changed

- **`daysInColumn`** derives from `column_entered_at` (not `updated_at`) on move and reorder
- **`validateMove`** — `estimate_sent` requires customer + quote line items; worker assignee gate; archive role check
- Card API routes enforce viewer/worker permissions on PATCH, comments, and customer updates
- Property line on board cards shows address/customer only; job type moved to signal row
- Overdue cards show dotted outline per Field ledger spec

### Fixed

- Stage age no longer resets when editing title or non-column fields
- Drag click targets isolated from card menu (`stopPropagation` on menu/details)

---

## [0.2.0] — 2025-05-22

Pilot polish — settings hub, toolbar create menu, popup AI copilot, optimistic board UI.

### Added

- Settings hub (General, Team, Integrations, Templates, Automations, Contracts)
- Toolbar **+** create menu and **AI** copilot popup
- Board sync status indicator; optimistic create/move/edit with rollback
- Delete job (owner/manager); standalone customer create
- Native accounting ledger; dev board reset tooling

### Changed

- Field ledger UI polish across pipeline, card panel, and dashboard
- Native flows replace QuickBooks/DocuSign placeholders

---

## [0.1.4] — 2025-05-21

Wave 4 — portal, automations, contracts, reports.

### Added

- Customer portal (approve + pay), automations, recurring contracts, reports dashboard

---

## [0.1.3] — 2025-05-21

Wave 3 — files, native e-sign, change orders.

---

## [0.1.2] — 2025-05-21

Wave 2 — booking page, calendar, card comms, message templates.

---

## [0.1.1] — 2025-05-21

Wave 1 — Stripe payment links, estimate PDF/email, integration health.

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
