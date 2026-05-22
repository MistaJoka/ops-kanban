import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { listScheduledCards } from '@/lib/domain/scheduling/listScheduledCards';

export async function GET(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (!start || !end) {
    return jsonError('start and end query params are required.', 400, 'VALIDATION_ERROR');
  }

  try {
    const cards = await listScheduledCards(context.client, context.organizationId, { start, end });
    return jsonData(cards);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load calendar.';
    return jsonError(message, 500);
  }
}
