import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { withIdempotency } from '@/lib/api/withIdempotency';
import { MoveCardError, moveCard } from '@/lib/domain/cards/moveCard';

const moveSchema = z.object({
  targetColumnId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      const { id } = await params;

      const parsed = await parseJsonBody(req, moveSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      try {
        return await withIdempotency(req, context, async () => {
          const card = await moveCard(context.client, {
            organizationId: context.organizationId,
            cardId: id,
            targetColumnId: parsed.data.targetColumnId,
            actorId: context.userId,
            role: context.role,
            reason: parsed.data.reason,
          });

          return { data: card, cardId: card.id };
        });
      } catch (error) {
        if (error instanceof MoveCardError) {
          const status =
            error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 400;
          return jsonError(error.message, status, error.code);
        }
        throw error;
      }
    },
    { route: '/api/cards/[id]/move' },
  );
}
