# AI slop baseline audit

**Date:** 2026-05-23  
**Trigger:** TASK-P14 AI Slop Detection System v2  
**Command:** `npm run check:slop-health`

---

## Executive summary

| Dimension          | Rating        | Notes                                                     |
| ------------------ | ------------- | --------------------------------------------------------- |
| Layer 4 automation | **Strong**    | strict TS, CI lint/typecheck/unit, no-mock script         |
| Layer 2 functional | **Strong**    | E2E R0, outbound sync, AI tool persistence                |
| Layer 3 structural | **Mixed**     | Domain layer solid; 4 mega-files grandfathered then split |
| Layer 1 visual     | **Good**      | UI_MASTER_FORMULA + P12; EXP-VIS-01 added                 |
| Layer 5 drift      | **Now gated** | Drift ritual in AI_BUILD_PROTOCOL §1b                     |

**Verdict:** Repo is production-capable; structural debt concentrated in pipeline + card mutation UI.

---

## Priority backlog

| Priority | Finding                                                        | Lines (baseline) | Action                                | Status      |
| -------- | -------------------------------------------------------------- | ---------------- | ------------------------------------- | ----------- |
| P0       | `components/pipeline/KanbanBoard.tsx`                          | 1097 → **156**   | Split → `kanban-board/*`              | done        |
| P0       | `components/card/useCardMutations.ts`                          | 1079 → **567**   | Split → `useCardMoneyMutations`       | done        |
| P1       | `components/pipeline/kanban-board/useKanbanBoardController.ts` | 692              | Further split drag/bulk (allowlisted) | open        |
| P1       | `components/pipeline/useBoardState.ts`                         | 740              | Extract sync folder (future)          | open        |
| P1       | `lib/domain/ai/toolCalls.ts`                                   | 840              | Split by tool category (future)       | allowlisted |
| P2       | AI UI wrappers (`AiDock` + shells)                             | —                | Document canonical `AiCommandDock`    | open        |
| P2       | Settings pages inline fetch                                    | —                | `useSettings*` hooks (D4 stretch)     | open        |
| Low      | No Prettier                                                    | —                | Phase B                               | done        |
| Low      | `tests/unit/domain/` missing                                   | —                | Optional reorganize                   | open        |

---

## Structural rules (enforced)

- `check:slop-health` fails files **>600** lines (allowlist shrinks per remediation)
- UI must not import `@supabase/supabase-js`
- Business rules stay in `lib/domain/*`; API routes are thin

---

## PRB registry

| ID           | Summary                           | Status                   |
| ------------ | --------------------------------- | ------------------------ |
| PRB-SLOP-001 | KanbanBoard god component         | resolved → split P14-004 |
| PRB-SLOP-002 | useCardMutations mega-hook        | resolved → split P14-005 |
| PRB-SLOP-003 | useBoardState orchestration bloat | open                     |
| PRB-SLOP-004 | toolCalls.ts size                 | open (allowlisted)       |

---

## Next drift review

After **10** LOG entries or **2026-06-23**:

1. `npm run check:slop-health`
2. Re-score table above
3. Remove allowlist entries for any split file still listed
