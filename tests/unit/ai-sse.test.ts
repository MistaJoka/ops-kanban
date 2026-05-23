import { describe, expect, it } from 'vitest';

import { formatSseEvent, parseSseBuffer } from '@/lib/ai/sse';

describe('AI SSE', () => {
  it('AI-SSE-001: formatSseEvent wraps JSON payload', () => {
    const frame = formatSseEvent({ type: 'delta', text: 'Hello' });
    expect(frame).toBe('data: {"type":"delta","text":"Hello"}\n\n');
  });

  it('AI-SSE-002: parseSseBuffer extracts multiple events', () => {
    const buffer = [
      formatSseEvent({ type: 'status', phase: 'thinking' }),
      formatSseEvent({ type: 'delta', text: 'Hi' }),
      formatSseEvent({
        type: 'result',
        data: { status: 'message', message: 'Hi' },
      }),
    ].join('');

    const parsed = parseSseBuffer(buffer);
    expect(parsed.events).toHaveLength(3);
    expect(parsed.remainder).toBe('');
    expect(parsed.events[1]).toEqual({ type: 'delta', text: 'Hi' });
  });

  it('AI-SSE-003: parseSseBuffer keeps partial frame in remainder', () => {
    const complete = formatSseEvent({ type: 'delta', text: 'A' });
    const partial = 'data: {"type":"delta","text":"B"}';
    const parsed = parseSseBuffer(`${complete}${partial}`);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.remainder).toBe(partial);
  });
});
