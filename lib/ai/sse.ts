import type { CommandResult } from '@/lib/ai/command-handler';

export type AiStreamStatusPhase = 'context' | 'thinking' | 'tool' | 'executing' | 'polishing';

export type AiStreamEvent =
  | { type: 'status'; phase: AiStreamStatusPhase; toolName?: string }
  | { type: 'delta'; text: string }
  | { type: 'result'; data: CommandResult }
  | { type: 'error'; message: string; code?: string };

export type AiStreamEmitter = {
  emit: (event: AiStreamEvent) => void;
};

export function formatSseEvent(event: AiStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function parseSseBuffer(buffer: string): { events: AiStreamEvent[]; remainder: string } {
  const events: AiStreamEvent[] = [];
  const parts = buffer.split('\n\n');
  const remainder = parts.pop() ?? '';

  for (const part of parts) {
    const line = part
      .split('\n')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith('data:'));

    if (!line) continue;

    const payload = line.slice(5).trim();
    if (!payload) continue;

    try {
      events.push(JSON.parse(payload) as AiStreamEvent);
    } catch {
      // Skip malformed frames.
    }
  }

  return { events, remainder };
}
