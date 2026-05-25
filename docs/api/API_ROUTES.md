# API routes — endpoint guide

> **Canonical split:** Full **route inventory** (methods, auth, wrappers, test IDs) → [`docs/testing/API_CONTRACTS.md`](../testing/API_CONTRACTS.md) § Route inventory (P17 — 49 routes). **Patterns** (wrappers, idempotency, rate limits) → [`API_PATTERNS.md`](./API_PATTERNS.md).

All authenticated routes require session unless noted. Responses use JSON envelope — see `API_PATTERNS.md`.

Org scope: derive `organization_id` from `organization_members` — never trust client org id alone.

---

## Auth & bootstrap

| Method | Path                                         | Purpose                            |
| ------ | -------------------------------------------- | ---------------------------------- |
| POST   | `/api/auth/signup` or Server Action `signup` | Auth + bootstrap org/board/columns |
| POST   | `/api/auth/login`                            | Session (or Supabase client auth)  |

Bootstrap must insert **zero cards** — `NO_MOCK_DATA_POLICY.md`.

---

## Board & pipeline

| Method | Path           | Body        | Purpose                                  |
| ------ | -------------- | ----------- | ---------------------------------------- |
| GET    | `/api/board`   | —           | Primary board + columns + cards (active) |
| GET    | `/api/calendar` | `?week=`   | Scheduled cards for calendar week        |

---

## Cards

| Method | Path                     | Body                                                       | Purpose                                   |
| ------ | ------------------------ | ---------------------------------------------------------- | ----------------------------------------- |
| POST   | `/api/cards`             | `{ title, columnId, customerId?, ... }`                    | Create card — **idempotent**              |
| GET    | `/api/cards/:id`         | —                                                          | Card + customer + quote + invoice summary |
| PATCH  | `/api/cards/:id`         | partial card fields                                        | Update — **idempotent**                   |
| DELETE | `/api/cards/:id`         | —                                                          | Delete/archive card                       |
| POST   | `/api/cards/:id/move`    | `{ targetColumnId, reason? }`                              | Validate move — **idempotent**            |
| POST   | `/api/cards/:id/reorder` | `{ columnId, orderedIds }`                                 | Reorder within column — **idempotent**    |
| PUT    | `/api/cards/:id/customer` | customer fields                                           | Link/update customer on card              |
| GET/POST | `/api/cards/:id/comments` | `{ body }`                                               | Card comments                             |
| GET/POST/DELETE | `/api/cards/:id/attachments` | multipart / ids                                  | File attachments (Wave 3)                 |
| POST   | `/api/cards/:id/attachments/:attachmentId/analyze` | —                          | AI attachment analysis                    |
| GET/POST | `/api/cards/:id/change-orders` | line items                                            | Change orders                             |
| GET/POST | `/api/cards/:id/messages` | SMS/email thread                                           | Comms on card                             |
| POST   | `/api/cards/:id/portal-token` | —                                                       | Generate customer portal token            |

**Move validation:** `lib/domain/pipeline/validateMove.ts` — gates per `DEFAULT_PIPELINE.md`.

---

## Customers

| Method | Path                 | Body                                         | Purpose               |
| ------ | -------------------- | -------------------------------------------- | --------------------- |
| GET    | `/api/customers`     | —                                            | List customers        |
| POST   | `/api/customers`     | `{ name, phone?, email?, address?, notes? }` | Create                |

---

## Money

| Method | Path                          | Body                      | Purpose                     |
| ------ | ----------------------------- | ------------------------- | --------------------------- |
| POST   | `/api/cards/:id/quotes`       | `{ lineItems[] }`         | Create/update quote draft   |
| PATCH  | `/api/cards/:id/quotes`       | `{ status?, lineItems? }` | Quote updates               |
| GET    | `/api/cards/:id/quotes/export`| —                         | Export estimate PDF/CSV     |
| POST   | `/api/cards/:id/quotes/send`  | —                         | Send quote to customer      |
| POST   | `/api/cards/:id/invoices`     | `{ fromQuoteId? }`        | Invoice draft               |
| POST   | `/api/invoices/:id/mark-paid` | `{ method?: string }`     | Manual paid — owner/manager |
| POST   | `/api/invoices/:id/payment-link` | —                      | PayPal payment link         |

