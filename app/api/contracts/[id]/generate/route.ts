import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { generateContractCard } from '@/lib/domain/contracts/contracts';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    _request,
    async (context) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot generate contract jobs.', 403, 'FORBIDDEN');
      }

      const { id } = await params;

      try {
        const result = await generateContractCard(
          context.client,
          context.organizationId,
          id,
          context.userId,
        );
        return jsonData(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate job.';
        return jsonError(message, 400, 'VALIDATION_ERROR');
      }
    },
    { route: '/api/contracts/[id]/generate' },
  );
}
