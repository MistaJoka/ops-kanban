import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { runDueContracts } from '@/lib/domain/contracts/runDueContracts';

export async function POST(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const cronSecret = process.env.CRON_SECRET;
      const authHeader = req.headers.get('authorization');
      const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

      if (!isCron && !canManageMoney(context.role)) {
        return jsonError('Your role cannot run contract jobs.', 403, 'FORBIDDEN');
      }

      const result = await runDueContracts(context.client, context.organizationId, context.userId);
      return jsonData(result);
    },
    { route: '/api/contracts/run-due' },
  );
}
