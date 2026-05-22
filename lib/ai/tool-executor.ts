import type { SupabaseClient } from '@supabase/supabase-js';

import type { BoardAiContext, CardAiContext } from '@/lib/ai/context-loader';
import { getToolDefinition } from '@/lib/ai/tool-registry';
import { requiresApproval } from '@/lib/ai/risk-classifier';
import {
  insertApprovalRequest,
  insertToolCall,
  markApprovalGranted,
  markToolCallExecuted,
} from '@/lib/domain/ai/persistToolCall';
import { logAiToolExecuted, runTool } from '@/lib/domain/ai/toolCalls';

export type ToolExecutionContext = {
  client: SupabaseClient;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  loadedContext: BoardAiContext | CardAiContext;
};

export type ToolExecutionResult =
  | {
      status: 'executed';
      toolName: string;
      message: string;
      data?: unknown;
      toolCallId: string;
    }
  | {
      status: 'approval_required';
      toolName: string;
      riskLevel: 'medium' | 'high';
      toolCallId: string;
      preview: {
        summary: string;
        input: Record<string, unknown>;
      };
      message: string;
    };

export async function executeToolCall(params: {
  toolName: string;
  input: unknown;
  context: ToolExecutionContext;
  skipApproval?: boolean;
}): Promise<ToolExecutionResult> {
  const tool = getToolDefinition(params.toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${params.toolName}`);
  }

  if (!tool.requiredRoles.includes(params.context.role)) {
    throw new Error(`Role ${params.context.role} cannot use ${params.toolName}.`);
  }

  const parsedInput = tool.schema.parse(params.input) as Record<string, unknown>;
  const cardId =
    typeof parsedInput.cardId === 'string'
      ? parsedInput.cardId
      : params.context.loadedContext.page === 'card'
        ? String(params.context.loadedContext.card.id)
        : null;

  if (requiresApproval(tool.riskLevel) && !params.skipApproval) {
    const toolCallId = await insertToolCall(params.context.client, {
      organizationId: params.context.organizationId,
      userId: params.context.userId,
      cardId,
      toolName: params.toolName,
      riskLevel: tool.riskLevel,
      input: parsedInput,
      status: 'pending',
      approvalStatus: 'pending',
    });

    const preview = {
      summary: `${params.toolName} awaiting approval`,
      input: parsedInput,
    };

    await insertApprovalRequest(params.context.client, {
      organizationId: params.context.organizationId,
      toolCallId,
      requestedBy: params.context.userId,
      payload: preview,
    });

    return {
      status: 'approval_required',
      toolName: params.toolName,
      riskLevel: tool.riskLevel as 'medium' | 'high',
      toolCallId,
      preview,
      message: 'This action requires approval before execution.',
    };
  }

  const result = await runTool(params.toolName, parsedInput, params.context);

  const toolCallId = await insertToolCall(params.context.client, {
    organizationId: params.context.organizationId,
    userId: params.context.userId,
    cardId: result.cardId ?? cardId,
    toolName: params.toolName,
    riskLevel: tool.riskLevel,
    input: parsedInput,
    status: 'executed',
    approvalStatus: 'not_required',
    output: { message: result.message, data: result.data ?? null },
  });

  await logAiToolExecuted(params.context.client, {
    organizationId: params.context.organizationId,
    userId: params.context.userId,
    toolName: params.toolName,
    cardId: result.cardId ?? cardId,
    summary: result.message,
  });

  return {
    status: 'executed',
    toolName: params.toolName,
    message: result.message,
    data: result.data,
    toolCallId,
  };
}

export async function executeApprovedToolCall(params: {
  client: SupabaseClient;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  loadedContext: BoardAiContext | CardAiContext;
  toolName: string;
  input: Record<string, unknown>;
  toolCallId: string;
}): Promise<ToolExecutionResult> {
  const result = await runTool(params.toolName, params.input, {
    client: params.client,
    organizationId: params.organizationId,
    userId: params.userId,
    role: params.role,
    loadedContext: params.loadedContext,
  });

  await markApprovalGranted(params.client, params.toolCallId, params.organizationId, params.userId);
  await markToolCallExecuted(params.client, params.toolCallId, params.organizationId, {
    message: result.message,
    data: result.data ?? null,
  });

  await logAiToolExecuted(params.client, {
    organizationId: params.organizationId,
    userId: params.userId,
    toolName: params.toolName,
    cardId: result.cardId ?? null,
    summary: result.message,
  });

  return {
    status: 'executed',
    toolName: params.toolName,
    message: result.message,
    data: result.data,
    toolCallId: params.toolCallId,
  };
}
