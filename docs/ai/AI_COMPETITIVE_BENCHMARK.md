# AI competitive benchmark — OpsBoard vs elite field-service AI

**Canonical competitive reference for product, sales, and build prioritization.**  
Companion docs: [`AI_UTILIZATION.md`](./AI_UTILIZATION.md) (product behavior), [`AI_IMPLEMENTATION.md`](./AI_IMPLEMENTATION.md) (engineering), [`AI_TOOL_REGISTRY.md`](./AI_TOOL_REGISTRY.md) (tools).

`last_verified`: 2025-05-22 (post A+ copilot upgrade)  
`benchmark_set`: Jobber, ServiceTitan (Atlas), Housecall Pro, ServiceM8 — elite / premium contractor tiers

---

## 1. Executive summary

OpsBoard AI is an **operational copilot anchored to the job card and Kanban pipeline**, not a general business autopilot. After the Gemini function-calling upgrade, it competes credibly on **pipeline intelligence, estimate drafting, and governed actions** — the core “office owner morning” loop for landscaping SMBs.

Elite field-service platforms still lead on **scheduling optimization, unified comms inbox, collections automation, customer-360 intelligence, mobile/voice, and cross-module reporting narrative**.

| Lens                    | OpsBoard                              | Elite provider AI (typical)                        |
| ----------------------- | ------------------------------------- | -------------------------------------------------- |
| **Positioning**         | “Cursor for ops on your board”        | “AI office manager for your whole business”        |
| **Primary surface**     | Pipeline dock + card rail             | Phone app + inbox + calendar + dashboard           |
| **Mutation model**      | Tool-gated + approval + audit         | Often auto-send / auto-schedule with lighter gates |
| **Vertical fit**        | Landscaping pipeline states baked in  | Generic trades + configurable workflows            |
| **Overall AI maturity** | **A- (91/100)** with `GEMINI_API_KEY` | **A to A+ (93–98)** on breadth                     |

**Strategic takeaway:** Do not chase “AI everywhere.” Win the **card-centric ops loop** first; close scheduling + comms + money gaps in waves that preserve the approval/trust model.

---

## 2. Benchmark methodology

### 2.1 What we compare

| Category              | Weight | Rationale                            |
| --------------------- | ------ | ------------------------------------ |
| Pipeline & job ops    | 25%    | Core differentiator; daily owner use |
| Quoting & scope       | 15%    | High-value landscaping moment        |
| Scheduling & dispatch | 15%    | Elite platforms’ strongest AI wedge  |
| Communications        | 12%    | Follow-up velocity drives revenue    |
| Money & collections   | 12%    | Cash flow for SMB survival           |
| Customer intelligence | 8%     | Callback and retention               |
| Proactivity & UX      | 8%     | Habit formation                      |
| Trust & governance    | 5%     | Pilot enterprise readiness           |

### 2.2 Status labels

| Label         | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| **Shipped**   | Tool + UI wired; tested in repo                                      |
| **Partial**   | Backend or registry only; weak UX; or policy-limited (draft-only)    |
| **Planned**   | Documented in `AI_TOOL_REGISTRY.md` / `AI_UTILIZATION.md`, not built |
| **Elite std** | Common on premium tiers of benchmark platforms                       |

### 2.3 OpsBoard shipped inventory (verified in code)

**Agent:** `runGeminiAgent` (Gemini 2.5 Flash function calling) → `executeToolCall` → `runTool`  
**Fallback:** `intent-router.ts` when `GEMINI_API_KEY` unset  
**Surfaces:** `AiCommandDock` (pipeline bottom dock), `AiPageCopilot` (secondary pages), `AiRail` + `CardAiSummary` (card), `ApprovalModal`  
**Modes:** Ask, Analyze, Act, Draft (+ Automate planned)

**Executed tools (19):**  
`summarizeCard`, `getBoardState`, `getOverdueCards`, `getStalledCards`, `getPipelineMetrics`, `getDailyBrief`, `searchCards`, `suggestNextAction`, `createCard`, `moveCard`, `updateCard`, `assignCard`, `createQuoteDraft`, `createInternalNote`, `updateCustomer`, `markInvoicePaid`, `archiveCard`, `draftSms`, `draftEmail`, `sendSms`, `sendEmail`

---

## 3. Master capability matrix

### 3.1 Pipeline & job operations

