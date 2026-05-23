import { z } from 'zod';

import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { createCard } from '@/lib/domain/cards/createCard';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { jsonData, jsonError } from '@/lib/api/response';

const createCardSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  columnId: z.string().uuid().optional(),
  description: z.string().optional(),
  jobType: z
    .enum(['maintenance', 'install', 'hardscape', 'cleanup', 'irrigation', 'other'])
    .optional(),
});

export async function POST(request: Request) {
  const context = await getHandlerContext();

  if (!isHandlerContext(context)) {
    return context;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = createCardSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? 'Invalid request.',
      400,
      'VALIDATION_ERROR',
    );
  }

  try {
    const board = await getPrimaryBoard(context.client, context.organizationId);
    const inquiryColumn =
      board.columns.find((column) => column.stateKey === 'inquiry') ?? board.columns[0];

    if (!inquiryColumn) {
      return jsonError('No columns configured.', 400);
    }

    const card = await createCard(context.client, {
      organizationId: context.organizationId,
      boardId: board.id,
      columnId: parsed.data.columnId ?? inquiryColumn.id,
      title: parsed.data.title,
      description: parsed.data.description,
      jobType: parsed.data.jobType,
      actorId: context.userId,
      role: context.role,
    });

    return jsonData(card, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create card.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}
