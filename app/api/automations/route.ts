import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute, withApiRouteNoRequest } from '@/lib/api/withApiRoute';
import { createAutomation, listAutomations } from '@/lib/domain/automations/crud';
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
  return withApiRouteNoRequest(async (context) => {
    const automations = await listAutomations(context.client, context.organizationId);
    return jsonData(automations);
  }, { route: '/api/automations' });
}

export async function POST(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot manage automations.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, createSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      if (parsed.data.triggerType === 'column_enter' && !parsed.data.triggerStateKey?.trim()) {
        return jsonError('Column automations require triggerStateKey.', 400, 'VALIDATION_ERROR');
      }

      const automation = await createAutomation(context.client, {
        organizationId: context.organizationId,
        name: parsed.data.name,
        triggerType: parsed.data.triggerType,
        triggerStateKey: parsed.data.triggerStateKey ?? null,
        actionType: parsed.data.actionType,
        actionConfig: parsed.data.actionConfig,
      });
      return jsonData(automation);
    },
    { route: '/api/automations' },
  );
}
