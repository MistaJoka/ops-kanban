import type { LoadedAiContext } from '@/lib/ai/context-loader';

function formatStateKey(stateKey: string): string {
  return stateKey.replace(/_/g, ' ');
}

export function buildApprovalPreview(params: {
  toolName: string;
  input: Record<string, unknown>;
  loadedContext: LoadedAiContext;
}): { summary: string; details: string[] } {
  const { toolName, input, loadedContext } = params;

  const cardTitle =
    loadedContext.page === 'card'
      ? String(loadedContext.card.title)
      : typeof input.title === 'string'
        ? input.title
        : 'Selected job';

  switch (toolName) {
    case 'createCard':
      return {
        summary: `Create job “${String(input.title)}” in ${formatStateKey(String(input.columnStateKey ?? 'inquiry'))}`,
        details: [
          input.description ? `Description: ${String(input.description)}` : '',
          input.revenueValue ? `Revenue: $${Number(input.revenueValue).toFixed(2)}` : '',
          input.nextAction ? `Next action: ${String(input.nextAction)}` : '',
        ].filter(Boolean),
      };

    case 'moveCard':
      return {
        summary: `Move “${cardTitle}” to ${formatStateKey(String(input.columnStateKey ?? 'unknown'))}`,
        details: input.reason ? [`Reason: ${String(input.reason)}`] : [],
      };

    case 'updateCard':
      return {
        summary: `Update “${cardTitle}”`,
        details: [
          input.nextAction ? `Next action → ${String(input.nextAction)}` : '',
          input.dueDate ? `Due date → ${String(input.dueDate)}` : '',
          input.scheduledStart ? `Scheduled start → ${String(input.scheduledStart)}` : '',
          input.priority ? `Priority → ${String(input.priority)}` : '',
          input.revenueValue !== undefined ? `Revenue → $${Number(input.revenueValue).toFixed(2)}` : '',
        ].filter(Boolean),
      };

    case 'assignCard':
      return {
        summary: `Assign crew to “${cardTitle}”`,
        details: [
          input.assigneeName
            ? `Assignee → ${String(input.assigneeName)}`
            : `Assignee ID → ${String(input.assigneeId)}`,
        ],
      };

    case 'createQuoteDraft': {
      const items = Array.isArray(input.lineItems) ? input.lineItems : [];
      const total = items.reduce(
        (sum, item) => sum + Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0),
        0,
      );
      return {
        summary: `Save estimate draft for “${cardTitle}” ($${total.toFixed(2)})`,
        details: items.map(
          (item) =>
            `• ${String(item.description)} — ${Number(item.quantity)} × $${Number(item.unitPrice).toFixed(2)}`,
        ),
      };
    }

    case 'createInvoiceDraft':
      return {
        summary: `Create invoice draft for “${cardTitle}”`,
        details: ['Uses the saved estimate total.'],
      };

    case 'createPaymentLink':
      return {
        summary: `Create payment link for “${cardTitle}”`,
        details: ['Stripe payment link will be generated for the invoice balance.'],
      };

    case 'createCustomer':
      return {
        summary: `Create customer “${String(input.name)}”`,
        details: [
          input.phone ? `Phone: ${String(input.phone)}` : '',
          input.address ? `Address: ${String(input.address)}` : '',
        ].filter(Boolean),
      };

    case 'rescheduleEvent':
      return {
        summary: `Reschedule “${cardTitle}”`,
        details: [
          input.scheduledStart
            ? `Start → ${new Date(String(input.scheduledStart)).toLocaleString()}`
            : '',
          input.scheduledEnd ? `End → ${String(input.scheduledEnd)}` : '',
        ].filter(Boolean),
      };

    case 'markInvoicePaid':
      return {
        summary: `Mark invoice paid for “${cardTitle}”`,
        details: [
          `Method: ${String(input.method ?? 'manual')}`,
          'This closes the balance and may archive the job.',
        ],
      };

    case 'archiveCard':
      return {
        summary: `Archive job “${cardTitle}”`,
        details: input.reason ? [`Reason: ${String(input.reason)}`] : ['Job will move to Archived.'],
      };

    case 'deleteCard':
      return {
        summary: `Permanently delete “${cardTitle}”`,
        details: [
          'This removes the job from the board and cannot be undone here.',
          input.reason ? `Reason: ${String(input.reason)}` : '',
        ].filter(Boolean),
      };

    case 'sendSms':
      return {
        summary: `Send SMS for “${cardTitle}”`,
        details: input.body ? [String(input.body).slice(0, 160)] : ['Uses default template'],
      };

    case 'sendEmail':
      return {
        summary: `Send email for “${cardTitle}”`,
        details: [
          input.subject ? `Subject: ${String(input.subject)}` : '',
          input.body ? String(input.body).slice(0, 200) : 'Uses default template',
        ].filter(Boolean),
      };

    default:
      return {
        summary: `${toolName} awaiting approval`,
        details: Object.entries(input).map(([key, value]) => `${key}: ${JSON.stringify(value)}`),
      };
  }
}
