import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { getToolCall, markToolCallRejected } from '@/lib/domain/ai/persistToolCall';

const bodySchema = z.object({
  toolCallId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  const toolCall = await getToolCall(context.client, context.organizationId, parsed.data.toolCallId);
  if (!toolCall) {
    return jsonError('Tool call not found.', 404, 'NOT_FOUND');
  }

  if (toolCall.status !== 'pending') {
    return jsonError('Tool call is not pending.', 400, 'VALIDATION_ERROR');
  }

  await markToolCallRejected(context.client, parsed.data.toolCallId, context.organizationId);

  return jsonData({ status: 'rejected', toolCallId: parsed.data.toolCallId });
}
