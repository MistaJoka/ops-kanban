import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import type { AiContext } from '@/lib/ai/context-loader';
import { loadAiContext } from '@/lib/ai/context-loader';
import { executeApprovedToolCall } from '@/lib/ai/tool-executor';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { getToolCall } from '@/lib/domain/ai/persistToolCall';

const bodySchema = z.object({
  toolCallId: z.string().uuid(),
  context: z
    .object({
      page: z.enum(['board', 'card', 'dashboard', 'calendar', 'customer', 'reports', 'settings']),
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
      role: z.enum(['owner', 'manager', 'worker', 'viewer']),
      selectedCardId: z.string().uuid().optional(),
    })
    .optional(),
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

  if (toolCall.status !== 'pending' || toolCall.approvalStatus !== 'pending') {
    return jsonError('Tool call is not pending approval.', 400, 'VALIDATION_ERROR');
  }

  if (toolCall.toolName === 'createQuoteDraft' && !canManageMoney(context.role)) {
    return jsonError('Your role cannot approve money actions.', 403, 'FORBIDDEN');
  }

  if (
    (toolCall.toolName === 'markInvoicePaid' || toolCall.toolName === 'archiveCard') &&
    !canManageMoney(context.role)
  ) {
    return jsonError('Your role cannot approve high-risk actions.', 403, 'FORBIDDEN');
  }

  const aiContext: AiContext = parsed.data.context
    ? {
        ...parsed.data.context,
        organizationId: context.organizationId,
        userId: context.userId ?? parsed.data.context.userId,
        role: context.role,
      }
    : {
        page: 'board',
        organizationId: context.organizationId,
        userId: context.userId ?? '',
        role: context.role,
        selectedCardId:
          typeof toolCall.input.cardId === 'string' ? toolCall.input.cardId : undefined,
      };

  if (aiContext.organizationId !== context.organizationId) {
    return jsonError('Organization mismatch.', 403, 'FORBIDDEN');
  }

  try {
    const loadedContext = await loadAiContext(context.client, aiContext);
    const result = await executeApprovedToolCall({
      client: context.client,
      organizationId: context.organizationId,
      userId: context.userId,
      role: context.role,
      loadedContext,
      toolName: toolCall.toolName,
      input: toolCall.input,
      toolCallId: toolCall.id,
    });

    return jsonData(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Approval failed.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}
