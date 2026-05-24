# AI build phases — OpsBoard copilot roadmap

**Canonical phase plan for AI beyond P5.** Task tracking lives in [`PHASE_TASKS.md`](../roadmap/PHASE_TASKS.md) (`TASK-AI-Px-xxx`).  
Product behavior: [`AI_UTILIZATION.md`](./AI_UTILIZATION.md). Competitive gaps: [`AI_COMPETITIVE_BENCHMARK.md`](./AI_COMPETITIVE_BENCHMARK.md).

`last_updated`: 2025-05-22

---

## Phase map (overview)

| Phase     | Name                   | Status      | Goal                                                                    |
| --------- | ---------------------- | ----------- | ----------------------------------------------------------------------- |
| **AI-P0** | Foundation             | complete    | Context, API, approval, audit                                           |
| **AI-P1** | Intelligence           | complete    | Gemini function calling, LLM estimates, daily brief                     |
| **AI-P2** | Revenue loop           | complete    | Invoice draft, pay link, inline CTAs, assign-by-name                    |
| **AI-P3** | Scheduling             | complete    | Calendar context, conflicts, NL reschedule                              |
| **AI-P4** | Customer & money intel | complete    | Customer 360, unpaid AR, dashboard/reports copilot                      |
| **AI-P5** | Field & polish         | complete    | Voice, SSE, next_action UI, vision, ai_memories, notifications bell |

Legacy roadmap **P5** maps to AI-P0 + AI-P1. Waves A–D from competitive benchmark map to AI-P2–P5.

---

## AI-P0 — Foundation (complete)

| Task           | Deliverable                          |
| -------------- | ------------------------------------ |
| Context loader | `loadAiContext` board + card         |
| Command API    | `POST /api/ai/command`               |
| Tool executor  | Domain-only writes + `ai_tool_calls` |
| Approval flow  | Modal + approve/reject API           |
| Surfaces       | Board dock, card rail                |
| Rate limit     | Per-user throttle                    |
| Tests          | AI-TOOL, AI-INJ, INT-API             |

**Exit:** Safe mutations only through tools; viewer read-only.

---

## AI-P1 — Intelligence (complete)

| Task            | Deliverable                              |
| --------------- | ---------------------------------------- |
| Gemini agent    | `runGeminiAgent` + function declarations |
| LLM estimates   | `parseEstimateLineItems`                 |
| Daily brief     | `getDailyBrief` + morning auto-load      |
| Card search     | `searchCards` + disambiguation           |
| Multi-turn UX   | Mode chips, conversation thread          |
| Human previews  | `buildApprovalPreview`                   |
| High-risk tools | `markInvoicePaid`, `archiveCard`         |

**Exit:** Natural language works with `GEMINI_API_KEY`; regex fallback without.

---

## AI-P2 — Revenue loop

**Goal:** Close inquiry → estimate → invoice → pay without leaving copilot.

| Task ID        | Deliverable              | Tool / UI                               |
| -------------- | ------------------------ | --------------------------------------- |
| TASK-AI-P2-001 | Invoice draft via AI     | `createInvoiceDraft`                    |
| TASK-AI-P2-002 | Payment link proposal    | `createPaymentLink`                     |
| TASK-AI-P2-003 | Assign crew by name      | `searchMembers` + resolver              |
| TASK-AI-P2-004 | Inline estimate CTA      | Card Overview AI draft button           |
| TASK-AI-P2-005 | Inline invoice CTA       | Card move → complete → AI invoice offer |
| TASK-AI-P2-006 | Board move inline banner | `AiInlineBanner` on column enter        |

**Exit:** Owner can say “create invoice for this job” and “send payment link” with approval.

---

## AI-P3 — Scheduling copilot

**Goal:** Calendar-aware AI for dispatch and conflict awareness.

| Task ID        | Deliverable             | Tool / UI                      |
| -------------- | ----------------------- | ------------------------------ |
| TASK-AI-P3-001 | Calendar context loader | `page: 'calendar'`             |
| TASK-AI-P3-002 | Week schedule read      | `getCalendarSchedule`          |
| TASK-AI-P3-003 | Conflict detection      | `findScheduleConflicts`        |
| TASK-AI-P3-004 | NL reschedule           | `rescheduleEvent`              |
| TASK-AI-P3-005 | Calendar page copilot   | `AiPageCopilot` on `/calendar` |

