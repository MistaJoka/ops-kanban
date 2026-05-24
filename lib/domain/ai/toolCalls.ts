import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';

import { boardToolHandlers } from './tools/boardTools';
import { calendarToolHandlers } from './tools/calendarTools';
import { cardToolHandlers } from './tools/cardTools';
import { commsToolHandlers } from './tools/commsTools';
import { customerToolHandlers } from './tools/customerTools';
import { documentToolHandlers } from './tools/documentTools';
import { moneyToolHandlers } from './tools/moneyTools';
import { reportToolHandlers } from './tools/reportTools';
import { prepareBoardContext, type ToolRunContext, type ToolResult } from './tools/toolHelpers';

export type { ToolRunContext, ToolResult } from './tools/toolHelpers';

const allToolHandlers = {
  ...boardToolHandlers,
  ...cardToolHandlers,
  ...moneyToolHandlers,
  ...customerToolHandlers,
  ...documentToolHandlers,
  ...commsToolHandlers,
  ...calendarToolHandlers,
  ...reportToolHandlers,
};

export async function runTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolRunContext,
): Promise<ToolResult> {
  const handler = allToolHandlers[toolName];
  if (!handler) {
    throw new Error(`Tool not implemented: ${toolName}`);
  }

  const boardCtx = await prepareBoardContext(ctx);
  return handler(input, ctx, boardCtx);
}

export async function logAiToolExecuted(
  client: SupabaseClient,
  params: {
    organizationId: string;
    userId: string | null;
    toolName: string;
    cardId?: string | null;
    summary: string;
  },
): Promise<void> {
  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.userId,
    entityType: 'card',
    entityId: params.cardId ?? params.organizationId,
    action: 'ai.tool_executed',
    summary: params.summary,
    metadata: { tool_name: params.toolName },
  });
}
