import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { createAutomation, listAutomations } from '@/lib/domain/automations/crud';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';

const createSchema = z.object({
  name: z.string().min(1),
  triggerType: z.enum(['column_enter', 'invoice_paid']),
  triggerStateKey: z.string().optional().nullable(),
  actionType: z.enum([
    'log_activity',
    'set_next_action',
    'send_sms_template',
    'send_review_request',
  ]),
  actionConfig: z.record(z.unknown()).default({}),
});

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const automations = await listAutomations(context.client, context.organizationId);
  return jsonData(automations);
}

export async function POST(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot manage automations.', 403, 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? 'Invalid request.',
      400,
      'VALIDATION_ERROR',
    );
  }

  if (parsed.data.triggerType === 'column_enter' && !parsed.data.triggerStateKey?.trim()) {
    return jsonError('Column automations require triggerStateKey.', 400, 'VALIDATION_ERROR');
  }

  try {
    const automation = await createAutomation(context.client, {
      organizationId: context.organizationId,
      name: parsed.data.name,
      triggerType: parsed.data.triggerType,
      triggerStateKey: parsed.data.triggerStateKey ?? null,
      actionType: parsed.data.actionType,
      actionConfig: parsed.data.actionConfig,
    });
    return jsonData(automation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create automation.';
    return jsonError(message, 500);
  }
}
