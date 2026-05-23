# AI utilization — landscaping ops copilot

How AI creates value in OpsBoard: **where it lives**, **what it should do**, **what it must not do**, and **how users should rely on it** day to day.

Technical wiring: `AI_IMPLEMENTATION.md`, `AI_TOOL_REGISTRY.md`, `AI_COMPETITIVE_BENCHMARK.md`, `src-starter/lib/ai/*`.

Product context: `VERTICAL_LANDSCAPING.md`, `CARD_DESIGN.md`, `WORKSPACE_DESIGN.md`.

---

## 1. North star

AI is an **operational copilot**, not a general chatbot.

| Do                                                 | Don't                                        |
| -------------------------------------------------- | -------------------------------------------- |
| Turn messy notes into structured job data          | Replace the board as source of truth         |
| Recommend the next best action on a job            | Auto-send invoices or texts without approval |
| Draft estimates from site-visit notes              | Invent customers, prices, or payments        |
| Answer “what should we do today?” from live data   | Load the entire database into the model      |
| Execute changes through **logged, approved tools** | Write to Postgres directly                   |

**Best utilization** = less time in spreadsheets and sticky notes, more time moving cards and crews—with AI handling synthesis, drafting, and ranking.

---

## 2. Where AI appears (surfaces)

### MVP (ship first)

| Surface            | Placement                              | Primary use                          |
| ------------------ | -------------------------------------- | ------------------------------------ |
| **Job Pipeline**   | Bottom AI dock (`WORKSPACE_DESIGN.md`) | Board-wide Ask + Analyze + Act       |
| **Card detail**    | Right rail copilot                     | Job-specific Draft + Act + summarize |
| **Approval queue** | Top bar bell / inline toast            | Confirm medium/high-risk tool calls  |

### Post-MVP (same copilot, richer context)

| Surface   | Use                                   |
| --------- | ------------------------------------- |
| Dashboard | Morning briefing, revenue snapshot    |
| Customers | History summary before a callback     |
| Calendar  | Conflict check, reschedule drafts     |
| Reports   | Explain bottlenecks in plain language |

### Inline AI (no chat required)

| Trigger                 | Behavior                                              |
| ----------------------- | ----------------------------------------------------- |
| Card Overview tab       | **AI summary** block (refreshed on open or on demand) |
| Empty `next_action`     | Suggest one line from column + dates + comments       |
| Move to `estimate_sent` | Offer “Draft estimate from scope notes”               |
| Move to `complete`      | Offer “Create invoice from estimate”                  |
| Board load (owner)      | Optional **daily brief** chip in AI dock (3 bullets)  |

Inline suggestions convert high-intent moments into AI usage without opening a blank chat.

---

## 3. Interaction modes

User selects mode in the AI dock (chip) or implies it via phrasing.

| Mode         | User intent              | MVP tools                                                  | Output style                |
| ------------ | ------------------------ | ---------------------------------------------------------- | --------------------------- |
| **Ask**      | Understand status        | `summarizeCard`, `getBoardState`, read-only queries        | Short prose, bullets        |
| **Analyze**  | Find problems / priority | `getOverdueCards`, `getStalledCards`, `getPipelineMetrics` | Ranked list + why           |
| **Act**      | Change the system        | `createCard`, `moveCard`, `updateCard`, `assignCard`       | Preview → approve → execute |
| **Draft**    | Prepare artifact         | `createQuoteDraft`, `createInternalNote`                   | Editable draft in tab       |
| **Automate** | Repeatable rules         | — (post-MVP)                                               | Suggestion only             |

**Default mode by page**

- Board dock → **Analyze** default in morning, **Ask** rest of day
- Card rail → **Draft** if estimating column, else **Ask**

---

## 4. Context strategy (keep prompts small)

Load only what the current command needs. Target **&lt; 8k tokens** context per request.

### Board context package

```ts
{
  page: 'board',
  pipelineMode: 'compact' | 'full',
  columns: [{ id, stateKey, name, cardCount }],
  visibleCards: [/* max 40: id, title, column, dueDate, scheduledStart, assignee, moneyBadge */],
  filters: { assignee, overdue, jobType },
  metrics: { overdueCount, scheduledToday, unpaidBalance },
  orgRules: { requireApprovalForMoneyActions, aiMaySendExternalMessages: false },
}
```

Do **not** send full descriptions or all line items for every card on the board.

### Card context package

