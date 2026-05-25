import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute, withApiRouteNoRequest } from '@/lib/api/withApiRoute';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { getOrganizationSettings } from '@/lib/domain/organization/getOrganizationSettings';
import { updateOrganizationSettings } from '@/lib/domain/organization/updateOrganizationSettings';

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  pipelineMode: z.enum(['compact', 'full']).optional(),
});

export async function GET() {
  return withApiRouteNoRequest(async (context) => {
    const settings = await getOrganizationSettings(context.client, context.organizationId);
    return jsonData({ ...settings, role: context.role });
  }, { route: '/api/settings/organization' });
}

export async function PATCH(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot change organization settings.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, patchSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      if (!parsed.data.name && !parsed.data.pipelineMode) {
        return jsonError('Provide name and/or pipelineMode to update.', 400, 'VALIDATION_ERROR');
      }

      const settings = await updateOrganizationSettings(context.client, context.organizationId, {
        name: parsed.data.name,
        pipelineMode: parsed.data.pipelineMode,
      });
      return jsonData({ ...settings, role: context.role });
    },
    { route: '/api/settings/organization' },
  );
}
