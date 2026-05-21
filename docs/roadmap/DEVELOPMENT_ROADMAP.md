# Development roadmap

Master plan to build OpsBoard **smart, stable, and extensible**. Blueprint docs define *what*; this roadmap defines *when*, *how*, and *done*.

---

## 1. MVP snapshot

Frozen in [`MVP_CAPTURE.md`](./MVP_CAPTURE.md) — **Wave 0** landscaping Job Pipeline + deep cards + money drafts + AI + RLS.

**Ship target:** Phase 6 complete → **v0.1.0 pilot**.

---

## 2. Roadmap overview

```txt
2025 Planning (pre-build)
    │
    ▼
Phase 0   Scaffold ─────────────────────────► CI, structure
    │
    ▼
Phase 1   Foundation ───────────────────────► Auth, RLS, bootstrap
    │
    ▼
Phase 2   Workspace + pipeline ─────────────► Main UI, Kanban
    │
    ▼
Phase 3   Deep card ─────────────────────────► Job record
    │
    ▼
Phase 4   Money drafts ─────────────────────► Quote, invoice
    │
    ▼
Phase 5   AI copilot ────────────────────────► Tools + approval
    │
    ▼
Phase 6   Release hardening ─────────────────► G2 gate, UAT
    │
    ══════════════ MVP v0.1.0 ══════════════
    │
    ▼
Phase 7   Wave 1 — Pay, PDF, portal sign
Phase 8   Wave 2 — Book, calendar, SMS/email
Phase 9   Wave 3 — Files, DocuSign
Phase 10  Wave 4 — QB, automations, reports
```

Platform modules: [`PLATFORM_CAPABILITIES.md`](../product/PLATFORM_CAPABILITIES.md).

---

## 3. How we build for stability

| Principle | Doc |
|-----------|-----|
| Domain layers, no fat routes | `ARCHITECTURE_PRINCIPLES.md` |
| RLS + migrations incremental | `MVP_SCHEMA.md`, migrations |
| Integration adapters | `INTEGRATION_ARCHITECTURE.md` |
| Feature flags per org | `ARCHITECTURE_PRINCIPLES.md` §5 |
| Test ID per feature | `docs/testing/` |
| Log every session | `DEVELOPMENT_LOG.md` |
| Live progress | `PROGRESS.md` |
| AI build loop | `AI_BUILD_PROTOCOL.md` |
| Troubles & fixes | `PROBLEM_REGISTRY.md` |
| Reinforced learning | `BUILD_KNOWLEDGE.md` |

**Fixes later:** patch within `lib/domain/{module}`; do not fork business rules into UI.  
**Additions later:** new migration + module + adapter + tests + traceability row.

---

## 4. Phases at a glance

| Phase | Name | Outcome | DoD | Tasks |
|-------|------|---------|-----|-------|
| 0 | Scaffold | Runnable app + CI | DONE-0 | `PHASE_TASKS` P0 |
| 1 | Foundation | Secure multi-tenant base | DONE-1 | P1 |
| 2 | Workspace | Pipeline usable daily | DONE-2 | P2 |
| 3 | Deep card | Full job record | DONE-3 | P3 |
| 4 | Money | Estimate → paid manual | DONE-4 | P4 |
| 5 | AI | Copilot safe | DONE-5 | P5 |
| 6 | Release | Pilot live | DONE-6 | P6 |
| 7–10 | Waves 1–4 | Feature-rich platform | DONE-7–10 | P7–P10 |

Detailed tasks: [`PHASE_TASKS.md`](./PHASE_TASKS.md).  
Completion criteria: [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md).

---

## 5. Sprint suggestion (MVP)

Assume 1–2 devs + AI assist. Adjust velocity to team.

