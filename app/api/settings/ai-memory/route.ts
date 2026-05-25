import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute, withApiRouteNoRequest } from '@/lib/api/withApiRoute';
import { getOrgAiMemory, setOrgAiMemory } from '@/lib/domain/ai/memories';

const patchSchema = z.object({
  brandVoice: z.coerce.string().default(''),
});

export async function GET() {
  return withApiRouteNoRequest(async (context) => {
    const brandVoice = await getOrgAiMemory(context.client, context.organizationId, 'brand_voice');
    return jsonData({ brandVoice: brandVoice ?? '' });
  }, { route: '/api/settings/ai-memory' });
}

export async function PATCH(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (context.role !== 'owner' && context.role !== 'manager') {
        return jsonError('Only owners and managers can update AI memory.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, patchSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      const brandVoice = parsed.data.brandVoice;
      await setOrgAiMemory(context.client, context.organizationId, 'brand_voice', brandVoice);

      return jsonData({ brandVoice: brandVoice.trim() });
    },
    { route: '/api/settings/ai-memory' },
  );
}