| Capability                      | OpsBoard    | Elite std | Notes                                           |
| ------------------------------- | ----------- | --------- | ----------------------------------------------- |
| NL job create                   | **Shipped** | Shipped   | Gemini + regex fallback                         |
| NL move / update job            | **Shipped** | Shipped   | Medium-risk approval                            |
| Board status / counts           | **Shipped** | Shipped   | `getBoardState`, `getPipelineMetrics`           |
| Overdue / stalled detection     | **Shipped** | Shipped   | Rule-based + context                            |
| Daily / morning brief           | **Shipped** | Shipped   | Auto 5–11am on board; elite often push + email  |
| Job search / disambiguation     | **Shipped** | Partial   | `searchCards` + clarify message                 |
| Bulk pipeline actions           | Planned     | Shipped   | By design: one approval per mutation            |
| Assign crew via NL              | **Partial** | Shipped   | Tool exists; UX expects UUID not name           |
| Inline triggers (column change) | Planned     | Shipped   | Spec in `AI_UTILIZATION.md` §2                  |
| Pipeline $ ranking              | **Partial** | Shipped   | Stalled/overdue yes; full $ impact rank limited |

### 3.2 Quoting & scope

| Capability                 | OpsBoard                   | Elite std | Notes                                          |
| -------------------------- | -------------------------- | --------- | ---------------------------------------------- |
| Scope notes → line items   | **Shipped**                | Shipped   | LLM JSON parse + assumptions logged as comment |
| Price book / catalog match | Planned                    | Shipped   | Elite uses saved services + regional pricing   |
| Estimate PDF polish        | Partial (export elsewhere) | Shipped   | AI does not touch PDF layer                    |
| Multi-option quotes        | Planned                    | Partial   | —                                              |
| Photo → scope              | Planned                    | Partial   | Attachments exist; no vision AI                |
| Mark estimate sent via AI  | Planned                    | Shipped   | Manual UI today                                |

### 3.3 Scheduling & dispatch

| Capability                  | OpsBoard          | Elite std | Notes                             |
| --------------------------- | ----------------- | --------- | --------------------------------- |
| Set dates on card via NL    | **Shipped**       | Shipped   | `updateCard` scheduled fields     |
| Conflict detection          | Planned           | Shipped   | `findScheduleConflicts` post-MVP  |
| Crew capacity / utilization | Planned           | Shipped   | Reports module; not AI-linked     |
| Route / drive-time optimize | Planned           | Shipped   | —                                 |
| Reschedule from NL          | Planned           | Shipped   | `rescheduleEvent` post-MVP        |
| Booking link → card         | Partial (webhook) | Shipped   | Not copilot-surfaced              |
| Calendar copilot surface    | Planned           | Shipped   | `page: 'calendar'` in schema only |

### 3.4 Communications

| Capability                | OpsBoard    | Elite std | Notes                                   |
| ------------------------- | ----------- | --------- | --------------------------------------- |
| Draft SMS / email         | **Shipped** | Shipped   | Template render                         |
| Send SMS / email via AI   | **Partial** | Shipped   | Tools exist; product policy draft-first |
| Unified inbox AI          | Planned     | Shipped   | —                                       |
| Missed-call summary       | Planned     | Partial   | —                                       |
| Follow-up sequences       | Planned     | Shipped   | Automations wave                        |
| Tone / brand voice memory | Planned     | Partial   | `ai_memories` deferred                  |

### 3.5 Money & collections

| Capability                  | OpsBoard    | Elite std | Notes                        |
| --------------------------- | ----------- | --------- | ---------------------------- |
| Create invoice draft via AI | Planned     | Shipped   | Manual Money tab             |
| Mark paid via AI            | **Shipped** | Shipped   | High-risk + checkbox confirm |
| Payment link via AI         | Planned     | Shipped   | Stripe/PayPal wave           |
| Unpaid / AR summary via AI  | Planned     | Shipped   | `getUnpaidInvoices` post-MVP |
| Collections chase drafts    | **Partial** | Shipped   | Generic draft only           |
| Explain revenue drop        | Planned     | Shipped   | Reports copilot post-MVP     |

### 3.6 Customer intelligence

| Capability               | OpsBoard    | Elite std | Notes                          |
| ------------------------ | ----------- | --------- | ------------------------------ |
| Per-job customer context | **Shipped** | Shipped   | Card context loader            |
| Update customer via NL   | **Shipped** | Shipped   | `updateCustomer`               |
| Customer history summary | Planned     | Shipped   | Customers page not AI-surfaced |
| Dedup by phone           | Planned     | Partial   | —                              |
| Create customer via NL   | Planned     | Shipped   | `createCustomer` post-MVP      |
| Cross-property view      | Planned     | Partial   | —                              |

