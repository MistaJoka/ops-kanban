import { z } from 'zod';

import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { ReorderCardError, reorderCard } from '@/lib/domain/cards/reorderCard';
import { jsonData, jsonError } from '@/lib/api/response';

const reorderSchema = z.object({
  targetColumnId: z.string().uuid().optional(),
  insertIndex: z.number().int().min(0),
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

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const card = await reorderCard(context.client, {
      organizationId: context.organizationId,
      cardId: id,
      targetColumnId: parsed.data.targetColumnId,
      insertIndex: parsed.data.insertIndex,
      actorId: context.userId,
      role: context.role,
      reason: parsed.data.reason,
    });

    return jsonData(card);
  } catch (error) {
    if (error instanceof ReorderCardError) {
      const status =
        error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 400;
      return jsonError(error.message, status, error.code);
    }

    const message = error instanceof Error ? error.message : 'Failed to reorder card.';
    return jsonError(message, 500);
  }
}
