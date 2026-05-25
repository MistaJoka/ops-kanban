import { jsonData } from '@/lib/api/response';
import { withApiRouteNoRequest } from '@/lib/api/withApiRoute';
import { getDashboardSummary } from '@/lib/domain/dashboard/getDashboardSummary';

export async function GET() {
  return withApiRouteNoRequest(async (context) => {
    const summary = await getDashboardSummary(context.client, context.organizationId);
    return jsonData(summary);
  }, { route: '/api/dashboard/summary' });
}
