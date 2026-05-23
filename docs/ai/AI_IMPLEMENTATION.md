# AI Implementation

> **How to use AI in the product:** `AI_UTILIZATION.md`  
> **Example prompts:** `AI_PROMPT_LIBRARY.md`  
> **Tool list:** `AI_TOOL_REGISTRY.md`  
> **Elite market comparison:** `AI_COMPETITIVE_BENCHMARK.md`

## MVP surfaces

- Job Pipeline — bottom AI dock (`page: 'board'`)
- Card detail — right rail copilot (`page: 'card'`)
- Approval queue — bell / modal for medium & high risk

Dashboard, customers, calendar, reports: post-MVP (same copilot, richer context).

## Identity

Operational Copilot for landscaping: command, analysis, drafting, and **tool-gated** actions.

## Model

Gemini 2.5 Flash — `GEMINI_API_KEY`, pin model id in `gemini-client.ts`.

**Routing:** `runGeminiAgent` uses native function calling (primary). Regex `intent-router` + template tools are degraded fallback when `GEMINI_API_KEY` is unset.

## Context object

```ts
export type AiContext = {
  page: 'board' | 'card' | 'dashboard' | 'customer' | 'calendar' | 'reports' | 'settings';
  organizationId: string;
  userId: string;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  selectedCardId?: string;
  selectedCustomerId?: string;
  visibleColumnIds?: string[];
  pipelineMode?: 'compact' | 'full';
  filters?: Record<string, unknown>;
};
```

Loader must return small packages — see `AI_UTILIZATION.md` §4.

## Modes

| Mode     | Purpose                      |
| -------- | ---------------------------- |
| Ask      | Answer from context          |
| Analyze  | Rank problems, daily brief   |
| Act      | Tools that mutate data       |
| Draft    | Estimates, notes, checklists |
| Automate | Post-MVP suggestions         |

## Execution pipeline

```txt
POST /api/ai/command
→ loadAiContext (Supabase)
→ runGeminiAgent (function calling) | routeCommand fallback
→ tool selection + Zod parse + card disambiguation
→ classifyToolRisk
→ execute | approval_required (human preview)
→ activities + ai_tool_calls
→ JSON response (default) or SSE stream (`stream: true`)
→ UI refresh
```

### SSE streaming

Set `"stream": true` on the command body to receive `text/event-stream` instead of JSON.

| Event    | Payload                                                                                 |
| -------- | --------------------------------------------------------------------------------------- |
| `status` | `{ phase: 'context' \| 'thinking' \| 'tool' \| 'executing' \| 'polishing', toolName? }` |
| `delta`  | `{ text: string }` — token/chunk from Gemini or polished tool output                    |
| `result` | `{ data: CommandResult }` — same shape as JSON response                                 |
| `error`  | `{ message, code? }`                                                                    |

Client helper: `lib/ai/ai-command-client.ts` (`submitAiCommand`). `AiDock` streams by default.

**Hard rule:** AI never writes directly to the database.

## Risk

| Level  | Behavior                   |
| ------ | -------------------------- |
| low    | Auto-run                   |
| medium | Preview + approve          |
| high   | Preview + explicit confirm |

See `risk-classifier.ts`.

## MVP build list

1. Context loader (board + card)
2. Tier 1 read-only tools
3. Dock UI + mode chips + `AI_PROMPT_LIBRARY` chips
4. Tier 2 + approval modal
5. Inline card summary + estimate draft CTA
6. Tier 3 money/archive
7. Rate limits + audit review
