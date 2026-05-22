import { jsonData, jsonError } from '@/lib/api/response';
import { deleteAutomation } from '@/lib/domain/automations/crud';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot manage automations.', 403, 'FORBIDDEN');
  }

  const { id } = await params;

  try {
    await deleteAutomation(context.client, context.organizationId, id);
    return jsonData({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete automation.';
    return jsonError(message, 500);
  }
}
