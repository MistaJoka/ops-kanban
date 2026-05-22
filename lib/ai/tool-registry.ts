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
      lineItems: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
      })),
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
    name: 'assignCard',
    description: 'Assign a crew lead or worker to a card.',
    schema: z.object({
      cardId: z.string().uuid(),
      assigneeId: z.string().uuid(),
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
];

export function getToolDefinition(name: string) {
  return toolRegistry.find((tool) => tool.name === name);
}
