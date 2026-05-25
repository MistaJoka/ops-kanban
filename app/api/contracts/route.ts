import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute, withApiRouteNoRequest } from '@/lib/api/withApiRoute';
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
  return withApiRouteNoRequest(async (context) => {
    const contracts = await listContracts(context.client, context.organizationId);
    return jsonData(contracts);
  }, { route: '/api/contracts' });
}

export async function POST(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot manage contracts.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, createSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

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
    },
    { route: '/api/contracts' },
  );
}
