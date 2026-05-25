import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { withIdempotency } from '@/lib/api/withIdempotency';
import { getCardDetail, updateCard, CardAuthorizationError } from '@/lib/domain/cards/cardDetail';
import { DeleteCardError, deleteCard } from '@/lib/domain/cards/deleteCard';
import { listCardActivities } from '@/lib/domain/activities/listCardActivities';
import { listCardComments } from '@/lib/domain/comments/cardComments';
import { getLatestPaymentForInvoice } from '@/lib/domain/integrations/payments';
import { getCardIntegrationSummary } from '@/lib/domain/integrations/cardIntegrationSummary';
import { getQuoteForCard } from '@/lib/domain/money/quotes';
import { getInvoiceForCard } from '@/lib/domain/money/invoices';

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  jobType: z
    .enum(['maintenance', 'install', 'hardscape', 'cleanup', 'irrigation', 'other'])
    .nullable()
    .optional(),
  nextAction: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  scheduledStart: z.string().nullable().optional(),
  scheduledEnd: z.string().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  checklist: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        done: z.boolean(),
      }),
    )
    .optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      const { id } = await params;
      const origin = new URL(req.url).origin;

      const [card, activities, comments, quote, invoice] = await Promise.all([
        getCardDetail(context.client, context.organizationId, id),
        listCardActivities(context.client, context.organizationId, id),
        listCardComments(context.client, context.organizationId, id),
        getQuoteForCard(context.client, context.organizationId, id),
        getInvoiceForCard(context.client, context.organizationId, id),
      ]);

      if (!card) {
        return jsonError('Card not found.', 404, 'NOT_FOUND');
      }

      const payment = invoice
        ? await getLatestPaymentForInvoice(context.client, context.organizationId, invoice.id)
        : null;

      const integrations = await getCardIntegrationSummary(
        context.client,
        context.organizationId,
        id,
        invoice,
        payment,
        origin,
      );

      return jsonData({ card, activities, comments, quote, invoice, payment, integrations });
    },
    { route: '/api/cards/[id]' },
  );
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    _request,
    async (context) => {
      const { id } = await params;

      try {
        await deleteCard(context.client, {
          organizationId: context.organizationId,
          cardId: id,
          actorId: context.userId,
          role: context.role,
        });

        return jsonData({ deleted: true });
      } catch (error) {
        if (error instanceof DeleteCardError) {
          const status = error.code === 'FORBIDDEN' ? 403 : error.code === 'NOT_FOUND' ? 404 : 400;
          return jsonError(error.message, status, error.code);
        }
        throw error;
      }
    },
    { route: '/api/cards/[id]' },
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      const { id } = await params;

      const parsed = await parseJsonBody(req, updateSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      try {
        return await withIdempotency(req, context, async () => {
          const card = await updateCard(context.client, {
            organizationId: context.organizationId,
            cardId: id,
            actorId: context.userId,
            role: context.role,
            patch: parsed.data,
          });

          return { data: card, cardId: card.id };
        });
      } catch (error) {
        if (error instanceof CardAuthorizationError) {
          const status = error.code === 'NOT_FOUND' ? 404 : 403;
          return jsonError(error.message, status, error.code);
        }
        throw error;
      }
    },
    { route: '/api/cards/[id]' },
  );
}
