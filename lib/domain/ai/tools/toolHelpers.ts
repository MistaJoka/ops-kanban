import type { SupabaseClient } from '@supabase/supabase-js';

import type { LoadedAiContext } from '@/lib/ai/context-loader';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';

export type ToolRunContext = {
  client: SupabaseClient;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  loadedContext: LoadedAiContext;
};

export type ToolResult = {
  message: string;
  data?: unknown;
  cardId?: string | null;
};

export type ToolHandler = (
  input: Record<string, unknown>,
  ctx: ToolRunContext,
  boardCtx: BoardContext,
) => Promise<ToolResult>;

export type BoardView = Awaited<ReturnType<typeof getPrimaryBoard>>;

export type BoardContext = {
  boardView: BoardView;
  board: BoardView & { boardId: string };
};

export async function prepareBoardContext(ctx: ToolRunContext): Promise<BoardContext> {
  const boardView = await getPrimaryBoard(ctx.client, ctx.organizationId, true);
  const board =
    ctx.loadedContext.page === 'board'
      ? { ...boardView, boardId: ctx.loadedContext.boardId }
      : { ...boardView, boardId: boardView.id };
  return { boardView, board };
}

export function appOrigin(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function calendarRangeFromContext(ctx: ToolRunContext): { start: string; end: string } {
  if (ctx.loadedContext.page === 'calendar') {
    return ctx.loadedContext.range;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function resolveColumnId(
  client: SupabaseClient,
  organizationId: string,
  boardId: string,
  columnStateKey: string,
): Promise<string> {
  const { data, error } = await client
    .from('columns')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('board_id', boardId)
    .eq('state_key', columnStateKey)
    .single();

  if (error || !data) {
    throw new Error(`Column "${columnStateKey}" not found.`);
  }

  return data.id;
}

export function buildCardSummary(detail: NonNullable<Awaited<ReturnType<typeof getCardDetail>>>) {
  const lines = [
    `${detail.title} is in ${detail.stateKey.replace(/_/g, ' ')}.`,
    detail.customer?.address
      ? `Property: ${detail.customer.address}.`
      : detail.customer?.name
        ? `Customer: ${detail.customer.name}.`
        : null,
    detail.nextAction ? `Next action: ${detail.nextAction}.` : 'No next action set yet.',
    detail.scheduledStart
      ? `Scheduled: ${new Date(detail.scheduledStart).toLocaleDateString()}.`
      : null,
    detail.quoteTotal > 0 ? `Estimate total: $${detail.quoteTotal.toFixed(2)}.` : null,
  ].filter(Boolean);

  return lines.join(' ');
}
