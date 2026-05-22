import { z } from 'zod';

import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { MoveCardError, moveCard } from '@/lib/domain/cards/moveCard';
import { jsonData, jsonError } from '@/lib/api/response';

const moveSchema = z.object({
  targetColumnId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();

  if (!isHandlerContext(context)) {
    return context;
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = moveSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const card = await moveCard(context.client, {
      organizationId: context.organizationId,
      cardId: id,
      targetColumnId: parsed.data.targetColumnId,
      actorId: context.userId,
      role: context.role,
      reason: parsed.data.reason,
    });

    return jsonData(card);
  } catch (error) {
    if (error instanceof MoveCardError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 400;
      return jsonError(error.message, status, error.code);
    }

    const message = error instanceof Error ? error.message : 'Failed to move card.';
    return jsonError(message, 500);
  }
}
