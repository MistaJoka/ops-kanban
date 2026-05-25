import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { createPortalToken } from '@/lib/domain/integrations/portalTokens';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      const { id } = await params;
      const origin = new URL(req.url).origin;

      try {
        const portal = await createPortalToken(context.client, {
          organizationId: context.organizationId,
          cardId: id,
          baseUrl: origin,
        });

        return jsonData(portal);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create portal link.';
        return jsonError(message, 500);
      }
    },
    { route: '/api/cards/[id]/portal-token' },
  );
}
