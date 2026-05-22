import { jsonData, jsonError } from '@/lib/api/response';
import { processSmsWebhook } from '@/lib/domain/comms/processSmsWebhook';
import { twilioCommsAdapter } from '@/lib/integrations/twilio/adapter';
import { createServiceClient } from '@/lib/db/supabase/service';

export async function POST(request: Request) {
  const url = request.url;
  const verified = await twilioCommsAdapter.verifyWebhook(request, url);
  if (!verified) {
    return jsonError('Invalid webhook signature.', 401, 'UNAUTHORIZED');
  }

  const service = createServiceClient();

  try {
    const result = await processSmsWebhook(service, verified);
    return jsonData(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    return jsonError(message, 500);
  }
}
