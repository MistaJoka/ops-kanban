import { parseSseBuffer, type AiStreamEvent } from '@/lib/ai/sse';

export type AiCommandResponse =
  | { status: 'message'; message: string }
  | {
      status: 'executed';
      message: string;
      toolName?: string;
      data?: unknown;
    }
  | {
      status: 'approval_required';
      message: string;
      toolCallId: string;
      toolName: string;
      preview: { summary: string; input: Record<string, unknown>; details?: string[] };
    };

export type AiCommandRequest = {
  command: string;
  context: Record<string, unknown>;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  stream?: boolean;
};

export type AiCommandStreamHandlers = {
  onStatus?: (phase: string, toolName?: string) => void;
  onDelta?: (text: string) => void;
};

export async function submitAiCommand(
  request: AiCommandRequest,
  handlers: AiCommandStreamHandlers = {},
): Promise<AiCommandResponse> {
  const res = await fetch('/api/ai/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, stream: request.stream ?? true }),
  });

  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('text/event-stream') && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: AiCommandResponse | null = null;
    let streamError: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.remainder;

      for (const event of parsed.events as AiStreamEvent[]) {
        if (event.type === 'status') {
          handlers.onStatus?.(event.phase, event.toolName);
        } else if (event.type === 'delta') {
          handlers.onDelta?.(event.text);
        } else if (event.type === 'result') {
          result = event.data as AiCommandResponse;
        } else if (event.type === 'error') {
          streamError = event.message;
        }
      }
    }

    if (streamError) {
      throw new Error(streamError);
    }

    if (!res.ok) {
      throw new Error(streamError ?? 'AI request failed.');
    }

    if (!result) {
      throw new Error('AI stream ended without a result.');
    }

    return result;
  }

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.error ?? 'AI request failed.');
  }

  return payload.data as AiCommandResponse;
}
