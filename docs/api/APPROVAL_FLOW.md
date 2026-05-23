# AI approval flow

Medium- and high-risk AI tools require human approval before `executeToolCall` writes to the database.

Tables: `ai_tool_calls`, `ai_action_approvals`.

---

## Sequence

```txt
1. POST /api/ai/command
   → loadAiContext
   → Gemini proposes tool (name + args)
   → Zod validate + classifyToolRisk

2a. Low risk
   → executeToolCall immediately
   → insert ai_tool_calls (status: executed)
   → domain mutation + activities
   → return { status: 'executed', data }

2b. Medium / high risk
   → insert ai_tool_calls (status: pending, approval_status: pending)
   → insert ai_action_approvals (status: pending)
   → return { status: 'approval_required', toolCallId, preview }

3. UI shows ApprovalModal (diff preview)

4. User Approve → POST /api/ai/approve { toolCallId }
   → verify role + org + pending status
   → executeToolCall (server only, never client-side executor)
   → update ai_tool_calls (executed), ai_action_approvals (approved)
   → activity: ai.tool_executed

5. User Reject → POST /api/ai/reject
   → ai_tool_calls (rejected), no domain write
```

---

## High-risk extra step

For `markInvoicePaid`, `archiveCard` (future tools):

- Checkbox: “I confirm this action”
- Only `owner` and `manager`

---

## Preview payload (API → UI)

```ts
type ApprovalPreview = {
  toolCallId: string;
  toolName: string;
  riskLevel: 'medium' | 'high';
  summary: string; // human readable
  before?: unknown; // e.g. current column
  after?: unknown; // e.g. target column name
};
```

---

## Notifications

MVP: bell badge count of pending `ai_action_approvals` for org.

Post-MVP: `/notifications` page.

---

## Security

- Never accept raw tool execution from client without `toolCallId` audit row
- `toolCallId` must belong to user's org
- Reject expired pending calls (>24h optional policy)

---

## Tests

- `E2E-AI-002`, `AI-LOG-001`, `AI-LOG-002`, `INT-API-020`, `SEC-API-010`
