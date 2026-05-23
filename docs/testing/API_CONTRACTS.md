# API contract tests (T07)

**Run alone:** `npm run test:integration -- api` or tagged `contract`

## Contract rules

- All routes return JSON `{ error?: string, ... }` on failure
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
