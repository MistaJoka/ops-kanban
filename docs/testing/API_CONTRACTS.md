# API contract tests (T07)

**Run alone:** `npm run test:integration -- api` or tagged `contract`

## Contract rules

- All routes return JSON `{ error?: string, code?: string, ... }` on failure
- 401 unauthenticated, 403 forbidden role/org
- Zod body validation → 400 with field errors
- No stack traces in production responses

## Routes (Wave 0)

### POST `/api/ai/command`

| ID          | Body                           | Auth             | Expected                      | P   |
| ----------- | ------------------------------ | ---------------- | ----------------------------- | --- |
| INT-API-001 | missing command                | user             | 400                           | P0  |
| INT-API-002 | valid summarize intent         | user             | 200, message string           | P0  |
| INT-API-003 | tool requires approval         | user             | 200, status approval_required | P0  |
| INT-API-004 | viewer role moveCard           | viewer           | 403                           | P0  |
| INT-API-005 | wrong org in context           | user A, org B id | 403                           | P0  |
| INT-API-010 | direct executor bypass attempt | no approval      | 403                           | P0  |
| INT-API-020 | approve then execute           | manager          | 200, activity logged          | P0  |

| INT-API-500 | Unguarded routes via `withApiRoute` | thrown error → `{ error, code }` JSON | P0  |

### Dashboard / reports / accounting (P16 stability)

| ID          | Method                         | Expected                | P   |
| ----------- | ------------------------------ | ----------------------- | --- |
| INT-API-500 | GET /api/dashboard/summary     | JSON error on throw     | P0  |
| INT-API-500 | GET /api/reports               | JSON error on throw     | P0  |
| INT-API-500 | GET /api/accounting            | JSON error on throw     | P0  |
| INT-IDEM-001 | POST /api/cards + mutation id | duplicate → cached 201 | P0  |

### Card routes (when implemented)

| ID          | Method                   | Expected                | P   |
| ----------- | ------------------------ | ----------------------- | --- |
| INT-API-101 | POST /api/cards          | 201 + shape             | P0  |
| INT-API-102 | PATCH /api/cards/:id     | 200                     | P0  |
| INT-API-103 | POST /api/cards/:id/move | 200 + validation errors | P0  |
| INT-API-015 | PATCH other org card     | 404 or 403              | P0  |

## Schema snapshots

Store golden Zod/OpenAPI snapshots for:

- `createCard` input
- `ToolResult` output
- Error envelope

Breaking change = version bump + regression run.

## Mocking Gemini in CI

- Fixture responses in `tests/fixtures/ai/`
- Never assert on model prose; assert on **tool name** and **parsed args**

---

## Route inventory (P17 — 2026-05-25)

| Route | Methods | Auth | Wrapper | Idempotent | Test ID |
| --- | --- | --- | --- | --- | --- |
| `/api/accounting` | GET | handler | withApiRoute | no | INT-API-500 |
| `/api/accounting/export` | GET | handler | withApiRoute | no | INT-API-500 |
| `/api/ai/approve` | POST | handler | none → withApiRoute | no | INT-API-020 |
| `/api/ai/command` | POST | handler | none → withApiRoute | no | INT-API-001–005, 010, 020 |
| `/api/ai/pending` | GET | handler | withApiRouteNoRequest | no | INT-API-500 |
| `/api/ai/reject` | POST | handler | none → withApiRoute | no | — |
| `/api/app/context` | GET | handler | withApiRouteNoRequest | no | INT-API-500 |
| `/api/automations` | GET, POST | handler | none → withApiRoute | no | — |
| `/api/automations/[id]` | DELETE | handler | none → withApiRoute | no | — |
| `/api/board` | GET | handler | none → withApiRoute | no | — |
| `/api/book/[slug]` | GET, POST | service | none → withPublicRoute | body key | — |
| `/api/calendar` | GET | handler | none → withApiRoute | no | — |
| `/api/cards` | POST | handler | none → withApiRoute | yes | INT-API-101, INT-IDEM-001 |
| `/api/cards/[id]` | GET, PATCH, DELETE | handler | none → withApiRoute | PATCH yes | INT-API-102, INT-API-015 |
| `/api/cards/[id]/attachments` | GET, POST, DELETE | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/attachments/[attachmentId]/analyze` | POST | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/change-orders` | GET, POST | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/comments` | GET, POST | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/customer` | PUT | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/invoices` | POST | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/messages` | GET, POST | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/move` | POST | handler | none → withApiRoute | yes | INT-API-103 |
| `/api/cards/[id]/portal-token` | POST | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/quotes` | POST, PATCH | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/quotes/export` | GET | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/quotes/send` | POST | handler | none → withApiRoute | no | — |
| `/api/cards/[id]/reorder` | POST | handler | none → withApiRoute | yes | — |
| `/api/contracts` | GET, POST | handler | none → withApiRoute | no | — |
| `/api/contracts/[id]/generate` | POST | handler | none → withApiRoute | no | — |
| `/api/contracts/run-due` | POST | handler | none → withApiRoute | no | — |
| `/api/customers` | GET, POST | handler | none → withApiRoute | no | — |
| `/api/dashboard/summary` | GET | handler | withApiRouteNoRequest | no | INT-API-500 |
| `/api/dev/reset-board` | POST | none | none → withPublicRoute | no | — |
| `/api/health` | GET | none | none → withPublicRoute | no | — |
| `/api/health/connections` | GET | none | none → withPublicRoute | no | — |
| `/api/inquiry/[slug]` | GET, POST | service | none → withPublicRoute | body key | INT-API-PUB-001 |
| `/api/integrations` | GET, PATCH | handler | none → withApiRoute | no | — |
| `/api/invoices/[id]/mark-paid` | POST | handler | none → withApiRoute | no | — |
| `/api/invoices/[id]/payment-link` | POST | handler | none → withApiRoute | no | — |
| `/api/members` | GET | handler | none → withApiRoute | no | — |
| `/api/message-templates` | GET, POST | handler | none → withApiRoute | no | — |
| `/api/portal/[token]/approve` | POST | service | none → withPublicRoute | no | INT-API-PUB-001 |
| `/api/portal/[token]/payment-link` | POST | service | none → withPublicRoute | no | — |
| `/api/reports` | GET | handler | withApiRoute | no | INT-API-500 |
| `/api/settings/ai-memory` | GET, PATCH | handler | none → withApiRoute | no | — |
| `/api/settings/organization` | GET, PATCH | handler | none → withApiRoute | no | — |
| `/api/settings/pipeline-mode` | PATCH | handler | none → withApiRoute | no | — |
| `/api/webhooks/stripe` | POST | webhook | none → withWebhookRoute | event dedup | — |
| `/api/webhooks/twilio` | POST | webhook | none → withWebhookRoute | event dedup | — |

**P17 targets:** 49/49 wrapped; INT-IDEM-002/003 concurrent idempotency; INT-API-PUB-001 rate limit 429.
