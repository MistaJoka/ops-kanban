import { jsonData, jsonError } from '@/lib/api/response';
import { withWebhookRoute } from '@/lib/api/withApiRoute';
import { stripePaymentAdapter } from '@/lib/integrations/stripe/adapter';
import { processPaymentWebhook } from '@/lib/domain/integrations/processPaymentWebhook';
import { createServiceClient } from '@/lib/db/supabase/service';

export async function POST(request: Request) {
  return withWebhookRoute(
    request,
    async (req) => {
      const verified = await stripePaymentAdapter.verifyWebhook(req);
      if (!verified) {
        return jsonError('Invalid webhook signature.', 401, 'UNAUTHORIZED');
      }

      const service = createServiceClient();

      try {
        const result = await processPaymentWebhook(service, verified);
        return jsonData(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Webhook processing failed.';
        return jsonError(message, 500);
      }
    },
    { route: '/api/webhooks/stripe' },
  );
}
