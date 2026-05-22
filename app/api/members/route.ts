import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { listOrgMembers } from '@/lib/domain/organization/listMembers';

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  try {
    const members = await listOrgMembers(context.client, context.organizationId);
    return jsonData(members);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load members.';
    return jsonError(message, 500);
  }
}
