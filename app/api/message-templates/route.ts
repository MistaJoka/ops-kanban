import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { createMessageTemplate, listMessageTemplates } from '@/lib/domain/comms/messageTemplates';

const createSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['sms', 'email']),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const channel = new URL(request.url).searchParams.get('channel');
  const parsedChannel =
    channel === 'sms' || channel === 'email' ? channel : undefined;

  try {
    const templates = await listMessageTemplates(
      context.client,
      context.organizationId,
      parsedChannel,
    );
    return jsonData(templates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load templates.';
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot manage templates.', 403, 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const template = await createMessageTemplate(context.client, context.organizationId, parsed.data);
    return jsonData(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create template.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}
