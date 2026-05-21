# Integration tests (T06)

**Run alone:** `npm run test:integration`  
**Requires:** test Supabase project, service role in CI secret

## INT-BOOT — Signup bootstrap

| ID | Case | Steps | Expected | P |
|----|------|-------|----------|---|
| INT-BOOT-001 | Signup creates 9 columns | signUp test user | 9 rows `columns`, state_keys match | P0 |
| INT-BOOT-002 | Profile FK auth.users | insert profile | constraint ok | P0 |
| INT-BOOT-003 | Idempotent re-run bootstrap | call twice | no duplicate columns | P1 |
| INT-BOOT-004 | Full pipeline mode seed | pipeline_mode full | 19 columns | P2 |

## INT-CARD — Card domain

| ID | Case | Expected | P |
|----|------|----------|---|
| INT-CARD-001 | Create card in inquiry | row + activity `card.created` | P0 |
| INT-CARD-002 | Move card updates column_id | activity `card.moved` metadata | P0 |
| INT-CARD-003 | Update customer on card | customer row linked | P0 |
| INT-CARD-004 | Archive sets archived_at | hidden from default board query | P0 |

## INT-MNY — Quotes & invoices

| ID | Case | Expected | P |
|----|------|----------|---|
| INT-MNY-001 | Create quote + items | totals persisted | P0 |
| INT-MNY-002 | One quote per card policy | second draft rules per product | P1 |
| INT-MNY-003 | Invoice draft from quote | line copy | P1 |
| INT-MNY-004 | Mark paid manual | balance 0, activity | P0 |

## INT-RT — Realtime (optional CI)

| ID | Case | Expected | P |
|----|------|----------|---|
| INT-RT-001 | Subscribe board channel | insert card → event received | P2 |

## INT-API — Route integration

See `API_CONTRACTS.md` for HTTP-level cases; INT focuses DB side effects after route call.

## Teardown

Each suite uses isolated `organization_id`; delete org cascade after suite (`DATA_FIXTURES.md`).
