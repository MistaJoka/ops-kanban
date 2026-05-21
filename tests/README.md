# Tests directory

Implementation home for the modular pack in `docs/testing/`.

## Quick start (when app exists)

```bash
cp .env.example .env.test
npm run test:seed          # DATA_FIXTURES
npm run test:unit          # T05
npm run test:integration   # T06–T08
npm run test:ai            # T10
npm run test:e2e           # T09
npm run test:regression    # Master run per docs/testing/README.md
```

## Layout

```txt
tests/
  unit/
  integration/
  e2e/
  ai/
  webhooks/       # Wave 1+
  fixtures/
  helpers/
```

## Test IDs

Use IDs from pack docs (`UNIT-PIPE-001`, `E2E-JOB-001`, etc.) in `test()` descriptions:

```ts
test('UNIT-PIPE-004: scheduled without date is blocked', () => { ... });
```

## CI

See `docs/testing/README.md` § CI mapping.
