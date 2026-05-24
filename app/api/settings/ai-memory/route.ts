import { jsonData, jsonError } from '@/lib/api/response';
import { getOrgAiMemory, setOrgAiMemory } from '@/lib/domain/ai/memories';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const brandVoice = await getOrgAiMemory(context.client, context.organizationId, 'brand_voice');

  return jsonData({ brandVoice: brandVoice ?? '' });
}

export async function PATCH(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (context.role !== 'owner' && context.role !== 'manager') {
    return jsonError('Only owners and managers can update AI memory.', 403, 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const brandVoice =
    body && typeof body === 'object' && 'brandVoice' in body
      ? String((body as { brandVoice: unknown }).brandVoice ?? '')
      : '';

  await setOrgAiMemory(context.client, context.organizationId, 'brand_voice', brandVoice);

  return jsonData({ brandVoice: brandVoice.trim() });
}
