import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { createCardComment, listCardComments } from '@/lib/domain/comments/cardComments';

const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment is required'),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    _request,
    async (context) => {
      const { id } = await params;
      const comments = await listCardComments(context.client, context.organizationId, id);
      return jsonData(comments);
    },
    { route: '/api/cards/[id]/comments' },
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      const { id } = await params;

      const parsed = await parseJsonBody(req, commentSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      const comment = await createCardComment(context.client, {
        organizationId: context.organizationId,
        cardId: id,
        authorId: context.userId,
        role: context.role,
        body: parsed.data.body,
      });

      return jsonData(comment, 201);
    },
    { route: '/api/cards/[id]/comments' },
  );
}
