import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canCommentOnCard } from '@/lib/domain/cards/authorizeCardMutation';
import { createCardComment, listCardComments } from '@/lib/domain/comments/cardComments';

const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment is required'),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const { id } = await params;

  try {
    const comments = await listCardComments(context.client, context.organizationId, id);
    return jsonData(comments);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load comments.';
    return jsonError(message, 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const { data: cardRow } = await context.client
      .from('cards')
      .select('assigned_to')
      .eq('id', id)
      .eq('organization_id', context.organizationId)
      .maybeSingle();

    if (!cardRow) {
      return jsonError('Card not found.', 404, 'NOT_FOUND');
    }

    if (
      !canCommentOnCard(
        context.role,
        { assignedTo: (cardRow.assigned_to as string | null) ?? null },
        context.userId,
      )
    ) {
      return jsonError('Your role cannot comment on this job.', 403, 'FORBIDDEN');
    }

    const comment = await createCardComment(
      context.client,
      context.organizationId,
      id,
      context.userId,
      parsed.data.body,
    );

    return jsonData(comment, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add comment.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}
