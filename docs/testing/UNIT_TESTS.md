# Unit tests (T05)

**Run alone:** `npm run test:unit`  
**Tags:** `unit`, `P0` where noted

## UNIT-PIPE — Pipeline validation

| ID | Case | Input | Expected | P |
|----|------|-------|----------|---|
| UNIT-PIPE-001 | Valid forward move | `inquiry`→`site_visit` | allow | P0 |
| UNIT-PIPE-002 | Skip inquiry→estimating | owner role | allow + log flag | P1 |
| UNIT-PIPE-003 | Skip without role | worker | deny | P0 |
| UNIT-PIPE-004 | scheduled without date | `scheduled`, no start | block | P0 |
| UNIT-PIPE-005 | estimate_sent empty quote | total=0 | block | P0 |
| UNIT-PIPE-006 | archived sets archived_at | move to `archived` | archived timestamp | P0 |
| UNIT-PIPE-007 | Compact→full state map | `archived` card | maps to full `archived`/`paid`/`retention` | P2 |

## UNIT-VAL — Field validators

| ID | Case | Expected | P |
|----|------|----------|---|
| UNIT-VAL-001 | Title min length 1 | pass/fail | P0 |
| UNIT-VAL-002 | Quote total &gt; 0 for sent | fail at 0 | P0 |
| UNIT-VAL-003 | scheduled_start required | fail null | P0 |
| UNIT-VAL-004 | Phone normalize E.164 | consistent | P2 |
| UNIT-VAL-005 | revenue_value non-negative | fail negative | P1 |

## UNIT-AI — Risk & tools

| ID | Case | Expected | P |
|----|------|----------|---|
| UNIT-AI-001 | classifyToolRisk moveCard | medium | P0 |
| UNIT-AI-002 | classifyToolRisk summarizeCard | low | P0 |
| UNIT-AI-003 | classifyToolRisk markInvoicePaid | high | P0 |
| UNIT-AI-004 | requiresApproval medium | true | P0 |
| UNIT-AI-005 | worker cannot archive | role check fail | P0 |
| UNIT-AI-006 | Zod createCard invalid uuid | throw | P0 |

## UNIT-MNY — Money calculations

| ID | Case | Expected | P |
|----|------|----------|---|
| UNIT-MNY-001 | Quote line items sum | subtotal correct | P0 |
| UNIT-MNY-002 | Tax + total | 2 decimal precision | P1 |
| UNIT-MNY-003 | Invoice balance_due | total - payments | P0 |

## UNIT-CTX — Context loader (no network)

| ID | Case | Expected | P |
|----|------|----------|---|
| UNIT-CTX-001 | Board caps cards at 40 | slice | P0 |
| UNIT-CTX-002 | Card package excludes other org | filter | P0 |

## Implementation notes

- Mock Supabase in unit tests only when testing query builders; prefer pure functions extracted from route handlers.
- File targets: `landscaping-default-columns.ts`, `risk-classifier.ts`, `tool-registry.ts` schemas, future `validateCardMove.ts`.
