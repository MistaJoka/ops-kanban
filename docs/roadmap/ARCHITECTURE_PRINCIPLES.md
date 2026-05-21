# Architecture principles — build for change

Apply from **Phase 0** so fixes, improvements, and Wave 1–4 additions do not require rewrites.

---

## 1. Layering (stable seams)

```txt
UI (app/, components/)
  → Server Actions / API routes (thin)
    → Domain services (lib/domain/*)  ← business rules live here
      → Data access (lib/db/* or repositories)
        → Supabase (RLS-enforced)
```

**Rule:** UI never calls Supabase directly for writes; routes never embed business rules inline.

---

## 2. Domain modules (add features by module)

| Module | Path | Owns |
|--------|------|------|
| `pipeline` | `lib/domain/pipeline/` | Column rules, move validation, `state_key` |
| `cards` | `lib/domain/cards/` | CRUD, archive, computed badges |
| `customers` | `lib/domain/customers/` | Property/customer |
| `money` | `lib/domain/money/` | Quotes, invoices, paid |
| `activities` | `lib/domain/activities/` | Timeline logging |
| `ai` | `lib/ai/` | Tools, risk, context (existing starter) |
| `integrations` | `lib/integrations/{provider}/` | Adapters (Wave 1+) |

New capability = new module or extend one module; avoid cross-import spaghetti.

---

## 3. Integration adapter pattern (Wave 1+)

```ts
// lib/integrations/types.ts
PaymentAdapter | CommsAdapter | SignAdapter
```

Swap PayPal ↔ Stripe without touching `lib/domain/money/`.

---

## 4. Database discipline

- One migration per concern: `001_core`, `002_auth_profiles`, `003_job_type`, …
- Never edit applied migrations; add new file
- Every new table: `organization_id` + RLS policies in same migration
- Seed constants in TS (`landscaping-default-columns.ts`) synced with SQL comments

---

## 5. Feature flags (org-level)

```ts
features: {
  pipelineMode: 'compact' | 'full',
  aiEnabled: boolean,
  paymentsEnabled: boolean,  // Wave 1
}
```

Ship dark code behind flags; enable per org for pilot.

---

## 6. API & types

- Zod at boundaries (API body, AI tools, forms)
- Shared types in `lib/types/` generated or hand-maintained from schema
- Version breaking API as `/api/v1/` when external consumers exist (post-MVP)

---

## 7. Testing hooks

- Every domain function with logic → unit test
- Every API route → contract test
- Critical paths → E2E ID from `docs/testing/`

Task not **Done** without linked test IDs (see `DEFINITION_OF_DONE.md`).

---

## 8. Observability (Phase 6+)

- Structured logs: `orgId`, `userId`, `cardId`, `action`
- `activities` + `ai_tool_calls` = product audit trail
- `integration_events` = external audit (Wave 1)

---

## 9. Documentation as code companion

When merging a phase:

- Update `DEVELOPMENT_LOG.md`
- Check boxes in `PHASE_TASKS.md`
- If behavior change: update product doc + `TRACEABILITY.md`

---

## 10. What to avoid

- God components (>400 lines) — split by tab/section
- Leaking service role to client
- Hard-coded column names without `state_key`
- AI prompts that include unrestricted DB dumps
- Skipping activity log on mutations
