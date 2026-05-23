# AI Tool Registry

Every tool: name, Zod schema, risk level, roles, executor, activity log.  
Utilization guide: `AI_UTILIZATION.md`.

## MVP — Tier 1 (read-only, low risk)

| Tool | Description | Roles |
|------|-------------|-------|
| `summarizeCard` | Job recap + recommended next step | all |
| `getBoardState` | Columns, counts, visible card summaries | all |
| `getOverdueCards` | `due_date` past, not archived | all |
| `getStalledCards` | Days in column &gt; threshold | owner, manager, worker |
| `getPipelineMetrics` | Count/revenue by column or group | owner, manager |
| `suggestNextAction` | Propose `next_action` text | owner, manager, worker |

## MVP — Tier 2 (write, medium risk)

| Tool | Description | Roles |
|------|-------------|-------|
| `createCard` | New property job | owner, manager, worker |
| `updateCard` | Fields: title, dates, priority, next_action, revenue | owner, manager, worker* |
| `moveCard` | Change column / `state_key` | owner, manager, worker* |
| `assignCard` | Set `assigned_to` | owner, manager |
| `createQuoteDraft` | Line items on card | owner, manager |
| `updateCustomer` | Property/customer fields | owner, manager |
| `createInternalNote` | Comment on card | owner, manager, worker |

*Worker: assigned or unassigned cards per policy.

## MVP — Tier 3 (high risk)

| Tool | Description | Roles |
|------|-------------|-------|
| `markInvoicePaid` | Close balance | owner, manager |
| `archiveCard` | Set `archived_at`, move to archived | owner, manager |

## Wave 1–4 (external — all high risk to send/charge)

| Tool | Wave | Provider |
|------|------|----------|
| `createPaymentLink` | 1 | Stripe / PayPal |
| `sendEstimateEmail` | 1 | Resend |
| `sendSms` / `sendEmail` | 2 | Twilio / Resend |
| `createBookingFromWebhook` | 2 | Native booking page |

AI may **draft** comms and **propose** links; execution requires approval + webhook confirmation.

## Post-MVP (internal)

### Board

`searchCards`, `bulkUpdateCards` (high)

### Customer

`createCustomer`, `searchCustomers`, `linkCustomerToCard`, `summarizeCustomerHistory`

### Quote / invoice

`updateQuoteLineItems`, `approveQuote`, `exportQuotePdf`, `createInvoiceDraft`, `sendInvoice`

### Calendar

`createScheduleEvent`, `rescheduleEvent`, `findScheduleConflicts`, `getAvailableSlots`

### Communication

`draftEmail`, `draftSms` (draft = low; send = high)

### Reporting

`getRevenueSummary`, `getWorkloadSummary`, `getUnpaidInvoices`

### Automate

`updateAutomationRule` (high)

---

## Implemented in starter (`tool-registry.ts`)

**Tier 1 read:** `summarizeCard`, `getBoardState`, `getOverdueCards`, `getStalledCards`, `getPipelineMetrics`, `suggestNextAction`, `getDailyBrief`, `searchCards`, `getCalendarSchedule`, `findScheduleConflicts`, `getUnpaidInvoices`, `getRevenueSummary`, `summarizeCustomerHistory`, `searchCustomers`, `searchMembers`

**Tier 2 write:** `createCard`, `moveCard`, `assignCard`, `updateCard`, `createQuoteDraft`, `updateCustomer`, `createInternalNote`, `createInvoiceDraft`, `rescheduleEvent`, `createCustomer`, `draftSms`, `draftEmail`

**Tier 3 high:** `markInvoicePaid`, `archiveCard`, `createPaymentLink`, `sendSms`, `sendEmail`

Wire remaining post-MVP tools (`bulkUpdateCards`, `sendInvoice`, etc.) as domain services land.

---

## Tool output format

```ts
export type ToolResult = {
  success: boolean;
  message: string;
  data?: unknown;
  activityLog?: {
    entityType: string;
    entityId: string;
    action: string;
    summary: string;
  };
};
```

## Tool design rules

- One primary side effect per approval card
- Validated with Zod before approval UI
- Logged to `ai_tool_calls` + `activities`
- AI never calls Supabase directly — executor only
