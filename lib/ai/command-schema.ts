import { z } from 'zod';

export const aiCommandContextSchema = z.object({
  page: z.enum(['board', 'card', 'dashboard', 'customer', 'calendar', 'reports', 'settings']),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['owner', 'manager', 'worker', 'viewer']),
  mode: z.enum(['ask', 'analyze', 'act', 'draft', 'automate']).optional(),
  selectedCardId: z.string().uuid().optional(),
  selectedCustomerId: z.string().uuid().optional(),
  visibleColumnIds: z.array(z.string().uuid()).optional(),
  pipelineMode: z.enum(['compact', 'full']).optional(),
});

export const aiCommandBodySchema = z.object({
  command: z.string().trim().min(1),
  context: aiCommandContextSchema,
});

export function parseAiCommandBody(body: unknown) {
  return aiCommandBodySchema.safeParse(body);
}
