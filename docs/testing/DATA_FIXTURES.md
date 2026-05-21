# Data fixtures & test seed (T15)

**Run alone:** `npm run test:seed` before integration/E2E

## Fixture orgs

| Key | Org name | Pipeline | Users |
|-----|----------|----------|-------|
| `alpha` | Test Alpha Landscaping | compact | owner, manager, worker, viewer |
| `beta` | Test Beta Lawn | compact | owner |
| `full` | Gamma Full Pipeline | full 19 col | owner |

## Standard cards (alpha)

| Fixture ID | Title | Column | Notes |
|------------|-------|--------|-------|
| FIX-INQ-01 | Rivera — Spring cleanup | inquiry | no customer |
| FIX-EST-01 | Miller — Mulch | estimating | quote draft 3 lines |
| FIX-SCH-01 | Oak St — Weekly mow | scheduled | date tomorrow |
| FIX-BLK-01 | Park HOA — Install | on_site | priority urgent |
| FIX-PAY-01 | Lee — Cleanup | complete | invoice balance due |

## Factory API (implement in `tests/helpers/factories.ts`)

```ts
createOrg(opts)
createCard(org, { columnStateKey, title, customer })
createQuote(card, { lineItems })
runBootstrapPipeline(org, 'compact' | 'full')
```

## Teardown

```ts
deleteOrg(alpha.id) // cascade
```

## Deterministic IDs

Use UUID v5 from namespace `opsboard-test` for stable E2E selectors when needed.

## AI fixtures

`tests/fixtures/ai/summarize-response.json`  
`tests/fixtures/ai/move-card-approval.json`

## Webhook fixtures (Wave 1+)

`tests/fixtures/webhooks/paypal/payment-completed.json`
