import { jsonData, jsonError } from '@/lib/api/response';
import { parseAiCommandBody } from '@/lib/ai/command-schema';
import { handleAiCommand, handleAiCommandStream } from '@/lib/ai/command-handler';
import type { AiContext } from '@/lib/ai/context-loader';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { formatSseEvent } from '@/lib/ai/sse';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';

export async function POST(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const rateKey = `${context.organizationId}:${context.userId ?? 'anon'}`;
  const rate = await checkRateLimit(rateKey, context.client, context.userId);
  if (!rate.allowed) {
    return jsonError('Too many AI requests. Try again shortly.', 429, 'RATE_LIMITED');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = parseAiCommandBody(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  if (parsed.data.context.organizationId !== context.organizationId) {
    return jsonError('Organization mismatch.', 403, 'FORBIDDEN');
  }

  if (parsed.data.context.role !== context.role) {
    return jsonError('Role mismatch.', 403, 'FORBIDDEN');
  }

  const handlerParams = {
    client: context.client,
    command: parsed.data.command,
    context: parsed.data.context as AiContext,
    organizationId: context.organizationId,
    userId: context.userId,
    role: context.role,
    conversationHistory: parsed.data.conversationHistory,
  };

  if (parsed.data.stream) {
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
  }

  try {
    const result = await handleAiCommand(handlerParams);

    if (result.status === 'message') {
      return jsonData({ status: 'message', message: result.message });
    }

    return jsonData(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI command failed.';
    const status = message.includes('cannot use') ? 403 : 400;
    return jsonError(message, status, status === 403 ? 'FORBIDDEN' : 'VALIDATION_ERROR');
  }
}
