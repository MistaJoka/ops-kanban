import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';

import type { OrgRole } from '@/lib/domain/auth/roles';
import { getToolDefinition } from '@/lib/ai/tool-registry';

const OBJECT = SchemaType.OBJECT;
const STRING = SchemaType.STRING;
const NUMBER = SchemaType.NUMBER;
const ARRAY = SchemaType.ARRAY;

const ALL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'summarizeCard',
    description: 'Summarize a job card and recommend the next operational step.',
    parameters: {
      type: OBJECT,
      properties: { cardId: { type: STRING, description: 'UUID of the job card' } },
      required: ['cardId'],
    },
  },
  {
    name: 'getBoardState',
    description: 'Show pipeline columns and job counts.',
    parameters: { type: OBJECT, properties: {} },
  },
  {
    name: 'getOverdueCards',
    description: 'List jobs past their due date.',
    parameters: {
      type: OBJECT,
      properties: { limit: { type: NUMBER, description: 'Max results (default 10)' } },
    },
  },
  {
    name: 'getStalledCards',
    description: 'List jobs stuck in a column longer than N days.',
    parameters: {
      type: OBJECT,
      properties: {
        minDays: { type: NUMBER, description: 'Minimum days in column (default 5)' },
        stateKey: { type: STRING, description: 'Optional pipeline state filter' },
      },
    },
  },
  {
    name: 'getPipelineMetrics',
    description: 'Count jobs and revenue by pipeline column.',
    parameters: { type: OBJECT, properties: {} },
  },
  {
    name: 'getDailyBrief',
    description: 'Morning operations briefing: today’s schedule, overdue, stalled, and top actions.',
    parameters: { type: OBJECT, properties: {} },
  },
  {
    name: 'searchCards',
    description: 'Find jobs by title, customer name, or address. Use before acting on an ambiguous job reference.',
    parameters: {
      type: OBJECT,
      properties: {
        query: { type: STRING, description: 'Search text such as customer name or street' },
        limit: { type: NUMBER, description: 'Max matches (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'suggestNextAction',
    description: 'Propose a next_action line for a job card.',
    parameters: {
      type: OBJECT,
      properties: { cardId: { type: STRING } },
      required: ['cardId'],
    },
  },
  {
    name: 'createCard',
    description: 'Create a new property job / inquiry on the board.',
    parameters: {
      type: OBJECT,
      properties: {
        title: { type: STRING },
        description: { type: STRING },
        columnStateKey: { type: STRING, description: 'Pipeline state such as inquiry, qualified, estimating' },
        revenueValue: { type: NUMBER },
        nextAction: { type: STRING },
      },
      required: ['title'],
    },
  },
  {
    name: 'updateCard',
    description: 'Update job fields: next action, dates, priority, revenue.',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        nextAction: { type: STRING },
        dueDate: { type: STRING },
        scheduledStart: { type: STRING },
        scheduledEnd: { type: STRING },
        priority: { type: STRING, description: 'low | medium | high | urgent' },
        revenueValue: { type: NUMBER },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'moveCard',
    description: 'Move a job to a different pipeline column/state.',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        columnStateKey: { type: STRING, description: 'Target state such as scheduled, complete, blocked' },
        reason: { type: STRING },
      },
      required: ['cardId', 'columnStateKey'],
    },
  },
  {
    name: 'assignCard',
    description: 'Assign a crew lead or worker to a job.',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        assigneeId: { type: STRING, description: 'UUID of team member' },
        assigneeName: { type: STRING, description: 'Name search when UUID unknown' },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'createQuoteDraft',
    description: 'Create or update an estimate draft with line items from scope notes.',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        scopeNotes: { type: STRING, description: 'Site visit or scope notes to parse into line items' },
        lineItems: {
          type: ARRAY,
          description: 'Optional pre-built line items if already structured',
          items: {
            type: OBJECT,
            properties: {
              description: { type: STRING },
              quantity: { type: NUMBER },
              unitPrice: { type: NUMBER },
            },
          },
        },
        notes: { type: STRING },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'createInternalNote',
    description: 'Add an internal comment on a job card.',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        body: { type: STRING },
      },
      required: ['cardId', 'body'],
    },
  },
  {
    name: 'markInvoicePaid',
    description: 'Mark the job invoice as paid (high risk — requires confirmation).',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        method: { type: STRING, description: 'Payment method such as cash, check, card' },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'archiveCard',
    description: 'Archive a completed or closed job (high risk).',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        reason: { type: STRING },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'deleteCard',
    description:
      'Permanently delete a job (high risk — requires approval). Use title when cardId is unknown.',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING, description: 'UUID when known' },
        title: { type: STRING, description: 'Job title to match when cardId is unknown' },
        query: { type: STRING, description: 'Search text for job title or customer' },
        reason: { type: STRING },
      },
    },
  },
  {
    name: 'draftSms',
    description: 'Draft SMS text for customer review (does not send).',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        intent: { type: STRING },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'draftEmail',
    description: 'Draft email text for customer review (does not send).',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        intent: { type: STRING },
      },
      required: ['cardId'],
    },
  },
  {
    name: 'createInvoiceDraft',
    description: 'Create an invoice draft from the job estimate.',
    parameters: {
      type: OBJECT,
      properties: { cardId: { type: STRING } },
      required: ['cardId'],
    },
  },
  {
    name: 'createPaymentLink',
    description: 'Create a Stripe payment link for the job invoice (high risk).',
    parameters: {
      type: OBJECT,
      properties: { cardId: { type: STRING } },
      required: ['cardId'],
    },
  },
  {
    name: 'searchMembers',
    description: 'Find team members by name.',
    parameters: {
      type: OBJECT,
      properties: {
        query: { type: STRING },
        limit: { type: NUMBER },
      },
      required: ['query'],
    },
  },
  {
    name: 'getCalendarSchedule',
    description: 'List scheduled jobs in the calendar range.',
    parameters: { type: OBJECT, properties: {} },
  },
  {
    name: 'findScheduleConflicts',
    description: 'Find overlapping scheduled jobs for a proposed time window.',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        scheduledStart: { type: STRING },
        scheduledEnd: { type: STRING },
      },
      required: ['scheduledStart'],
    },
  },
  {
    name: 'rescheduleEvent',
    description: 'Move a job to a new scheduled start/end.',
    parameters: {
      type: OBJECT,
      properties: {
        cardId: { type: STRING },
        scheduledStart: { type: STRING },
        scheduledEnd: { type: STRING },
      },
      required: ['cardId', 'scheduledStart'],
    },
  },
  {
    name: 'getUnpaidInvoices',
    description: 'List unpaid invoice balances.',
    parameters: {
      type: OBJECT,
      properties: {
        minBalance: { type: NUMBER },
        limit: { type: NUMBER },
      },
    },
  },
  {
    name: 'getRevenueSummary',
    description: 'Revenue, unpaid balance, and funnel snapshot.',
    parameters: { type: OBJECT, properties: {} },
  },
  {
    name: 'summarizeCustomerHistory',
    description: 'Summarize customer jobs and recent activity.',
    parameters: {
      type: OBJECT,
      properties: { customerId: { type: STRING } },
      required: ['customerId'],
    },
  },
  {
    name: 'searchCustomers',
    description: 'Search customers by name, phone, or address.',
    parameters: {
      type: OBJECT,
      properties: {
        query: { type: STRING },
        limit: { type: NUMBER },
      },
      required: ['query'],
    },
  },
  {
    name: 'createCustomer',
    description: 'Create a new customer.',
    parameters: {
      type: OBJECT,
      properties: {
        name: { type: STRING },
        phone: { type: STRING },
        email: { type: STRING },
        address: { type: STRING },
        notes: { type: STRING },
      },
      required: ['name'],
    },
  },
];

export function getGeminiDeclarationsForRole(role: OrgRole): FunctionDeclaration[] {
  return ALL_DECLARATIONS.filter((declaration) => {
    const tool = getToolDefinition(declaration.name ?? '');
    return tool?.requiredRoles.includes(role);
  });
}
