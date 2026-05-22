import { jsonData } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { getDashboardSummary } from '@/lib/domain/dashboard/getDashboardSummary';

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const summary = await getDashboardSummary(context.client, context.organizationId);
  return jsonData(summary);
}
