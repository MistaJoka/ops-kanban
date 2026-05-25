import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { sendEstimateEmail } from '@/lib/integrations/resend/sendEstimate';

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      const { id } = await params;
      const origin = new URL(req.url).origin;

      const parsed = await parseJsonBody(req, bodySchema);
      if (!parsed.ok) {
        return parsed.response;
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
    },
    { route: '/api/cards/[id]/quotes/send' },
  );
}