```ts
{
  page: 'card',
  card: { id, title, column, stateKey, priority, nextAction, dates, revenue, jobType },
  customer: { name, phone, email, address, notes },
  quote: { status, lineItems[], total } | null,
  invoice: { status, balanceDue } | null,
  recentActivities: [/* last 15 */],
  recentComments: [/* last 5 */],
}
```

### Command routing

```txt
User command + page context
→ classify intent (ask | analyze | act | draft)
→ pick 0–1 primary tool (or answer from context only)
→ validate + permission + risk
→ execute | approval | clarifying question
```

If the user names a card (“Miller mulch job”), resolve by title search in visible/board scope before asking.

---

## 5. MVP tool set (build order)

### Tier 1 — read-only (low risk, auto-run)

| Tool                 | Landscaping value                  |
| -------------------- | ---------------------------------- |
| `summarizeCard`      | Job recap before a call            |
| `getBoardState`      | What’s on the board right now      |
| `getOverdueCards`    | Follow-ups and late visits         |
| `getStalledCards`    | Jobs stuck &gt; N days in a column |
| `getPipelineMetrics` | Count/$ by column group            |
| `suggestNextAction`  | One line for `next_action`         |

### Tier 2 — write (medium risk, preview + approve)

| Tool               | Landscaping value                    |
| ------------------ | ------------------------------------ |
| `createCard`       | “New inquiry: 88 Pine, weekly mow”   |
| `updateCard`       | Set next action, dates, priority     |
| `moveCard`         | “Move Rivera to Scheduled Thursday”  |
| `assignCard`       | Assign crew lead                     |
| `createQuoteDraft` | Line items from site notes           |
| `updateCustomer`   | Parse phone/address from pasted text |

### Tier 3 — money & close (high risk, explicit confirm)

| Tool                                    | MVP                         |
| --------------------------------------- | --------------------------- |
| `markInvoicePaid`                       | ✓ with approval             |
| `archiveCard`                           | ✓ with approval             |
| `sendInvoice` / `sendEmail` / `sendSms` | **Out of MVP** — draft only |

### Post-MVP tools

Calendar, bulk board updates, automation rules, customer history summary, PDF export — see `AI_TOOL_REGISTRY.md`.

---

## 6. Best utilization by role

### Owner / manager (office)

| Moment           | Example command                                      | Mode    |
| ---------------- | ---------------------------------------------------- | ------- |
| Start of day     | “What should we tackle first today?”                 | Analyze |
| Pipeline review  | “What’s stuck in estimating over 5 days?”            | Analyze |
| New lead call    | “Create inquiry for Chen, 220 Maple, spring cleanup” | Act     |
| After site visit | “Draft estimate from these notes: …”                 | Draft   |
| Closing books    | “Which jobs are complete but not invoiced?”          | Analyze |
| End of week      | “Summarize unpaid jobs over $500”                    | Ask     |

### Office staff

| Moment     | Command                                                         |
| ---------- | --------------------------------------------------------------- |
| Follow-up  | “Summarize estimate sent jobs with no activity 3+ days”         |
| Scheduling | “Move approved jobs without a date to Scheduling and flag them” |
| Data entry | Paste messy text → “Extract customer info and update this card” |

### Crew lead / worker (field)

| Moment      | Command                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| On site     | “Mark blocked: need gate code” → `updateCard` + `moveCard` to `blocked` |
| Quick read  | “What’s next on this job?” → `summarizeCard`                            |
| Limited Act | Only assigned cards; no archive, no mark paid                           |

### Viewer

Ask + Analyze only; no Act/Draft tools.

---

## 7. High-value landscaping scenarios

### A. Morning operations briefing (board)

**Trigger:** Owner opens pipeline before 8am, or taps “Daily brief” in AI dock.

**AI does (Analyze, read-only):**

1. Jobs scheduled today (crew + address)
2. Overdue `due_date` / stuck in `estimate_sent`
3. Complete but unpaid (invoice prep)
4. Top 3 recommended actions with card links

**No writes** unless user says “do it.”

---

### B. Site notes → estimate (card)

**Trigger:** Card in `estimating`; user pastes visit notes in Scope tab or AI dock.

**AI does (Draft → medium approval):**

1. Extract services (mow, mulch, haul-off)
2. Propose line items with qty/unit (mark assumptions)
3. `createQuoteDraft` → user reviews in Estimate tab → marks sent manually

**Best practice:** Show **assumptions** (“assuming 0.25 acre, no slope”) in preview.

---

### C. Stuck pipeline cleanup (board)

