import 'server-only';

import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import {
  getIntegrationStatus,
  upsertIntegrationAccount,
} from '@/lib/domain/integrations/integrationAccounts';
import { canManageMoney } from '@/lib/domain/auth/roles';

const patchSchema = z.object({
  stripe: z.enum(['active', 'disconnected']).optional(),
  twilio: z.enum(['active', 'disconnected']).optional(),
});

export async function GET(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const origin = new URL(req.url).origin;
      const status = await getIntegrationStatus(context.client, context.organizationId, origin);
      return jsonData(status);
    },
    { route: '/api/integrations' },
  );
}

export async function PATCH(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot manage integrations.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, patchSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      if (parsed.data.stripe) {
        await upsertIntegrationAccount(
          context.client,
          context.organizationId,
          'stripe',
          parsed.data.stripe,
        );
      }

      if (parsed.data.twilio) {
        await upsertIntegrationAccount(
          context.client,
          context.organizationId,
          'twilio',
          parsed.data.twilio,
        );
      }

      const origin = new URL(req.url).origin;
      const status = await getIntegrationStatus(context.client, context.organizationId, origin);
      return jsonData(status);
    },
    { route: '/api/integrations' },
  );
}
