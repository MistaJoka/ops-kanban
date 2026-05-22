import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { approveEstimateViaPortal, verifyPortalToken } from '@/lib/domain/integrations/portalTokens';
import { createServiceClient } from '@/lib/db/supabase/service';

const bodySchema = z.object({
  signerName: z.string().min(1),
});

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

  if (!portal.scopes.includes('approve')) {
    return jsonError('This link cannot approve estimates.', 403, 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Signer name is required.', 400, 'VALIDATION_ERROR');
  }

  const signerIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
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
}
