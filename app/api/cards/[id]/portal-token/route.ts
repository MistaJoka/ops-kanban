import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { createPortalToken } from '@/lib/domain/integrations/portalTokens';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const { id } = await params;
  const origin = new URL(request.url).origin;

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
}
