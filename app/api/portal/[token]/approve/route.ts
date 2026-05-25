import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withPublicRoute } from '@/lib/api/withApiRoute';
import {
  approveEstimateViaPortal,
  verifyPortalToken,
} from '@/lib/domain/integrations/portalTokens';
import { createServiceClient } from '@/lib/db/supabase/service';

const bodySchema = z.object({
  signerName: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return withPublicRoute(
    request,
    async (req) => {
      const service = createServiceClient();
      const portal = await verifyPortalToken(service, token);

      if (!portal) {
        return jsonError('Invalid or expired portal link.', 404, 'NOT_FOUND');
      }

      if (!portal.scopes.includes('approve')) {
        return jsonError('This link cannot approve estimates.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, bodySchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      const signerIp =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        null;

      try {
        const result = await approveEstimateViaPortal(service, {
          organizationId: portal.organizationId,
          cardId: portal.cardId,
          tokenId: portal.id,
          signerName: parsed.data.signerName.trim(),
          signerIp,
        });

        return jsonData({
          message: 'Estimate approved. Thank you!',
          total: result.total,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Approval failed.';
        return jsonError(message, 400, 'VALIDATION_ERROR');
      }
    },
    {
      route: '/api/portal/[token]/approve',
      rateLimit: { routeKey: 'portal-post', slug: token.slice(0, 8), limit: 5 },
    },
  );
}