---

## AI

| Method | Path              | Body                      | Purpose                                        |
| ------ | ----------------- | ------------------------- | ---------------------------------------------- |
| POST   | `/api/ai/command` | `{ command, context, stream? }` | Intent + tool proposal; SSE when `stream: true` |
| GET    | `/api/ai/pending` | —                         | Pending approval count + items for bell UI     |
| POST   | `/api/ai/approve` | `{ toolCallId }`          | Execute approved tool — see `APPROVAL_FLOW.md` |
| POST   | `/api/ai/reject`  | `{ toolCallId, reason? }` | Reject pending tool                            |
| GET    | `/api/app/context`| —                         | Page context for multi-surface copilot         |

**Auth:** Verify `context.organizationId` matches user's membership.

---

## Dashboard, reports, accounting

| Method | Path                     | Purpose                                                                  |
| ------ | ------------------------ | ------------------------------------------------------------------------ |
| GET    | `/api/dashboard/summary` | `scheduledToday`, `overdueCount`, `unpaidBalance` — real aggregates only |
| GET    | `/api/reports`           | Velocity, bottlenecks, forecast aggregates                               |
| GET    | `/api/accounting`        | AR register + ledger summary                                             |
| GET    | `/api/accounting/export` | CSV export of accounting transactions                                    |

---

## Settings & team

| Method | Path                          | Purpose                    |
| ------ | ----------------------------- | -------------------------- |
| GET/PATCH | `/api/settings/organization` | Org name, settings         |
| PATCH  | `/api/settings/pipeline-mode` | Compact vs full pipeline  |
| GET/PATCH | `/api/settings/ai-memory`  | AI memory preferences      |
| GET    | `/api/members`                | Team roster                |
| GET/PATCH | `/api/integrations`       | Integration toggles/status |
| GET/POST | `/api/message-templates`   | SMS/email templates        |

---

## Automations & contracts

| Method | Path                          | Purpose                    |
| ------ | ----------------------------- | -------------------------- |
| GET/POST | `/api/automations`          | Column enter automations   |
| DELETE | `/api/automations/:id`        | Remove automation          |
| GET/POST | `/api/contracts`            | Recurring contracts        |
| POST   | `/api/contracts/:id/generate` | Generate contract run      |
| POST   | `/api/contracts/run-due`      | Cron: run due contracts    |

---

## Public routes (no session)

Service role inside handler. Rate-limited POSTs — see `API_PATTERNS.md`.

| Method | Path                          | Purpose                                      |
| ------ | ----------------------------- | -------------------------------------------- |
| GET/POST | `/api/inquiry/[slug]`       | Public quote/inquiry form → `processIntake`  |
| GET/POST | `/api/book/[slug]`          | Public booking page → atomic booking RPC     |
| POST   | `/api/portal/[token]/approve` | Customer approves estimate on portal         |
| POST   | `/api/portal/[token]/payment-link` | Customer payment link from portal       |

UI pages: `/inquiry/[slug]`, `/book/[slug]`, `/p/[token]`. Runbook: [`docs/ops/INQUIRY_INTAKE.md`](../ops/INQUIRY_INTAKE.md).

---

## Webhooks

| Method | Path                    | Purpose                          |
| ------ | ----------------------- | -------------------------------- |
| POST   | `/api/webhooks/paypal`  | Payment confirmation             |
| POST   | `/api/webhooks/twilio`  | Inbound SMS → `processIntake`    |

---

## Health & dev

| Method | Path                        | Purpose                    |
| ------ | --------------------------- | -------------------------- |
| GET    | `/api/health`               | Liveness + Supabase check  |
| GET    | `/api/health/connections`   | Integration probe          |
| POST   | `/api/dev/reset-board`      | Dev: clear board cards     |

---

## Server Actions alternative

MVP may use Server Actions instead of REST for some mutations; keep **same domain functions** and activity logs. Document Action names beside routes when implemented.
