import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { createChangeOrder, listChangeOrders } from '@/lib/domain/documents/changeOrders';

const bodySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const { id } = await params;

  try {
    const orders = await listChangeOrders(context.client, context.organizationId, id);
    return jsonData(orders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load change orders.';
    return jsonError(message, 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot create change orders.', 403, 'FORBIDDEN');
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? 'Invalid request.',
      400,
      'VALIDATION_ERROR',
    );
  }

  try {
    const order = await createChangeOrder(context.client, {
      organizationId: context.organizationId,
      parentCardId: id,
      actorId: context.userId,
      title: parsed.data.title,
      description: parsed.data.description,
    });

    return jsonData(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create change order.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}