**Exit:** “Any conflicts Thursday?” and “Move Rivera job to Friday 9am” work from calendar.

---

## AI-P4 — Customer & money intelligence

**Goal:** Customer 360 and AR visibility outside the card rail.

| Task ID        | Deliverable              | Tool / UI                           |
| -------------- | ------------------------ | ----------------------------------- |
| TASK-AI-P4-001 | Dashboard context        | `page: 'dashboard'`                 |
| TASK-AI-P4-002 | Reports context          | `page: 'reports'`                   |
| TASK-AI-P4-003 | Unpaid invoices list     | `getUnpaidInvoices`                 |
| TASK-AI-P4-004 | Revenue summary          | `getRevenueSummary`                 |
| TASK-AI-P4-005 | Customer history         | `summarizeCustomerHistory`          |
| TASK-AI-P4-006 | Search / create customer | `searchCustomers`, `createCustomer` |
| TASK-AI-P4-007 | Multi-page copilot       | Dashboard, Customers, Reports       |

**Exit:** “Who owes over $500?” and “Summarize Chen before I call” work.

---

## AI-P5 — Field & polish

**Goal:** Proactive nudges and field-friendly input.

| Task ID        | Deliverable               | Tool / UI                                 |
| -------------- | ------------------------- | ----------------------------------------- |
| TASK-AI-P5-001 | Voice input               | Web Speech API on `AiDock`                |
| TASK-AI-P5-002 | Empty next_action suggest | Inline on Overview                        |
| TASK-AI-P5-003 | App context API           | `GET /api/app/context` for client pages   |
| TASK-AI-P5-004 | Streaming responses       | SSE on `/api/ai/command` (`stream: true`) |
| TASK-AI-P5-005 | Vision on attachments     | Photo → scope (future)                    |

**Exit:** Crew lead can dictate updates; empty next_action gets one-tap AI fill.

---

## Tool rollout by phase

| Tool                             | P0  | P1  | P2  | P3  | P4  | P5  |
| -------------------------------- | :-: | :-: | :-: | :-: | :-: | :-: |
| Tier 1 read tools                |  ✓  |  ✓  |     |     |     |     |
| Tier 2 write tools               |  ✓  |  ✓  |     |     |     |     |
| Gemini agent                     |     |  ✓  |     |     |     |     |
| createInvoiceDraft               |     |     |  ✓  |     |     |     |
| createPaymentLink                |     |     |  ✓  |     |     |     |
| searchMembers                    |     |     |  ✓  |     |     |     |
| getCalendarSchedule              |     |     |     |  ✓  |     |     |
| findScheduleConflicts            |     |     |     |  ✓  |     |     |
| rescheduleEvent                  |     |     |     |  ✓  |     |     |
| getUnpaidInvoices                |     |     |     |     |  ✓  |     |
| getRevenueSummary                |     |     |     |     |  ✓  |     |
| summarizeCustomerHistory         |     |     |     |     |  ✓  |     |
| searchCustomers / createCustomer |     |     |     |     |  ✓  |     |
| Voice input                      |     |     |     |     |     |  ✓  |

---

## Dependencies

```txt
AI-P0 → AI-P1 → AI-P2 → AI-P3
                  ↘ AI-P4 (parallel after P2)
                  ↘ AI-P5 (parallel after P1)
```

P4 dashboard/reports can ship in parallel with P3. P5 voice is independent of P3.

---

## Verification per phase

| Phase | Command                                         |
| ----- | ----------------------------------------------- |
| P0–P1 | `npm run test:ai`                               |
| P2    | “Create invoice for this job” + approval        |
| P3    | “Any schedule conflicts this week?” on calendar |
| P4    | “Who owes money?” on dashboard                  |
| P5    | Mic button transcribes → submits command        |

---

## Related

| Doc                                              | Role           |
| ------------------------------------------------ | -------------- |
| [`AI_TOOL_REGISTRY.md`](./AI_TOOL_REGISTRY.md)   | Schemas & risk |
| [`AI_IMPLEMENTATION.md`](./AI_IMPLEMENTATION.md) | Pipeline       |
| [`PHASE_TASKS.md`](../roadmap/PHASE_TASKS.md)    | Task statuses  |
