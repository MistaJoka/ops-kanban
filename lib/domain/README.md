# Domain layer

Business rules live here — not in React components or raw API routes.

## Modules (create during build)

| Module        | Responsibility                                      |
| ------------- | --------------------------------------------------- |
| `pipeline/`   | `validateMove`, column rules, `state_key`           |
| `cards/`      | CRUD, archive, computed badges                      |
| `customers/`  | Property/customer records                           |
| `money/`      | quotes, invoices, mark paid                         |
| `activities/` | timeline logging                                    |
| `bootstrap/`  | signup: org, board, 9 columns — **no sample cards** |

## Pattern

```ts
// lib/domain/cards/moveCard.ts
export async function moveCard(input: MoveCardInput, ctx: DomainContext) {
  // validate → supabase → activity log
}
```

API routes call domain functions only.

## Tests

Mirror each module under `tests/unit/domain/`.
