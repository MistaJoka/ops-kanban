import type { SupabaseClient } from '@supabase/supabase-js';

import type { RiskLevel } from '@/lib/ai/risk-classifier';

export type ToolCallRecord = {
  id: string;
  toolName: string;
  riskLevel: RiskLevel;
  input: Record<string, unknown>;
  status: string;
  approvalStatus: string;
};

export async function insertToolCall(
  client: SupabaseClient,
  params: {
    organizationId: string;
    userId: string | null;
    cardId?: string | null;
    toolName: string;
    riskLevel: RiskLevel;
    input: Record<string, unknown>;
    status: 'pending' | 'executed' | 'rejected';
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'not_required';
    output?: Record<string, unknown>;
    errorMessage?: string | null;
  },
): Promise<string> {
  const { data, error } = await client
    .from('ai_tool_calls')
    .insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      card_id: params.cardId ?? null,
      tool_name: params.toolName,
      risk_level: params.riskLevel,
      input_json: params.input,
      output_json: params.output ?? {},
      status: params.status,
      approval_status: params.approvalStatus,
      error_message: params.errorMessage ?? null,
      executed_at: params.status === 'executed' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to log AI tool call.');
  }

  return data.id;
}

export async function insertApprovalRequest(
  client: SupabaseClient,
  params: {
    organizationId: string;
    toolCallId: string;
    requestedBy: string | null;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await client.from('ai_action_approvals').insert({
    organization_id: params.organizationId,
    tool_call_id: params.toolCallId,
    requested_by: params.requestedBy,
    status: 'pending',
    payload: params.payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getToolCall(
  client: SupabaseClient,
  organizationId: string,
  toolCallId: string,
): Promise<ToolCallRecord | null> {
  const { data, error } = await client
    .from('ai_tool_calls')
    .select('id, tool_name, risk_level, input_json, status, approval_status')
    .eq('id', toolCallId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    toolName: data.tool_name,
    riskLevel: data.risk_level as RiskLevel,
    input: data.input_json as Record<string, unknown>,
    status: data.status,
    approvalStatus: data.approval_status,
  };
}

export async function markToolCallExecuted(
  client: SupabaseClient,
  toolCallId: string,
  organizationId: string,
  output: Record<string, unknown>,
): Promise<void> {
  const { error } = await client
    .from('ai_tool_calls')
    .update({
      status: 'executed',
      approval_status: 'approved',
      output_json: output,
      executed_at: new Date().toISOString(),
    })
    .eq('id', toolCallId)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markToolCallRejected(
  client: SupabaseClient,
  toolCallId: string,
  organizationId: string,
): Promise<void> {
  const { error: toolError } = await client
    .from('ai_tool_calls')
    .update({
      status: 'rejected',
      approval_status: 'rejected',
    })
    .eq('id', toolCallId)
    .eq('organization_id', organizationId);

  if (toolError) {
    throw new Error(toolError.message);
  }

  const { error: approvalError } = await client
    .from('ai_action_approvals')
    .update({
      status: 'rejected',
      resolved_at: new Date().toISOString(),
    })
    .eq('tool_call_id', toolCallId)
    .eq('organization_id', organizationId);

  if (approvalError) {
    throw new Error(approvalError.message);
  }
}

export async function markApprovalGranted(
  client: SupabaseClient,
  toolCallId: string,
  organizationId: string,
  approvedBy: string | null,
): Promise<void> {
  const { error } = await client
    .from('ai_action_approvals')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('tool_call_id', toolCallId)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(error.message);
  }
}

export type PendingApprovalItem = {
  id: string;
  toolCallId: string;
  toolName: string;
  cardId: string | null;
  preview: { summary: string; input: Record<string, unknown>; details?: string[] };
  createdAt: string;
};

export async function listPendingApprovals(
  client: SupabaseClient,
  organizationId: string,
): Promise<PendingApprovalItem[]> {
  const { data, error } = await client
    .from('ai_action_approvals')
    .select(
      `
      id,
      created_at,
      payload,
      ai_tool_calls!inner (
        id,
        tool_name,
        card_id
      )
    `,
    )
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const toolCallRaw = row.ai_tool_calls;
    const toolCall = (Array.isArray(toolCallRaw) ? toolCallRaw[0] : toolCallRaw) as {
      id: string;
      tool_name: string;
      card_id: string | null;
    } | null;

    if (!toolCall) {
      throw new Error('Pending approval missing tool call.');
    }
    const payload = row.payload as {
      summary: string;
      input: Record<string, unknown>;
      details?: string[];
    };

    return {
      id: row.id,
      toolCallId: toolCall.id,
      toolName: toolCall.tool_name,
      cardId: toolCall.card_id,
      preview: {
        summary: payload.summary,
        input: payload.input,
        details: payload.details,
      },
      createdAt: row.created_at,
    };
  });
}
