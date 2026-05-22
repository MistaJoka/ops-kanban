import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { listCardMessages } from '@/lib/domain/comms/messages';
import { sendCardEmail } from '@/lib/domain/comms/sendEmail';
import { CommsError, sendCardSms } from '@/lib/domain/comms/sendSms';

const sendSchema = z.object({
  channel: z.enum(['sms', 'email']),
  body: z.string().optional(),
  subject: z.string().optional(),
  toEmail: z.string().email().optional(),
  templateId: z.string().uuid().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const { id } = await params;

  try {
    const messages = await listCardMessages(context.client, context.organizationId, id);
    return jsonData(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load messages.';
    return jsonError(message, 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot send messages.', 403, 'FORBIDDEN');
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const message =
      parsed.data.channel === 'sms'
        ? await sendCardSms(context.client, {
            organizationId: context.organizationId,
            cardId: id,
            actorId: context.userId,
            body: parsed.data.body,
            templateId: parsed.data.templateId,
          })
        : await sendCardEmail(context.client, {
            organizationId: context.organizationId,
            cardId: id,
            actorId: context.userId,
            body: parsed.data.body,
            subject: parsed.data.subject,
            toEmail: parsed.data.toEmail,
            templateId: parsed.data.templateId,
          });

    return jsonData(message);
  } catch (error) {
    if (error instanceof CommsError) {
      const status =
        error.code === 'NOT_FOUND' ? 404 : error.code === 'SERVICE_UNAVAILABLE' ? 503 : 400;
      return jsonError(error.message, status, error.code);
    }

    const message = error instanceof Error ? error.message : 'Failed to send message.';
    return jsonError(message, 500);
  }
}