**Trigger:** “What’s blocking revenue this week?”

**AI does (Analyze):**

- Cards in `negotiation`, `blocked`, `payment_pending` with age and $
- Groups by money impact
- Suggests **one** `moveCard` or `updateCard` per priority item—not bulk without approval

---

### D. Natural language create (board)

**Trigger:** “Add weekly mow for Oak St rental, $85, start in inquiry”

**AI does (Act):**

- `createCard` + optional `createCustomer` / link
- Sets `job_type: maintenance`, `revenue_value: 85`
- Places in `inquiry` or `qualified` per phrasing

Preview card title: `Oak St rental — Weekly mow`.

---

### E. Card handoff before crew day (card)

**Trigger:** Card in `scheduled`; crew lead opens on phone.

**AI does (Ask):**

- Summary: address, gate notes, scope, materials checklist highlights
- Weather/blocker reminder from comments

Optional one-tap: “Set next action: Start job” → `updateCard` (low risk).

---

## 8. Approval and trust UX

```txt
AI proposes tool call
→ Approval card: tool name, human summary, diff preview
→ User: Approve | Edit | Reject
→ On approve: executeToolCall → activity + ai_tool_calls row
→ UI realtime refresh
```

| Risk   | UI                                           | Who can approve             |
| ------ | -------------------------------------------- | --------------------------- |
| Low    | Auto-execute; toast “AI updated next action” | —                           |
| Medium | Modal preview                                | Same role that can run tool |
| High   | Modal + checkbox “I confirm”                 | Owner/manager only          |

**Always show** in timeline: `AI moved card to Scheduled` with link to `ai_tool_calls` payload.

**Reject** teaches nothing to the model in MVP (no fine-tuning); log rejection reason optionally for product analytics.

---

## 9. Prompt UX (dock + card)

### Suggested chips (landscaping)

**Board**

- What should we do first today?
- Jobs scheduled today
- Stuck estimates
- Complete but not invoiced
- New inquiry from…

**Card**

- Summarize this job
- Draft estimate from scope notes
- Suggest next action
- What’s missing before we schedule?

### Composer placeholder

- Board: `Ask about today’s jobs, pipeline, or money…`
- Card: `Ask about this property job or draft an estimate…`

### Response format

- Lead with **answer** (2–4 sentences or bullets)
- Then **proposed action** if any (button: Preview / Apply)
- Never dump raw JSON to users; parse tool calls server-side

---

## 10. Model and API behavior

| Setting      | Value                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| Model        | Gemini 2.5 Flash                                                                   |
| Tool calling | Native function calling when wired; until then server parses structured JSON block |
| Temperature  | 0.2 for Act/Draft; 0.5 for Ask/Analyze                                             |
| Rate limit   | e.g. 30 commands / user / hour (Phase 7)                                           |

**System prompt additions** (see `system-prompt.ts`):

- Prefer one tool per turn unless user asks for a batch
- For money, always draft never send in MVP
- Use `state_key` names internally; display names in user text
- When unsure which card, ask once with up to 3 disambiguation options

---

## 11. What AI should not do (MVP)

- Send SMS, email, or invoice to customers
- Mark paid without approval
- Bulk-move entire columns
- Delete cards or customers
- Change pipeline columns or org settings
- Access other organizations’ data
- Store PII in `ai_memories` (table deferred)

---

## 12. Success metrics

| Signal                  | Good utilization                                            |
| ----------------------- | ----------------------------------------------------------- |
| Time to create inquiry  | &lt; 30s with voice/text command                            |
| Estimate draft time     | &gt; 50% reduction vs manual line entry                     |
| `next_action` fill rate | AI suggestions accepted &gt; 40%                            |
| Approval rate           | High-risk rejections &lt; 10% (means previews are accurate) |
| Daily brief opens       | Owners use 3+ mornings/week                                 |

---

## 13. Implementation sequence

1. Context loader (board + card packages)
2. Tier 1 read-only tools + summaries
3. AI dock UI with mode chips + suggested prompts
4. Tier 2 tools + approval modal
5. Inline triggers on card (summary, draft estimate CTA)
6. Tier 3 high-risk with strict confirm
7. Daily brief + stalled-card Analyze
8. Post-MVP: dashboard context, calendar tools, automate mode

---

## 14. Related docs

- Canned prompts: `AI_PROMPT_LIBRARY.md`
- Tool schemas: `AI_TOOL_REGISTRY.md`
- Risk classes: `src-starter/lib/ai/risk-classifier.ts`
