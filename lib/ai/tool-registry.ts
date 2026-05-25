import { z } from 'zod';
import { classifyToolRisk, RiskLevel } from './risk-classifier';

export type ToolDefinition = {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
  riskLevel: RiskLevel;
  requiredRoles: Array<'owner' | 'manager' | 'worker' | 'viewer'>;
};

export const toolRegistry: ToolDefinition[] = [
  {
    name: 'createCard',
    description: 'Create a new operational card on the board.',
    schema: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      customerName: z.string().optional(),
      columnStateKey: z.string().optional(),
      columnId: z.string().uuid().optional(),
      revenueValue: z.number().optional(),
      nextAction: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('createCard'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'moveCard',
    description: 'Move a card to a different operational state/column.',
    schema: z
      .object({
        cardId: z.string().uuid(),
        targetColumnId: z.string().uuid().optional(),
        columnStateKey: z.string().optional(),
        reason: z.string().optional(),
      })
      .refine((value) => Boolean(value.targetColumnId || value.columnStateKey), {
        message: 'targetColumnId or columnStateKey is required',
      }),
    riskLevel: classifyToolRisk('moveCard'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'summarizeCard',
    description: 'Summarize the selected card and recommend the next action.',
    schema: z.object({
      cardId: z.string().uuid(),
    }),
    riskLevel: classifyToolRisk('summarizeCard'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'createQuoteDraft',
    description: 'Create a quote draft from card/job details.',
    schema: z.object({
      cardId: z.string().uuid(),
      scopeNotes: z.string().optional(),
      lineItems: z
        .array(
          z.object({
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
          }),
        )
        .optional(),
      notes: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('createQuoteDraft'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'getBoardState',
    description: 'Read pipeline columns and visible job summaries.',
    schema: z.object({}),
    riskLevel: classifyToolRisk('getBoardState'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'getOverdueCards',
    description: 'List jobs past due date or follow-up.',
    schema: z.object({ limit: z.number().optional() }),
    riskLevel: classifyToolRisk('getOverdueCards'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'getStalledCards',
    description: 'List jobs stuck in a column longer than N days.',
    schema: z.object({
      minDays: z.number().default(5),
      stateKey: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('getStalledCards'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'suggestNextAction',
    description: 'Propose a next_action line for a card.',
    schema: z.object({ cardId: z.string().uuid() }),
    riskLevel: classifyToolRisk('suggestNextAction'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'analyzeAttachment',
    description: 'Analyze a job photo for scope notes and estimate hints.',
    schema: z.object({
      cardId: z.string().uuid(),
      attachmentId: z.string().uuid(),
    }),
    riskLevel: classifyToolRisk('analyzeAttachment'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'getPipelineMetrics',
    description: 'Count jobs and revenue by pipeline column.',
    schema: z.object({}),
    riskLevel: classifyToolRisk('getPipelineMetrics'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'getDailyBrief',
    description: 'Morning briefing: schedule, overdue, stalled, top actions.',
    schema: z.object({}),
    riskLevel: classifyToolRisk('getDailyBrief'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'searchCards',
    description: 'Find jobs by title, customer, or address.',
    schema: z.object({
      query: z.string().min(1),
      limit: z.number().optional(),
    }),
    riskLevel: classifyToolRisk('searchCards'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'createInternalNote',
    description: 'Add an internal comment on a card.',
    schema: z.object({
      cardId: z.string().uuid(),
      body: z.string().min(1),
    }),
    riskLevel: classifyToolRisk('createInternalNote'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'updateCustomer',
    description: 'Update customer/property fields linked to a card.',
    schema: z.object({
      cardId: z.string().uuid(),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('updateCustomer'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'markInvoicePaid',
    description: 'Mark the card invoice as paid.',
    schema: z.object({
      cardId: z.string().uuid(),
      method: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('markInvoicePaid'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'archiveCard',
    description: 'Archive a completed or closed job.',
    schema: z.object({
      cardId: z.string().uuid(),
      reason: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('archiveCard'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'deleteCard',
    description: 'Permanently delete a job from the board. Match by title when cardId is unknown.',
    schema: z
      .object({
        cardId: z.string().uuid(),
        title: z.string().optional(),
        reason: z.string().optional(),
      })
      .refine((value) => Boolean(value.cardId), {
        message: 'cardId is required',
      }),
    riskLevel: classifyToolRisk('deleteCard'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'assignCard',
    description: 'Assign a crew lead or worker to a card.',
    schema: z
      .object({
        cardId: z.string().uuid(),
        assigneeId: z.string().uuid().optional(),
        assigneeName: z.string().optional(),
      })
      .refine((value) => Boolean(value.assigneeId || value.assigneeName), {
        message: 'assigneeId or assigneeName is required',
      }),
    riskLevel: classifyToolRisk('assignCard'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'updateCard',
    description: 'Update card fields such as next_action, dates, priority, revenue.',
    schema: z.object({
      cardId: z.string().uuid(),
      nextAction: z.string().optional(),
      dueDate: z.string().optional(),
      scheduledStart: z.string().optional(),
      scheduledEnd: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      revenueValue: z.number().optional(),
    }),
    riskLevel: classifyToolRisk('updateCard'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'sendSms',
    description: 'Send an SMS to the customer on this card (requires approval).',
    schema: z.object({
      cardId: z.string().uuid(),
      body: z.string().optional(),
      templateId: z.string().uuid().optional(),
    }),
    riskLevel: classifyToolRisk('sendSms'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'sendEmail',
    description: 'Send an email to the customer on this card (requires approval).',
    schema: z.object({
      cardId: z.string().uuid(),
      subject: z.string().optional(),
      body: z.string().optional(),
      templateId: z.string().uuid().optional(),
    }),
    riskLevel: classifyToolRisk('sendEmail'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'draftSms',
    description: 'Draft SMS text for the user to review (does not send).',
    schema: z.object({
      cardId: z.string().uuid(),
      intent: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('draftSms'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'draftEmail',
    description: 'Draft email text for the user to review (does not send).',
    schema: z.object({
      cardId: z.string().uuid(),
      intent: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('draftEmail'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'createInvoiceDraft',
    description: 'Create an invoice draft from the job estimate.',
    schema: z.object({
      cardId: z.string().uuid(),
    }),
    riskLevel: classifyToolRisk('createInvoiceDraft'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'createPaymentLink',
    description: 'Create a PayPal payment link for the job invoice.',
    schema: z.object({
      cardId: z.string().uuid(),
    }),
    riskLevel: classifyToolRisk('createPaymentLink'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'searchMembers',
    description: 'Find team members by name for assignment.',
    schema: z.object({
      query: z.string().min(1),
      limit: z.number().optional(),
    }),
    riskLevel: classifyToolRisk('searchMembers'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'getCalendarSchedule',
    description: 'List scheduled jobs in the current calendar range.',
    schema: z.object({}),
    riskLevel: classifyToolRisk('getCalendarSchedule'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'findScheduleConflicts',
    description: 'Check for overlapping scheduled jobs at a proposed time.',
    schema: z.object({
      cardId: z.string().uuid().optional(),
      scheduledStart: z.string(),
      scheduledEnd: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('findScheduleConflicts'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
  {
    name: 'rescheduleEvent',
    description: 'Reschedule a job to new start/end times.',
    schema: z.object({
      cardId: z.string().uuid(),
      scheduledStart: z.string(),
      scheduledEnd: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('rescheduleEvent'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'getUnpaidInvoices',
    description: 'List unpaid invoices and balances.',
    schema: z.object({
      minBalance: z.number().optional(),
      limit: z.number().optional(),
    }),
    riskLevel: classifyToolRisk('getUnpaidInvoices'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'getRevenueSummary',
    description: 'Summarize revenue, unpaid balance, and pipeline conversion.',
    schema: z.object({}),
    riskLevel: classifyToolRisk('getRevenueSummary'),
    requiredRoles: ['owner', 'manager'],
  },
  {
    name: 'summarizeCustomerHistory',
    description: 'Summarize a customer job history before a callback.',
    schema: z.object({
      customerId: z.string().uuid(),
    }),
    riskLevel: classifyToolRisk('summarizeCustomerHistory'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'searchCustomers',
    description: 'Find customers by name, phone, or address.',
    schema: z.object({
      query: z.string().min(1),
      limit: z.number().optional(),
    }),
    riskLevel: classifyToolRisk('searchCustomers'),
    requiredRoles: ['owner', 'manager', 'worker', 'viewer'],
  },
  {
    name: 'createCustomer',
    description: 'Create a new customer record.',
    schema: z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    }),
    riskLevel: classifyToolRisk('createCustomer'),
    requiredRoles: ['owner', 'manager', 'worker'],
  },
];

export function getToolDefinition(name: string) {
  return toolRegistry.find((tool) => tool.name === name);
}
