import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { getOrganizationSettings } from '@/lib/domain/organization/getOrganizationSettings';
import { updateOrganizationSettings } from '@/lib/domain/organization/updateOrganizationSettings';

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  pipelineMode: z.enum(['compact', 'full']).optional(),
});

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  try {
    const settings = await getOrganizationSettings(context.client, context.organizationId);
    return jsonData({ ...settings, role: context.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load organization settings.';
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot change organization settings.', 403, 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  if (!parsed.data.name && !parsed.data.pipelineMode) {
    return jsonError('Provide name and/or pipelineMode to update.', 400, 'VALIDATION_ERROR');
  }

  try {
    const settings = await updateOrganizationSettings(context.client, context.organizationId, {
      name: parsed.data.name,
      pipelineMode: parsed.data.pipelineMode,
    });
    return jsonData({ ...settings, role: context.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update organization settings.';
    return jsonError(message, 500);
  }
}
