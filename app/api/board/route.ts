import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { jsonData, jsonError } from '@/lib/api/response';

export async function GET(request: Request) {
  const context = await getHandlerContext();

  if (!isHandlerContext(context)) {
    return context;
  }

  const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true';

  try {
    const board = await getPrimaryBoard(context.client, context.organizationId, includeArchived);
    return jsonData(board);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load board.';
    return jsonError(message, 500);
  }
}
