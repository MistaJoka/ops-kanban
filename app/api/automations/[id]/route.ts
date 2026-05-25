import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { deleteAutomation } from '@/lib/domain/automations/crud';
import { canManageMoney } from '@/lib/domain/auth/roles';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    _request,
    async (context) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot manage automations.', 403, 'FORBIDDEN');
      }

      const { id } = await params;
      await deleteAutomation(context.client, context.organizationId, id);
      return jsonData({ deleted: true });
    },
    { route: '/api/automations/[id]' },
  );
}
