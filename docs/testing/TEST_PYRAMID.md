# Test pyramid & levels (T04)

## 1. Pyramid (Wave 0 targets)

```txt
        ┌─────────┐
        │  E2E    │  ~25% cases — 15–25 tests, 8–12 min CI
       ┌┴─────────┴┐
       │ Integration│  ~35% — 40–60 tests, 3–5 min
      ┌┴───────────┴┐
      │    Unit      │  ~40% — 80–120 tests, &lt;1 min
      └──────────────┘
```

## 2. What belongs where

| Level | Includes | Excludes |
|-------|----------|----------|
| **Unit** | `classifyToolRisk`, column validation, title helpers, money sum | Network, DB |
| **Integration** | API routes, Supabase with test DB, webhook processors (mocked provider) | Full browser |
| **E2E** | Playwright: signup, pipeline, card tabs, AI approval UI | Unit logic duplicates |
| **UAT** | Human scripts, real staging feel | CI blocking optional |
| **Exploratory** | Charters T18 | Not automated |

## 3. Tooling recommendations

| Level | Tool |
|-------|------|
| Unit | Vitest |
| Integration | Vitest + Supabase local or branch |
| E2E | Playwright |
| API contracts | Vitest + Zod assert |
| Load | k6 (T13, post-MVP gate) |
| A11y | axe-playwright |

## 4. Coverage targets (Wave 0)

| Area | Line/branch target |
|------|-------------------|
| `lib/ai/risk-classifier` | 100% |
| `lib/ai/tool-executor` | 95% |
| Column move validation | 100% |
| API routes | 85% |
| UI components | 60% (critical paths E2E) |

## 5. Anti-patterns

- E2E for every validation rule → move to unit
- Unit tests that hit production Supabase
- AI tests that call live Gemini in CI without VCR/mock
- Skipping RLS because E2E “looks fine”

## 6. Modular run commands (when implemented)

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:e2e:smoke      # @smoke tag only
npm run test:security
npm run test:ai
npm run test:regression     # full master run
```
