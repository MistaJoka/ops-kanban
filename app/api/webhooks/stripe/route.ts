import { jsonData, jsonError } from '@/lib/api/response';
import { stripePaymentAdapter } from '@/lib/integrations/stripe/adapter';
import { processPaymentWebhook } from '@/lib/domain/integrations/processPaymentWebhook';
import { createServiceClient } from '@/lib/db/supabase/service';

export async function POST(request: Request) {
  const verified = await stripePaymentAdapter.verifyWebhook(request);
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
}
