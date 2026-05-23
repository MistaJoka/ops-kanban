import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { createCustomer } from '@/lib/domain/customers/createCustomer';
import { listCustomers } from '@/lib/domain/customers/listCustomers';

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const customers = await listCustomers(context.client, context.organizationId);
  return jsonData(customers);
}

export async function POST(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const customer = await createCustomer(context.client, {
      organizationId: context.organizationId,
      actorId: context.userId,
      role: context.role,
      ...parsed.data,
    });
    return jsonData(customer, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create customer.';
    const status = message.includes('cannot create') ? 403 : 400;
    return jsonError(message, status, status === 403 ? 'FORBIDDEN' : 'VALIDATION_ERROR');
  }
}
