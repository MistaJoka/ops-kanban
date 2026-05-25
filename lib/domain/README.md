# Domain layer

Business rules live here — not in React components or raw API routes.

See [`docs/roadmap/ARCHITECTURE_PRINCIPLES.md`](../docs/roadmap/ARCHITECTURE_PRINCIPLES.md). API routes call domain functions only; AI tools call the same paths.

## Module map

| Module | Path | Responsibility |
| ------ | ---- | -------------- |
| **Pipeline** | `pipeline/` | `validateMove`, `stateMap`, column rules, `pickActiveGroup` |
| **Cards** | `cards/` | CRUD, move, reorder, archive, signals, board formatters, `cardSelect` |
| **Customers** | `customers/` | Create, list, upsert, customer history |
| **Money** | `money/` | Quotes, invoices, settle, estimate export, money math |
| **Intake** | `intake/` | `processIntake`, match open card, inquiry pages — unified web/SMS/booking |
| **Booking** | `booking/` | Booking pages, `createBooking` (atomic RPC) |
| **Comms** | `comms/` | Messages, templates, SMS webhook, send SMS/email |
| **Comments** | `comments/` | Card comments + auth |
| **Activities** | `activities/` | Timeline logging, list card activities |
| **Documents** | `documents/` | Attachments, signatures, change orders |
| **Contracts** | `contracts/` | Recurring contracts, run due |
| **Automations** | `automations/` | CRUD, `runAutomationsForColumnEnter` |
| **Accounting** | `accounting/` | Native ledger, AR register, CSV export |
| **Board** | `board/` | `getBoard`, filters, sync queue, outbound sync status |
| **Scheduling** | `scheduling/` | Scheduled cards list |
| **Calendar** | `calendar/` | Week date helpers |
| **Dashboard** | `dashboard/` | Summary aggregates |
| **Reports** | `reports/` | Report aggregates |
| **Integrations** | `integrations/` | Integration accounts, payments, portal tokens, webhooks |
| **Organization** | `organization/` | Settings, members |
| **Auth** | `auth/` | Roles, app context, server actions |
| **Bootstrap** | `bootstrap/` | Signup: org, board, 9 columns — **no sample cards** |
| **Mutations** | `mutations/` | Claim-first idempotency (`client_mutations`, `inquiry_requests`) |
| **AI** | `ai/` | Tool calls, memories, persist, `tools/*` registry executors |
| **Dev** | `dev/` | Dev workspace helpers, reset board |
| **API helpers** | `api/` | `handlerContext` for route auth |
| **DB** | `db/` | `mapSupabaseError` |
| **Errors** | `errors.ts` | `DomainError` taxonomy |
| **Validation** | `validation/` | Shared field validators |

## Pattern

```ts
// lib/domain/cards/moveCard.ts
export async function moveCard(input: MoveCardInput, ctx: DomainContext) {
  // validate → supabase → activity log
}
```

Throw `DomainError` for expected failures; routes map to JSON via `mapSupabaseError`.

## Intake (unified entry)

All customer entry paths converge on `processIntake()`:

- Public `/inquiry/{slug}` form
- Inbound SMS (`processSmsWebhook`)
- Public booking (`createBooking` → atomic RPC)

Dedup: attach to open card by phone/email; idempotency via `inquiry_requests`.

## Tests

Mirror modules under `tests/unit/` and `tests/integration/`. Domain README is not exhaustive — grep `lib/domain/` for new modules.

## Schema

Wave 0 tables: [`docs/database/MVP_SCHEMA.md`](../docs/database/MVP_SCHEMA.md). Extensions: [`SCHEMA_CHANGELOG.md`](../docs/database/SCHEMA_CHANGELOG.md).
