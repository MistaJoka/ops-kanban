import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { sendEstimateEmail } from '@/lib/integrations/resend/sendEstimate';

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const { id } = await params;
  const origin = new URL(request.url).origin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? 'Invalid request.',
      400,
      'VALIDATION_ERROR',
    );
  }

  try {
    const result = await sendEstimateEmail(context.client, {
      organizationId: context.organizationId,
      cardId: id,
      actorId: context.userId,
      toEmail: parsed.data.email,
      baseUrl: origin,
    });

    return jsonData(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send estimate.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}
