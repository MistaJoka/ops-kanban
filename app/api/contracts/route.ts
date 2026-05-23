import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { createContract, listContracts } from '@/lib/domain/contracts/contracts';

const createSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().min(1),
  jobType: z.string().optional().nullable(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'seasonal']),
  nextRunAt: z.string().datetime(),
  amount: z.number().nonnegative().optional().nullable(),
});

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const contracts = await listContracts(context.client, context.organizationId);
  return jsonData(contracts);
}

export async function POST(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot manage contracts.', 403, 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? 'Invalid request.',
      400,
      'VALIDATION_ERROR',
    );
  }

  try {
    const contract = await createContract(context.client, {
      organizationId: context.organizationId,
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      jobType: parsed.data.jobType ?? null,
      frequency: parsed.data.frequency,
      nextRunAt: parsed.data.nextRunAt,
      amount: parsed.data.amount ?? null,
      actorId: context.userId,
    });
    return jsonData(contract);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create contract.';
    return jsonError(message, 500);
  }
}
