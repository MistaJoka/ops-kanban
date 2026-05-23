import type { SupabaseClient } from '@supabase/supabase-js';

import type { AiContext } from '@/lib/ai/context-loader';
import { loadAiContext } from '@/lib/ai/context-loader';
import { resolveCardProposalInput } from '@/lib/ai/card-resolver';
import type { ConversationTurn } from '@/lib/ai/conversation';
import { hasGeminiAgent, polishToolResult, runGeminiAgent } from '@/lib/ai/gemini-agent';
import { routeCommand, validateToolProposal, type ToolProposal } from '@/lib/ai/intent-router';
import { executeToolCall } from '@/lib/ai/tool-executor';
import { getToolDefinition } from '@/lib/ai/tool-registry';
import { requiresApproval } from '@/lib/ai/risk-classifier';
import type { AiStreamEmitter } from '@/lib/ai/sse';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';

type EmitFn = AiStreamEmitter['emit'];

export type CommandResult =
  | { status: 'message'; message: string }
  | Awaited<ReturnType<typeof executeToolCall>>;

export function assertOrgScope(context: AiContext, organizationId: string) {
  if (context.organizationId !== organizationId) {
    throw new Error('Organization mismatch.');
  }
}

async function enrichQuoteDraftInput(
  proposal: ToolProposal,
  loadedContext: Awaited<ReturnType<typeof loadAiContext>>,
): Promise<ToolProposal> {
  if (proposal.toolName !== 'createQuoteDraft') {
    return proposal;
  }

  const input = { ...proposal.input };

  if (!input.scopeNotes && loadedContext.page === 'card' && loadedContext.card.description) {
    input.scopeNotes = String(loadedContext.card.description);
  }

  if (!input.lineItems && !input.scopeNotes && loadedContext.page === 'card') {
    input.scopeNotes = String(loadedContext.card.description ?? loadedContext.card.title);
  }

  return { ...proposal, input };
}

async function resolveCardReference(
  client: SupabaseClient,
  organizationId: string,
  command: string,
  proposal: ToolProposal,
  loadedContext: Awaited<ReturnType<typeof loadAiContext>>,
): Promise<ToolProposal | { message: string }> {
  const board = await getPrimaryBoard(client, organizationId, true);
  return resolveCardProposalInput(proposal, command, loadedContext, board.cards);
}

async function executeProposal(params: {
  client: SupabaseClient;
  proposal: ToolProposal;
  command: string;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  loadedContext: Awaited<ReturnType<typeof loadAiContext>>;
  emit?: EmitFn;
}): Promise<CommandResult> {
  params.emit?.({ type: 'status', phase: 'tool', toolName: params.proposal.toolName });
  params.emit?.({ type: 'status', phase: 'executing', toolName: params.proposal.toolName });

  const proposal = validateToolProposal(
    await enrichQuoteDraftInput(params.proposal, params.loadedContext),
  );

  const result = await executeToolCall({
    toolName: proposal.toolName,
    input: proposal.input,
    context: {
      client: params.client,
      organizationId: params.organizationId,
      userId: params.userId,
      role: params.role,
      loadedContext: params.loadedContext,
    },
  });

  const tool = getToolDefinition(proposal.toolName);
  if (
    result.status === 'executed' &&
    tool &&
    !requiresApproval(tool.riskLevel) &&
    hasGeminiAgent()
  ) {
    params.emit?.({ type: 'status', phase: 'polishing', toolName: proposal.toolName });
    const polished = await polishToolResult({
      toolName: proposal.toolName,
      toolMessage: result.message,
      command: params.command,
      loadedContext: params.loadedContext,
      onDelta: params.emit ? (text) => params.emit?.({ type: 'delta', text }) : undefined,
    });

    if (polished) {
      return { ...result, message: polished };
    }
  }

  if (result.status === 'executed' && params.emit && result.message) {
    params.emit({ type: 'delta', text: result.message });
  }

  return result;
}

function emitMessage(emit: EmitFn | undefined, message: string): CommandResult {
  if (emit && message) {
    emit({ type: 'delta', text: message });
  }
  return { status: 'message', message };
}

async function processAiCommand(params: {
  client: SupabaseClient;
  command: string;
  context: AiContext;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  conversationHistory?: ConversationTurn[];
  emit?: EmitFn;
}): Promise<CommandResult> {
  assertOrgScope(params.context, params.organizationId);

  params.emit?.({ type: 'status', phase: 'context' });
  const loadedContext = await loadAiContext(params.client, {
    ...params.context,
    organizationId: params.organizationId,
    userId: params.userId ?? params.context.userId,
    role: params.role,
  });

  params.emit?.({ type: 'status', phase: 'thinking' });
  const agentResult = await runGeminiAgent({
    command: params.command,
    loadedContext,
    role: params.role,
    mode: params.context.mode,
    history: params.conversationHistory,
    onDelta: params.emit ? (text) => params.emit?.({ type: 'delta', text }) : undefined,
  });

  if (agentResult.type === 'tool') {
    const resolved = await resolveCardReference(
      params.client,
      params.organizationId,
      params.command,
      agentResult.proposal,
      loadedContext,
    );

    if ('message' in resolved && !('toolName' in resolved)) {
      return emitMessage(params.emit, resolved.message);
    }

    const executed = await executeProposal({
      client: params.client,
      proposal: resolved as ToolProposal,
      command: params.command,
      organizationId: params.organizationId,
      userId: params.userId,
      role: params.role,
      loadedContext,
      emit: params.emit,
    });

    if (
      executed.status === 'approval_required' &&
      agentResult.assistantMessage
    ) {
      return { ...executed, message: agentResult.assistantMessage };
    }

    return executed;
  }

  if (agentResult.type === 'message') {
    return { status: 'message', message: agentResult.message };
  }

  const routed = routeCommand(params.command, loadedContext);
  if (routed && 'message' in routed && !('toolName' in routed)) {
    return emitMessage(params.emit, routed.message);
  }

  if (routed && 'toolName' in routed) {
    const resolved = await resolveCardReference(
      params.client,
      params.organizationId,
      params.command,
      routed,
      loadedContext,
    );

    if ('message' in resolved && !('toolName' in resolved)) {
      return emitMessage(params.emit, resolved.message);
    }

    return executeProposal({
      client: params.client,
      proposal: resolved as ToolProposal,
      command: params.command,
      organizationId: params.organizationId,
      userId: params.userId,
      role: params.role,
      loadedContext,
      emit: params.emit,
    });
  }

  return emitMessage(
    params.emit,
    'Try “What should we tackle first today?”, “Show overdue jobs”, “Create job Oak St weekly mow”, or “Draft estimate from scope notes”.',
  );
}

export async function handleAiCommand(params: {
  client: SupabaseClient;
  command: string;
  context: AiContext;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  conversationHistory?: ConversationTurn[];
}): Promise<CommandResult> {
  return processAiCommand(params);
}

export async function handleAiCommandStream(
  params: {
    client: SupabaseClient;
    command: string;
    context: AiContext;
    organizationId: string;
    userId: string | null;
    role: 'owner' | 'manager' | 'worker' | 'viewer';
    conversationHistory?: ConversationTurn[];
  },
  emit: EmitFn,
): Promise<void> {
  try {
    const result = await processAiCommand({ ...params, emit });
    emit({ type: 'result', data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI command failed.';
    const code = message.includes('cannot use') ? 'FORBIDDEN' : 'VALIDATION_ERROR';
    emit({ type: 'error', message, code });
    throw error;
  }
}
