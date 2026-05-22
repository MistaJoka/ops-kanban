import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { setOrganizationPipelineMode } from '@/lib/domain/board/syncFullPipeline';

const bodySchema = z.object({
  pipelineMode: z.enum(['compact', 'full']),
});

export async function PATCH(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot change pipeline mode.', 403, 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const pipelineMode = await setOrganizationPipelineMode(
      context.client,
      context.organizationId,
      parsed.data.pipelineMode,
    );
    return jsonData({ pipelineMode });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update pipeline mode.';
    return jsonError(message, 500);
  }
}
