import { jsonData, jsonError } from '@/lib/api/response';
import { withPublicRoute } from '@/lib/api/withApiRoute';
import { DevResetError, resetDevBoard } from '@/lib/domain/dev/resetDevBoard';
import { ensureDevWorkspace } from '@/lib/domain/dev/workspace';
import { isAuthDisabled } from '@/lib/env/authBypass';

export async function POST(request: Request) {
  return withPublicRoute(
    request,
    async () => {
      if (!isAuthDisabled()) {
        return jsonError('Forbidden', 403, 'FORBIDDEN');
      }

      try {
        const dev = await ensureDevWorkspace();
        const result = await resetDevBoard(dev.client, dev.organizationId);
        return jsonData(result);
      } catch (error) {
        if (error instanceof DevResetError) {
          return jsonError(error.message, 403, 'DEV_RESET_FORBIDDEN');
        }

        const message = error instanceof Error ? error.message : 'Failed to reset dev board.';
        return jsonError(message, 500);
      }
    },
    { route: '/api/dev/reset-board' },
  );
}
