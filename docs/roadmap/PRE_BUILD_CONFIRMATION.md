# Pre-build confirmation checklist

Sign-off that blueprint + policy are aligned before **TASK-P0-001**.

| #   | Confirmation                                          | Status |
| --- | ----------------------------------------------------- | ------ |
| 1   | MVP scope frozen — `MVP_CAPTURE.md`                   | ✓      |
| 2   | No mock data in production — `NO_MOCK_DATA_POLICY.md` | ✓      |
| 3   | Phases & tasks — `PHASE_TASKS.md`                     | ✓      |
| 4   | DoD per phase — `DEFINITION_OF_DONE.md`               | ✓      |
| 5   | QA pack modular — `docs/testing/README.md`            | ✓      |
| 6   | RLS Phase 1 — not deferred                            | ✓      |
| 7   | Starter code stubs identified for P5 wiring           | ✓      |
| 8   | Test fixtures isolated from `app/`                    | ✓      |
| 9   | Pipeline ends with `archived` (not `closed`)          | ✓      |
| 10  | Migrations 001–006 + RLS SQL exist                    | ✓      |
| 11  | API + approval + AGENTS + no-mock script              | ✓      |

## Stubs to replace during build (not shipped as MVP behavior)

| Location                                  | Issue                      | Phase |
| ----------------------------------------- | -------------------------- | ----- |
| `src-starter/lib/ai/tool-executor.ts`     | Fake “executed” without DB | P5    |
| `src-starter/lib/ai/context-loader.ts`    | TODO queries               | P5    |
| `src-starter/app/api/ai/command/route.ts` | Text-only, no tool loop    | P5    |

## Explicitly NOT mock data

- Signup column seed (structure only)
- Test orgs in `tests/` only
- Help/support markdown pages
- Input `placeholder` attributes
- Empty states

## Build start criterion

All stakeholders accept:

1. Wave 0 pilot starts with **empty pipeline** after signup.
2. **No demo mode** in v0.1.0.
3. Files/integrations tabs **hidden or empty** until Wave 1+ unless real data exists.

**Ready to build:** when above confirmed → begin `TASK-P0-001`.