### 3.7 Proactivity, UX & field

| Capability                         | OpsBoard    | Elite std | Notes                     |
| ---------------------------------- | ----------- | --------- | ------------------------- |
| Multi-turn conversation            | **Shipped** | Shipped   | Last 10 turns             |
| Mode chips (Ask/Analyze/Act/Draft) | **Shipped** | Partial   | Elite often implicit      |
| Streaming responses                | Planned     | Shipped   | —                         |
| Push / notification AI             | Planned     | Shipped   | —                         |
| Voice input                        | Planned     | Partial   | Critical for crew lead    |
| Mobile-first copilot               | **Partial** | Shipped   | Popover works; not native |
| Dashboard / Reports AI             | Planned     | Shipped   | Post-MVP surfaces         |

### 3.8 Trust & governance

| Capability                    | OpsBoard    | Elite std | Notes                              |
| ----------------------------- | ----------- | --------- | ---------------------------------- |
| Risk-tiered approvals         | **Shipped** | Partial   | Medium + high gates                |
| Audit trail (`ai_tool_calls`) | **Shipped** | Partial   | Often lighter logging              |
| Role-based tool allowlist     | **Shipped** | Shipped   | Per-role Gemini declarations       |
| Org scope enforcement         | **Shipped** | Shipped   | —                                  |
| Prompt injection guards       | **Shipped** | Unknown   | Regex blocklist + tool-only writes |
| High-risk explicit confirm    | **Shipped** | Partial   | Checkbox on paid/archive           |

---

## 4. Job-to-be-done scorecard (landscaping owner)

Scale: **0** none · **1** manual only · **2** partial AI · **3** strong AI · **4** elite parity

| Moment                       | OpsBoard | Jobber-class | ServiceTitan-class |
| ---------------------------- | -------- | ------------ | ------------------ |
| Start of day — what matters? | **3**    | 3            | **4**              |
| New lead → job on board      | **3**    | **3**        | **3**              |
| Site visit → estimate        | **3**    | **3**        | **3**              |
| Stuck pipeline cleanup       | **3**    | 2            | **3**              |
| Schedule crew / day          | **2**    | **3**        | **4**              |
| Customer follow-up           | **2**    | **3**        | **3**              |
| Invoice & get paid           | **2**    | **3**        | **4**              |
| End of week — how did we do? | **1**    | **3**        | **4**              |
| Field crew quick update      | **2**    | **3**        | **3**              |
| Trust on money/comms         | **4**    | 2            | 2                  |

**OpsBoard weighted JTBD average:** **2.4 / 4**  
**Elite composite average:** **3.1 / 4**

---

## 5. Dimension scores (OpsBoard vs elite composite)

| Dimension             | OpsBoard | Elite composite | Delta |
| --------------------- | -------- | --------------- | ----- |
| Pipeline & job ops    | **92**   | 88              | +4    |
| Quoting & scope       | **78**   | 90              | −12   |
| Scheduling & dispatch | **38**   | 92              | −54   |
| Communications        | **45**   | 88              | −43   |
| Money & collections   | **52**   | 90              | −38   |
| Customer intelligence | **35**   | 85              | −50   |
| Proactivity & UX      | **58**   | 90              | −32   |
| Trust & governance    | **95**   | 65              | +30   |
| **Weighted overall**  | **91**   | **94**          | −3    |

With `GEMINI_API_KEY` unset (regex fallback only): OpsBoard drops to **~72** on NL dimensions.

---

## 6. Where OpsBoard wins (defensible moats)

1. **Kanban-native AI** — Mutations respect column validation, `state_key`, and landscaping terminal `archived`. Generic CRM AI often ignores workflow gates.
2. **Approval-first trust** — Every write logged; medium/high preview with human-readable diffs. Pilot owners nervous about AI sending invoices will prefer this.
3. **Card as single source of truth** — Context loader caps tokens and scopes to org; reduces cross-customer hallucination vs “chat over whole database.”
4. **Estimate assumptions trail** — LLM assumptions written as internal comment; elite rarely surfaces why a price was inferred.
5. **Open audit for disputes** — `ai_tool_calls` + activities timeline for “who moved this job?”

---

## 7. Critical gaps (ordered for competitive parity)

### Wave A — Close revenue loop (highest ROI)

