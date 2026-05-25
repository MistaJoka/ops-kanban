import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { getToolCall, markToolCallRejected } from '@/lib/domain/ai/persistToolCall';

const bodySchema = z.object({
  toolCallId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

export async function POST(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const parsed = await parseJsonBody(req, bodySchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      const toolCall = await getToolCall(
        context.client,
        context.organizationId,
        parsed.data.toolCallId,
      );
      if (!toolCall) {
        return jsonError('Tool call not found.', 404, 'NOT_FOUND');
      }

      if (toolCall.status !== 'pending') {
        return jsonError('Tool call is not pending.', 400, 'VALIDATION_ERROR');
      }

      await markToolCallRejected(context.client, parsed.data.toolCallId, context.organizationId);

      return jsonData({ status: 'rejected', toolCallId: parsed.data.toolCallId });
    },
    { route: '/api/ai/reject' },
  );
}
