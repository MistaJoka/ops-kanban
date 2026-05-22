import { jsonData, jsonError } from '@/lib/api/response';
import { createPortalPaymentLink } from '@/lib/domain/integrations/payments';
import { verifyPortalToken } from '@/lib/domain/integrations/portalTokens';
import { createServiceClient } from '@/lib/db/supabase/service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const service = createServiceClient();
  const portal = await verifyPortalToken(service, token);

  if (!portal) {
    return jsonError('Invalid or expired portal link.', 404, 'NOT_FOUND');
  }

  if (!portal.scopes.includes('pay')) {
    return jsonError('This link cannot create payment links.', 403, 'FORBIDDEN');
  }

  const origin = new URL(request.url).origin;

  try {
    const payment = await createPortalPaymentLink(service, {
      organizationId: portal.organizationId,
      cardId: portal.cardId,
      origin,
    });

    return jsonData(payment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payment link.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}
