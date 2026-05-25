import { jsonData } from '@/lib/api/response';
import { withApiRouteNoRequest } from '@/lib/api/withApiRoute';
import { listPendingApprovals } from '@/lib/domain/ai/persistToolCall';

export async function GET() {
  return withApiRouteNoRequest(async (context) => {
    const items = await listPendingApprovals(context.client, context.organizationId);

    return jsonData({
      count: items.length,
      items,
    });
  }, { route: '/api/ai/pending' });
}
