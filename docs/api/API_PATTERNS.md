# API patterns — reliability and envelopes

Human-readable patterns for all API routes. **Route inventory (49 routes):** [`docs/testing/API_CONTRACTS.md`](../testing/API_CONTRACTS.md) § Route inventory. **Endpoint narratives:** [`API_ROUTES.md`](./API_ROUTES.md).

Distilled from LEARN-020/022. Code: `lib/api/`, `lib/domain/errors.ts`, `lib/domain/mutations/idempotency.ts`.

---

## JSON envelope

All routes return JSON. No stack traces in production.

```ts
// success (shape varies by route)
{ data: T }

// error
{ error: string; code?: string; details?: unknown }
```

| Code                | HTTP | When                  |
| ------------------- | ---- | --------------------- |
| `UNAUTHORIZED`      | 401  | No session            |
| `FORBIDDEN`         | 403  | Role or org           |
| `NOT_FOUND`         | 404  | Card/org              |
| `VALIDATION_ERROR`  | 400  | Zod / move gate       |
| `RATE_LIMITED`      | 429  | Public POST throttle  |
| `APPROVAL_REQUIRED` | 202  | AI tool needs approve |

Throw `DomainError` in domain code; routes map via `domainErrorToResponse()` / `mapSupabaseError`.

---

## Route wrappers

Every `app/api/**/route.ts` uses one of:

| Wrapper | Auth | Use for |
| ------- | ---- | ------- |
| `withApiRoute` | Session (`getHandlerContext`) | Authenticated org-scoped mutations/reads |
| `withApiRouteNoRequest` | Session | GET handlers without body |
| `withPublicRoute` | Service role inside handler | Inquiry, book, portal, health, dev reset |
| `withWebhookRoute` | Signature verify in handler | PayPal, Twilio webhooks |

Wrappers catch errors, call `captureApiError`, return JSON envelope. **Target:** 49/49 wrapped (P17).

Special case: `POST /api/ai/command` with `stream: true` returns SSE — still wrapped for auth/errors on non-stream path.

---

## Request parsing

Use `parseJsonBody(request, schema)` from `lib/api/parseJsonBody.ts` for POST/PATCH bodies. Invalid JSON or Zod failures → `400` with field errors.

Org scope: derive `organization_id` from `organization_members` — never trust client org id alone.

---

## Idempotency

### Client mutations (authenticated writes)

Table: `client_mutations` (migration `019`).

Header: `X-Client-Mutation-Id` (or equivalent client idempotency key).

Routes: `POST /api/cards`, `PATCH /api/cards/:id`, `POST /api/cards/:id/move`, `POST /api/cards/:id/reorder`.

**Claim-first:** `claimClientMutation()` inserts pending row before work; duplicate key returns cached response (`INT-IDEM-001`, `INT-IDEM-002`).

### Inquiry requests (public intake)

Table: `inquiry_requests` (migration `020`).

Key derived from org + channel + contact + body hash via `inquiryIdempotencyKey()`.

**Claim-first:** `claimInquiryRequest()` before `processIntake()` (`INT-IDEM-003`).

---

## Public rate limits

`checkPublicRateLimit()` in `withPublicRoute` for abuse-prone POSTs:

- `POST /api/inquiry/[slug]`
- `POST /api/book/[slug]`
- `POST /api/portal/[token]/approve`
- `POST /api/portal/[token]/payment-link`

Exceeded → `429` `RATE_LIMITED` (`INT-API-PUB-001`, `UNIT-RATE-001`).

---

## Webhooks

- `POST /api/webhooks/paypal` — payment events; dedupe by event id
- `POST /api/webhooks/twilio` — inbound SMS → `processSmsWebhook` → `processIntake`

Use `withWebhookRoute`; verify provider signature before domain work.

---

## Health and dev

- `GET /api/health` — public; minimal shape (no env key leakage — DONE-17.7)
- `GET /api/health/connections` — integration connectivity probe
- `POST /api/dev/reset-board` — dev only; clears board cards under `DISABLE_AUTH`

---

## Tests

| Area | IDs |
| ---- | --- |
| Wrapper errors | INT-API-500 |
| AI command | INT-API-001–020 |
| Idempotency | INT-IDEM-001–003 |
| Public rate limit | INT-API-PUB-001 |
| Full inventory | `tests/integration/api-contracts.test.ts` |

Run: `npm run test:integration -- api-contracts`

---

## Related

- [`APPROVAL_FLOW.md`](./APPROVAL_FLOW.md) — AI approve/reject
- [`API_ROUTES.md`](./API_ROUTES.md) — endpoint sections by domain
- [`ARCHITECTURE_PRINCIPLES.md`](../roadmap/ARCHITECTURE_PRINCIPLES.md) — domain in `lib/domain/*`
