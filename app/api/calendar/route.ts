import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { listScheduledCards } from '@/lib/domain/scheduling/listScheduledCards';

export async function GET(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const url = new URL(req.url);
      const start = url.searchParams.get('start');
      const end = url.searchParams.get('end');

      if (!start || !end) {
        return jsonError('start and end query params are required.', 400, 'VALIDATION_ERROR');
      }

      const cards = await listScheduledCards(context.client, context.organizationId, { start, end });
      return jsonData(cards);
    },
    { route: '/api/calendar' },
  );
}
