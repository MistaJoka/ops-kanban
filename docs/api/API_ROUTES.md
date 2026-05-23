# API routes — Wave 0

All routes require authenticated session unless noted. Responses use JSON envelope:

```ts
// success
{ data: T }
// error
{ error: string; code?: string; details?: unknown }
```

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
| GET    | `/api/columns` | `?boardId=` | Columns for board                        |

---

## Cards

| Method | Path                     | Body                                                       | Purpose                                   |
| ------ | ------------------------ | ---------------------------------------------------------- | ----------------------------------------- |
| POST   | `/api/cards`             | `{ title, columnId, customerId?, description?, jobType? }` | Create card + `card.created`              |
| GET    | `/api/cards/:id`         | —                                                          | Card + customer + quote + invoice summary |
| PATCH  | `/api/cards/:id`         | partial card fields                                        | Update + `card.updated`                   |
| POST   | `/api/cards/:id/move`    | `{ targetColumnId, reason? }`                              | Validate move + `card.moved`              |
| POST   | `/api/cards/:id/archive` | `{ reason? }`                                              | Set `archived_at`, column `archived`      |

**Move validation:** `lib/domain/pipeline/validateMove.ts` — gates per `DEFAULT_PIPELINE.md`.

---

## Customers

| Method | Path                 | Body                                         | Purpose               |
| ------ | -------------------- | -------------------------------------------- | --------------------- |
| POST   | `/api/customers`     | `{ name, phone?, email?, address?, notes? }` | Create                |
| PATCH  | `/api/customers/:id` | partial                                      | Update + link to card |

---

## Money

| Method | Path                          | Body                      | Purpose                     |
| ------ | ----------------------------- | ------------------------- | --------------------------- |
| POST   | `/api/cards/:id/quotes`       | `{ lineItems[] }`         | Create/update quote draft   |
| PATCH  | `/api/quotes/:id`             | `{ status?, lineItems? }` | e.g. mark sent              |
| POST   | `/api/cards/:id/invoices`     | `{ fromQuoteId? }`        | Invoice draft               |
| POST   | `/api/invoices/:id/mark-paid` | `{ method?: string }`     | Manual paid — owner/manager |

---

## Comments & activities

| Method | Path                        | Purpose    |
| ------ | --------------------------- | ---------- |
| GET    | `/api/cards/:id/activities` | Timeline   |
| POST   | `/api/cards/:id/comments`   | `{ body }` |

---

## AI

| Method | Path              | Body                      | Purpose                                        |
| ------ | ----------------- | ------------------------- | ---------------------------------------------- |
| POST   | `/api/ai/command` | `{ command, context }`    | Intent + tool proposal                         |
| POST   | `/api/ai/approve` | `{ toolCallId }`          | Execute approved tool — see `APPROVAL_FLOW.md` |
| POST   | `/api/ai/reject`  | `{ toolCallId, reason? }` | Reject pending tool                            |

**Auth:** Verify `context.organizationId` matches user's membership.

---

## Dashboard (minimal, Phase 6)

| Method | Path                     | Purpose                                                                  |
| ------ | ------------------------ | ------------------------------------------------------------------------ |
| GET    | `/api/dashboard/summary` | `scheduledToday`, `overdueCount`, `unpaidBalance` — real aggregates only |

---

## Error codes (suggested)

| Code                | HTTP | When                  |
| ------------------- | ---- | --------------------- |
| `UNAUTHORIZED`      | 401  | No session            |
| `FORBIDDEN`         | 403  | Role or org           |
| `NOT_FOUND`         | 404  | Card/org              |
| `VALIDATION_ERROR`  | 400  | Zod / move gate       |
| `APPROVAL_REQUIRED` | 202  | AI tool needs approve |

---

## Server Actions alternative

MVP may use Server Actions instead of REST for mutations; keep **same domain functions** and activity logs. Document Action names beside routes when implemented.
