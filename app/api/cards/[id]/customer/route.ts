import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { upsertCustomerForCard } from '@/lib/domain/customers/upsertCustomer';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(
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

  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
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
}
