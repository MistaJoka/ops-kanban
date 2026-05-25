import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { canEditCardCustomer } from '@/lib/domain/cards/authorizeCardMutation';
import { upsertCustomerForCard } from '@/lib/domain/customers/upsertCustomer';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      const { id } = await params;

      if (!canEditCardCustomer(context.role)) {
        return jsonError('Your role cannot edit customer records.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, customerSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      try {
        await upsertCustomerForCard(
          context.client,
          context.organizationId,
          id,
          context.userId,
          parsed.data,
        );

        const card = await getCardDetail(context.client, context.organizationId, id);
        if (!card) {
          return jsonError('Card not found.', 404, 'NOT_FOUND');
        }

        return jsonData(card);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save customer.';
        return jsonError(message, 400, 'VALIDATION_ERROR');
      }
    },
    { route: '/api/cards/[id]/customer' },
  );
}
