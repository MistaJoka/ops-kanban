import { jsonData } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';

export async function GET(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const includeArchived = new URL(req.url).searchParams.get('includeArchived') === 'true';
      const board = await getPrimaryBoard(context.client, context.organizationId, includeArchived);
      return jsonData(board);
    },
    { route: '/api/board' },
  );
}
