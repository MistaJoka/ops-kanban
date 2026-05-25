import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { setOrganizationPipelineMode } from '@/lib/domain/board/syncFullPipeline';

const bodySchema = z.object({
  pipelineMode: z.enum(['compact', 'full']),
});

export async function PATCH(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot change pipeline mode.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, bodySchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      const pipelineMode = await setOrganizationPipelineMode(
        context.client,
        context.organizationId,
        parsed.data.pipelineMode,
      );
      return jsonData({ pipelineMode });
    },
    { route: '/api/settings/pipeline-mode' },
  );
}
