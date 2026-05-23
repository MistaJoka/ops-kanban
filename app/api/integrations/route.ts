import 'server-only';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import {
  getIntegrationStatus,
  upsertIntegrationAccount,
} from '@/lib/domain/integrations/integrationAccounts';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { z } from 'zod';

const patchSchema = z.object({
  stripe: z.enum(['active', 'disconnected']).optional(),
  twilio: z.enum(['active', 'disconnected']).optional(),
});

export async function GET(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const origin = new URL(request.url).origin;
  const status = await getIntegrationStatus(context.client, context.organizationId, origin);
  return jsonData(status);
}

export async function PATCH(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot manage integrations.', 403, 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? 'Invalid request.',
      400,
      'VALIDATION_ERROR',
    );
  }

  if (parsed.data.stripe) {
    await upsertIntegrationAccount(
      context.client,
      context.organizationId,
      'stripe',
      parsed.data.stripe,
    );
  }

  if (parsed.data.twilio) {
    await upsertIntegrationAccount(
      context.client,
      context.organizationId,
      'twilio',
      parsed.data.twilio,
    );
  }

  const origin = new URL(request.url).origin;
  const status = await getIntegrationStatus(context.client, context.organizationId, origin);
  return jsonData(status);
}
