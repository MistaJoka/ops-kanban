import type { SupabaseClient } from '@supabase/supabase-js';

import type { AiContext } from '@/lib/ai/context-loader';
import { loadAiContext } from '@/lib/ai/context-loader';
import { getGeminiModel } from '@/lib/ai/gemini-client';
import { routeCommand, validateToolProposal } from '@/lib/ai/intent-router';
import { OPERATIONAL_COPILOT_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { executeToolCall } from '@/lib/ai/tool-executor';
import { getServerEnv } from '@/lib/env/server';

export type CommandResult =
  | { status: 'message'; message: string }
  | Awaited<ReturnType<typeof executeToolCall>>;

export function assertOrgScope(context: AiContext, organizationId: string) {
  if (context.organizationId !== organizationId) {
    throw new Error('Organization mismatch.');
  }
}

async function proposeWithGemini(command: string, loadedContext: unknown): Promise<string | null> {
  const { geminiApiKey } = getServerEnv();
  if (!geminiApiKey) {
    return null;
  }

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(`
${OPERATIONAL_COPILOT_SYSTEM_PROMPT}

Context:
${JSON.stringify(loadedContext)}

User command:
${command}

Reply in plain language. If no tool is needed, answer directly in 3 sentences or fewer.
`);
    return result.response.text();
  } catch {
    return null;
  }
}

export async function handleAiCommand(params: {
  client: SupabaseClient;
  command: string;
  context: AiContext;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
}): Promise<CommandResult> {
  assertOrgScope(params.context, params.organizationId);

  const loadedContext = await loadAiContext(params.client, {
    ...params.context,
    organizationId: params.organizationId,
    userId: params.userId ?? params.context.userId,
    role: params.role,
  });

  const routed = routeCommand(params.command, loadedContext);
  if (routed && 'message' in routed && !('toolName' in routed)) {
    return { status: 'message', message: routed.message };
  }

  if (routed && 'toolName' in routed) {
    const proposal = validateToolProposal(routed);
    return executeToolCall({
      toolName: proposal.toolName,
      input: proposal.input,
      context: {
        client: params.client,
        organizationId: params.organizationId,
        userId: params.userId,
        role: params.role,
        loadedContext,
      },
    });
  }

  const geminiMessage = await proposeWithGemini(params.command, loadedContext);
  if (geminiMessage) {
    return { status: 'message', message: geminiMessage };
  }

  return {
    status: 'message',
    message:
      'Try commands like "summarize this job", "show overdue jobs", "create job Rivera cleanup", or "move to scheduled".',
  };
}