| Sprint | Phases | Goal |
|--------|--------|------|
| S1 | P0 + P1 | Login, board exists empty, RLS proven |
| S2 | P2 (partial) | Shell + columns + create/move card |
| S3 | P2 (finish) | Filters, realtime, polish |
| S4 | P3 | Card panel all tabs |
| S5 | P4 | Money flow end-to-end |
| S6 | P5 | AI tools + approval |
| S7 | P6 + QA | Hardening, UAT, release |

**~7 sprints to MVP pilot** (2-week sprints ≈ 3–4 months calendar).

---

## 6. AI build & learning protocol

**Primary:** [`AI_BUILD_PROTOCOL.md`](./AI_BUILD_PROTOCOL.md) — session loop, per-phase AI steps, reinforcement rules.

| Artifact | Update when |
|----------|-------------|
| [`PROGRESS.md`](./PROGRESS.md) | Start and end of every session |
| [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md) | Any code or meaningful doc change |
| [`PROBLEM_REGISTRY.md`](./PROBLEM_REGISTRY.md) | Blocker, bug, or >15 min debug detour |
| [`BUILD_KNOWLEDGE.md`](./BUILD_KNOWLEDGE.md) | Reusable fix; promote after 2× same PRB |

**When to log:**

- Phase started / completed
- Task blocked, unblocked, or fixed
- Scope change, waiver, incident
- Release tagged

**Format:** `LOG-YYYY-MM-DD-NN` with Progress, Troubles, Fix, Learning fields (see log template).

---

## 7. Quality gates per phase

| Gate | When |
|------|------|
| PR smoke | Every merge (`REGRESSION_MATRIX`) |
| Phase DoD review | Before starting next phase |
| Nightly | After P1 |
| G2 MVP | End of P6 |

Do not start Phase N+1 until `DONE-N` checklist complete (waivers documented in log).

---

## 8. Documentation sync (on phase complete)

- [ ] `PHASE_TASKS.md` statuses → `done`
- [ ] `PROGRESS.md` phase row → `complete` + %
- [ ] `DEVELOPMENT_LOG.md` phase entry (`complete`)
- [ ] `BUILD_KNOWLEDGE.md` phase section harvest (new LEARN-*)
- [ ] `PROBLEM_REGISTRY.md` open PRBs for phase resolved or carried
- [ ] `PHASE_TASKS.md` all phase tasks `done` (see `IMPLEMENTATION_CHECKLIST.md` redirect)
- [ ] `TRACEABILITY.md` if new REQ
- [ ] `CHANGELOG.md` on P6

---

## 9. Cursor / agent execution

Follow [`AI_BUILD_PROTOCOL.md`](./AI_BUILD_PROTOCOL.md) + [`CURSOR_MASTER_PROMPT.md`](../cursor/CURSOR_MASTER_PROMPT.md).

```txt
Follow AI_BUILD_PROTOCOL.md.
Read PROGRESS.md + open PROBLEM_REGISTRY.md.
Implement TASK-P2-008 per PHASE_TASKS.md and CARD_DESIGN.md.
DoD: DONE-2 items 2.4, 2.8. Tests: E2E-JOB-002.
End: DEVELOPMENT_LOG + PROGRESS + PRB/LEARN if applicable.
```

One task per session reduces regression risk.

---

## 10. Index

| File | Purpose |
|------|---------|
| `DOC_INDEX.md` | Canonical doc map (avoid duplicates) |
| `AI_BUILD_PROTOCOL.md` | AI session loop + per-phase steps |
| `PROGRESS.md` | Live dashboard (read first) |
| `PROBLEM_REGISTRY.md` | Troubles → root cause → fix |
| `BUILD_KNOWLEDGE.md` | LEARN-* reinforced patterns |
| `MVP_CAPTURE.md` | Frozen Wave 0 |
| `PHASE_TASKS.md` | Task backlog IDs |
| `DEFINITION_OF_DONE.md` | Completion criteria |
| `DEVELOPMENT_LOG.md` | Chronological record |
| `ARCHITECTURE_PRINCIPLES.md` | Stable extension rules |
