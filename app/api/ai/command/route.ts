import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { parseAiCommandBody } from '@/lib/ai/command-schema';
import { handleAiCommand, handleAiCommandStream } from '@/lib/ai/command-handler';
import type { AiContext } from '@/lib/ai/context-loader';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { formatSseEvent } from '@/lib/ai/sse';
import { getHandlerContext, isHandlerContext, type HandlerContext } from '@/lib/domain/api/handlerContext';
import { domainErrorToResponse } from '@/lib/domain/db/mapSupabaseError';
import { captureApiError } from '@/lib/ops/captureError';

async function validateAiCommandRequest(
  context: HandlerContext,
  request: Request,
): Promise<
  | { ok: true; handlerParams: Parameters<typeof handleAiCommand>[0] }
  | { ok: false; response: ReturnType<typeof jsonError> }
> {
  const rateKey = `${context.organizationId}:${context.userId ?? 'anon'}`;
  const rate = await checkRateLimit(rateKey, context.client, context.userId);
  if (!rate.allowed) {
    return {
      ok: false,
      response: jsonError('Too many AI requests. Try again shortly.', 429, 'RATE_LIMITED'),
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR') };
  }

  const parsed = parseAiCommandBody(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(
        parsed.error.issues[0]?.message ?? 'Invalid request.',
        400,
        'VALIDATION_ERROR',
      ),
    };
  }

  if (parsed.data.context.organizationId !== context.organizationId) {
    return { ok: false, response: jsonError('Organization mismatch.', 403, 'FORBIDDEN') };
  }

  if (parsed.data.context.role !== context.role) {
    return { ok: false, response: jsonError('Role mismatch.', 403, 'FORBIDDEN') };
  }

  return {
    ok: true,
    handlerParams: {
      client: context.client,
      command: parsed.data.command,
      context: parsed.data.context as AiContext,
      organizationId: context.organizationId,
      userId: context.userId,
      role: context.role,
      conversationHistory: parsed.data.conversationHistory,
    },
  };
}

export async function POST(request: Request) {
  let streamRequested = false;
  try {
    const peek = (await request.clone().json()) as { stream?: boolean };
    streamRequested = Boolean(peek?.stream);
  } catch {
    // Fall through to withApiRoute for proper validation errors.
  }

  if (streamRequested) {
    try {
      const context = await getHandlerContext();
      if (!isHandlerContext(context)) {
        return context;
      }

      const validated = await validateAiCommandRequest(context, request);
      if (!validated.ok) {
        return validated.response;
      }

      const { handlerParams } = validated;
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const emit = (event: Parameters<typeof formatSseEvent>[0]) => {
            controller.enqueue(encoder.encode(formatSseEvent(event)));
          };

          try {
            await handleAiCommandStream(handlerParams, emit);
          } catch {
            // Error event already emitted by handleAiCommandStream.
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    } catch (error) {
      captureApiError(error, { route: '/api/ai/command' });
      return domainErrorToResponse(error);
    }
  }

  return withApiRoute(
    request,
    async (context, req) => {
      const validated = await validateAiCommandRequest(context, req);
      if (!validated.ok) {
        return validated.response;
      }

      try {
        const result = await handleAiCommand(validated.handlerParams);

        if (result.status === 'message') {
          return jsonData({ status: 'message', message: result.message });
        }

        return jsonData(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'AI command failed.';
        const status = message.includes('cannot use') ? 403 : 400;
        return jsonError(message, status, status === 403 ? 'FORBIDDEN' : 'VALIDATION_ERROR');
      }
    },
    { route: '/api/ai/command' },
  );
}
