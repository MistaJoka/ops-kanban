import 'server-only';

import { FunctionCallingMode } from '@google/generative-ai';

import type {
  AiMode,
  BoardAiContext,
  CardAiContext,
  LoadedAiContext,
} from '@/lib/ai/context-loader';
import type { ConversationTurn } from '@/lib/ai/conversation';
import { getGeminiDeclarationsForRole } from '@/lib/ai/gemini-declarations';
import { getGeminiModel } from '@/lib/ai/gemini-client';
import type { ToolProposal } from '@/lib/ai/intent-router';
import { OPERATIONAL_COPILOT_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { getServerEnv } from '@/lib/env/server';

export type GeminiAgentResult =
  | { type: 'tool'; proposal: ToolProposal; assistantMessage?: string }
  | { type: 'message'; message: string }
  | { type: 'unavailable' };

const MODE_GUIDANCE: Record<AiMode, string> = {
  ask: 'Answer from context only. Prefer read-only tools when helpful.',
  analyze:
    'Rank problems by urgency and revenue. Use getDailyBrief, getOverdueCards, getStalledCards.',
  act: 'Select one write tool when the user wants to change data. Always resolve cardId first.',
  draft: 'Prepare estimates, notes, or comms drafts for human review.',
  automate: 'Suggest repeatable rules; do not execute automations directly.',
};

function buildModeInstruction(mode: AiMode | undefined): string {
  return MODE_GUIDANCE[mode ?? 'ask'];
}

function buildContents(
  command: string,
  history: ConversationTurn[],
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const turn of history) {
    contents.push({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.content }],
    });
  }

  contents.push({ role: 'user', parts: [{ text: command }] });
  return contents;
}

export function hasGeminiAgent(): boolean {
  try {
    const { geminiApiKey } = getServerEnv();
    return Boolean(geminiApiKey);
  } catch {
    return false;
  }
}

export async function runGeminiAgent(params: {
  command: string;
  loadedContext: LoadedAiContext;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  mode?: AiMode;
  history?: ConversationTurn[];
  onDelta?: (text: string) => void;
  orgMemoryPrompt?: string | null;
}): Promise<GeminiAgentResult> {
  if (!hasGeminiAgent()) {
    return { type: 'unavailable' };
  }

  try {
    const declarations = getGeminiDeclarationsForRole(params.role);
    const model = getGeminiModel();

    const memoryBlock = params.orgMemoryPrompt ? `\n\n${params.orgMemoryPrompt}` : '';

    const request = {
      systemInstruction: `${OPERATIONAL_COPILOT_SYSTEM_PROMPT}
${memoryBlock}

Current mode: ${params.mode ?? 'ask'}
${buildModeInstruction(params.mode)}

Page: ${params.loadedContext.page}
Respond with a tool call when the user wants data or an action. Otherwise answer in plain language (≤4 sentences).`,
      contents: buildContents(params.command, params.history ?? []),
      tools: [{ functionDeclarations: declarations }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO,
        },
      },
      generationConfig: {
        temperature: params.mode === 'act' || params.mode === 'draft' ? 0.2 : 0.4,
      },
    };

    if (params.onDelta) {
      const streamResult = await model.generateContentStream(request);
      let streamedText = '';

      for await (const chunk of streamResult.stream) {
        try {
          const chunkText = chunk.text();
          if (chunkText) {
            streamedText += chunkText;
            params.onDelta(chunkText);
          }
        } catch {
          // Chunk may be function-call metadata without text.
        }
      }

      const response = await streamResult.response;
      const functionCalls = response.functionCalls?.() ?? [];

      if (functionCalls.length > 0) {
        const call = functionCalls[0];
        const args = (call.args ?? {}) as Record<string, unknown>;

        if (params.loadedContext.page === 'card' && !args.cardId) {
          args.cardId = String(params.loadedContext.card.id);
        }

        return {
          type: 'tool',
          proposal: {
            toolName: call.name,
            input: args,
          },
          assistantMessage: response.text()?.trim() || streamedText.trim() || undefined,
        };
      }

      const text = response.text()?.trim() || streamedText.trim();
      if (text) {
        return { type: 'message', message: text };
      }

      return { type: 'unavailable' };
    }

    const result = await model.generateContent(request);

    const response = result.response;
    const functionCalls = response.functionCalls?.() ?? [];

    if (functionCalls.length > 0) {
      const call = functionCalls[0];
      const args = (call.args ?? {}) as Record<string, unknown>;

      if (params.loadedContext.page === 'card' && !args.cardId) {
        args.cardId = String(params.loadedContext.card.id);
      }

      return {
        type: 'tool',
        proposal: {
          toolName: call.name,
          input: args,
        },
        assistantMessage: response.text()?.trim() || undefined,
      };
    }

    const text = response.text()?.trim();
    if (text) {
      return { type: 'message', message: text };
    }

    return { type: 'unavailable' };
  } catch {
    return { type: 'unavailable' };
  }
}

export async function polishToolResult(params: {
  toolName: string;
  toolMessage: string;
  command: string;
  loadedContext: LoadedAiContext;
  onDelta?: (text: string) => void;
}): Promise<string | null> {
  if (!hasGeminiAgent()) {
    return null;
  }

  try {
    const model = getGeminiModel();
    const prompt = `User asked: ${params.command}

Tool ${params.toolName} returned:
${params.toolMessage}

Rewrite as a concise, actionable reply for a landscaping ops manager (2–4 sentences or bullets). Do not invent data.`;

    if (params.onDelta) {
      const streamResult = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      });

      let polished = '';
      for await (const chunk of streamResult.stream) {
        try {
          const chunkText = chunk.text();
          if (chunkText) {
            polished += chunkText;
            params.onDelta(chunkText);
          }
        } catch {
          // Ignore non-text chunks.
        }
      }

      const finalText = (await streamResult.response).text()?.trim() || polished.trim();
      return finalText || null;
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 },
    });

    return result.response.text()?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function summarizeCardWithGemini(
  detail: Record<string, unknown>,
  customer: Record<string, unknown> | null,
  activities: Array<{ action: string; summary: string }>,
): Promise<string | null> {
  if (!hasGeminiAgent()) {
    return null;
  }

  try {
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Summarize this landscaping job for a crew lead or office manager in 3–4 sentences.

Job: ${JSON.stringify(detail)}
Customer: ${JSON.stringify(customer)}
Recent activity: ${JSON.stringify(activities.slice(0, 5))}

Include: status, property/customer, next step, and any blockers.`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.3 },
    });

    return result.response.text()?.trim() ?? null;
  } catch {
    return null;
  }
}
