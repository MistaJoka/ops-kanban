import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { loadAiContext } from '@/lib/ai/context-loader';
import { executeToolCall } from '@/lib/ai/tool-executor';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  return withApiRoute(
    _request,
    async (context) => {
      const { id: cardId, attachmentId } = await params;

      try {
        const loadedContext = await loadAiContext(context.client, {
          page: 'card',
          organizationId: context.organizationId,
          userId: context.userId ?? '',
          role: context.role,
          selectedCardId: cardId,
        });

        const result = await executeToolCall({
          toolName: 'analyzeAttachment',
          input: { cardId, attachmentId },
          context: {
            client: context.client,
            organizationId: context.organizationId,
            userId: context.userId,
            role: context.role,
            loadedContext,
          },
        });

        return jsonData(result);
      } catch (error) {
        return jsonError(
          error instanceof Error ? error.message : 'Vision analysis failed.',
          500,
          'AI_ERROR',
        );
      }
    },
    { route: '/api/cards/[id]/attachments/[attachmentId]/analyze' },
  );
}
