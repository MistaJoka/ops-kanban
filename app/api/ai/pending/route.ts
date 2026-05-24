import { jsonData } from '@/lib/api/response';
import { listPendingApprovals } from '@/lib/domain/ai/persistToolCall';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const items = await listPendingApprovals(context.client, context.organizationId);

  return jsonData({
    count: items.length,
    items,
  });
}