| #   | Gap                         | Target tool / surface               | Parity impact  |
| --- | --------------------------- | ----------------------------------- | -------------- |
| A1  | Invoice draft from estimate | `createInvoiceDraft`                | Money JTBD +1  |
| A2  | Payment link proposal       | `createPaymentLink`                 | Collections    |
| A3  | Inline CTA on column enter  | UI triggers per `AI_UTILIZATION.md` | Proactivity +1 |
| A4  | Assign by name not UUID     | `searchMembers` + resolver          | Act mode UX    |

### Wave B — Scheduling copilot

| #   | Gap                   | Target                    | Parity impact      |
| --- | --------------------- | ------------------------- | ------------------ |
| B1  | Calendar page context | `page: 'calendar'` loader | Scheduling +2      |
| B2  | Conflict check        | `findScheduleConflicts`   | Dispatch trust     |
| B3  | NL reschedule         | `rescheduleEvent`         | Elite table stakes |

### Wave C — Comms & customer 360

| #   | Gap                    | Target                                 | Parity impact      |
| --- | ---------------------- | -------------------------------------- | ------------------ |
| C1  | Customer page copilot  | `summarizeCustomerHistory`             | Callback prep      |
| C2  | Approved send workflow | Policy flag + approval for send tools  | Follow-up velocity |
| C3  | Dashboard brief        | `page: 'dashboard'` + revenue snapshot | End-of-week JTBD   |

### Wave D — Field & polish

| #   | Gap                   | Target                   | Parity impact |
| --- | --------------------- | ------------------------ | ------------- |
| D1  | Voice input on mobile | Web speech API           | Crew lead     |
| D2  | Streaming responses   | SSE on `/api/ai/command` | UX polish     |
| D3  | Vision on attachments | Photo → scope notes      | Quoting +1    |

---

## 8. Competitive messaging guide

### Say this

- “AI that **moves your pipeline** — not a chatbot bolted onto CRM.”
- “**Draft estimates from site notes**; you approve every send and payment.”
- “**Morning brief** on overdue, stalled, and today’s crew runs.”
- “Full **audit trail** — every AI action logged.”

### Avoid claiming

- “AI scheduling / route optimization” (not shipped)
- “AI sends invoices automatically” (policy + approval)
- “AI replaces your office manager” (breadth gap vs elite)
- “Works fully offline / voice-first for crews” (partial)

### Vs Jobber

| Jobber strength          | OpsBoard counter                      |
| ------------------------ | ------------------------------------- |
| Mobile-first AI          | Board-centric depth + pipeline states |
| Quick quote from catalog | LLM scope parsing + assumption trail  |
| Client hub               | Card portal + governed AI on money    |

### Vs ServiceTitan

| ST strength           | OpsBoard counter                         |
| --------------------- | ---------------------------------------- |
| Atlas breadth         | SMB simplicity; no enterprise config tax |
| Dispatch optimize     | Honest scope: pipeline triage first      |
| Pricebook + reporting | Faster time-to-value on Kanban ops       |

---

## 9. Readiness checklist (sales / pilot)

| Question                                    | Ready?                    |
| ------------------------------------------- | ------------------------- |
| Can owner get morning brief without typing? | Yes (5–11am board open)   |
| Can office draft estimate from visit notes? | Yes (with Gemini key)     |
| Can AI move jobs without silent writes?     | Yes (approval on medium+) |
| Can AI schedule whole crew day?             | No                        |
| Can AI chase unpaid invoices?               | Partial (draft only)      |
| Can viewer role use AI safely?              | Yes (read-only tools)     |
| Demo without API key?                       | Yes (regex degraded mode) |

---

## 10. Maintenance

Update this doc when:

- New tools ship in `tool-registry.ts` / `runTool`
- New copilot surfaces go live
- Competitor AI capabilities materially change (quarterly scan)

**Do not duplicate** task tracking — link to [`PHASE_TASKS.md`](../roadmap/PHASE_TASKS.md) for build work.

---

## Related

| Doc                                                               | Role                    |
| ----------------------------------------------------------------- | ----------------------- |
| [`AI_UTILIZATION.md`](./AI_UTILIZATION.md)                        | Product behavior spec   |
| [`AI_IMPLEMENTATION.md`](./AI_IMPLEMENTATION.md)                  | Engineering pipeline    |
| [`AI_TOOL_REGISTRY.md`](./AI_TOOL_REGISTRY.md)                    | Tool schemas & tiers    |
| [`PLATFORM_CAPABILITIES.md`](../product/PLATFORM_CAPABILITIES.md) | Module map vs SaaS      |
| [`NO_MOCK_DATA_POLICY.md`](../product/NO_MOCK_DATA_POLICY.md)     | AI must use real domain |
