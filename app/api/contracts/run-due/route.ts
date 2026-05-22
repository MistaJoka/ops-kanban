import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { runDueContracts } from '@/lib/domain/contracts/runDueContracts';

export async function POST(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron && !canManageMoney(context.role)) {
    return jsonError('Your role cannot run contract jobs.', 403, 'FORBIDDEN');
  }

  try {
    const result = await runDueContracts(context.client, context.organizationId, context.userId);
    return jsonData(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run due contracts.';
    return jsonError(message, 500);
  }
}
