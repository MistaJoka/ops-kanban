import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { createMessageTemplate, listMessageTemplates } from '@/lib/domain/comms/messageTemplates';

const createSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['sms', 'email']),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const channel = new URL(req.url).searchParams.get('channel');
      const parsedChannel = channel === 'sms' || channel === 'email' ? channel : undefined;

      const templates = await listMessageTemplates(
        context.client,
        context.organizationId,
        parsedChannel,
      );
      return jsonData(templates);
    },
    { route: '/api/message-templates' },
  );
}

export async function POST(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot manage templates.', 403, 'FORBIDDEN');
      }

      const parsed = await parseJsonBody(req, createSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      try {
        const template = await createMessageTemplate(
          context.client,
          context.organizationId,
          parsed.data,
        );
        return jsonData(template);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create template.';
        return jsonError(message, 400, 'VALIDATION_ERROR');
      }
    },
    { route: '/api/message-templates' },
  );
}
