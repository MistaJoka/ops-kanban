import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { withIdempotency } from '@/lib/api/withIdempotency';
import { createCard } from '@/lib/domain/cards/createCard';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';

const createCardSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  columnId: z.string().uuid().optional(),
  description: z.string().optional(),
  jobType: z
    .enum(['maintenance', 'install', 'hardscape', 'cleanup', 'irrigation', 'other'])
    .optional(),
});

export async function POST(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const parsed = await parseJsonBody(req, createCardSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      return withIdempotency(req, context, async () => {
        const board = await getPrimaryBoard(context.client, context.organizationId);
        const inquiryColumn =
          board.columns.find((column) => column.stateKey === 'inquiry') ?? board.columns[0];

        if (!inquiryColumn) {
          throw Object.assign(new Error('No columns configured.'), { code: 'VALIDATION_ERROR' });
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

        return { data: card, status: 201, cardId: card.id };
      });
    },
    { route: '/api/cards' },
  );
}
