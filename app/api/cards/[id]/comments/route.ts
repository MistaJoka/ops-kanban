import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
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
