import type { BoardAiContext, CardAiContext } from '@/lib/ai/context-loader';
import { getToolDefinition } from '@/lib/ai/tool-registry';

export type ToolProposal = {
  toolName: string;
  input: Record<string, unknown>;
  message?: string;
};

const BLOCKED_PATTERNS = [
  /delete\s+all/i,
  /drop\s+table/i,
  /service\s+role/i,
  /ignore\s+(all\s+)?rules/i,
];

export function isBlockedPrompt(command: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(command));
}

function resolveCardId(
  context: BoardAiContext | CardAiContext,
  explicitId?: string,
): string | undefined {
  if (explicitId) return explicitId;
  if (context.page === 'card') {
    return String(context.card.id);
  }
  return undefined;
}

export function routeCommand(
  command: string,
  context: BoardAiContext | CardAiContext,
): ToolProposal | { message: string } | null {
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();

  if (isBlockedPrompt(trimmed)) {
    return {
      message: 'I cannot run destructive or unsafe commands. Use the board to manage jobs safely.',
    };
  }

  if (/summarize|summary|recap/.test(lower)) {
    const cardId = resolveCardId(context);
    if (!cardId) {
      return { message: 'Open a job card first, then ask me to summarize it.' };
    }
    return { toolName: 'summarizeCard', input: { cardId } };
  }

  if (/overdue/.test(lower)) {
    return { toolName: 'getOverdueCards', input: { limit: 10 } };
  }

  if (/stalled|stuck/.test(lower)) {
    const minDays = Number(lower.match(/(\d+)\s*days?/)?.[1] ?? 5);
    return { toolName: 'getStalledCards', input: { minDays } };
  }

  if (/board|pipeline|columns/.test(lower) && /status|state|show|list/.test(lower)) {
    return { toolName: 'getBoardState', input: {} };
  }

  const createMatch = trimmed.match(/create(?:\s+a)?\s+(?:job|inquiry|card)\s+["“']?([^"”']+)["”']?/i);
  if (createMatch) {
    return {
      toolName: 'createCard',
      input: { title: createMatch[1].trim(), columnStateKey: 'inquiry' },
    };
  }

  const moveMatch = lower.match(/move(?:\s+(?:this|the)\s+job)?\s+to\s+([a-z_ ]+)/);
  if (moveMatch) {
    const cardId = resolveCardId(context);
    if (!cardId) {
      return { message: 'Open the job you want to move, then tell me the target column.' };
    }
    const stateKey = moveMatch[1].trim().replace(/\s+/g, '_');
    return { toolName: 'moveCard', input: { cardId, columnStateKey: stateKey } };
  }

  if (/draft\s+estimate|estimate\s+draft|line\s+items/.test(lower)) {
    const cardId = resolveCardId(context);
    if (!cardId) {
      return { message: 'Open a job in Estimating to draft an estimate.' };
    }
    if (context.page === 'card' && context.card.description) {
      return {
        toolName: 'createQuoteDraft',
        input: {
          cardId,
          lineItems: [
            {
              description: String(context.card.description).slice(0, 120),
              quantity: 1,
              unitPrice: Number(context.card.revenueValue ?? 0) || 150,
            },
          ],
        },
      };
    }
    return {
      toolName: 'createQuoteDraft',
      input: {
        cardId,
        lineItems: [{ description: 'Site work per scope notes', quantity: 1, unitPrice: 150 }],
      },
    };
  }

  if (/next\s+action|what\s+should\s+we\s+do/.test(lower)) {
    const cardId = resolveCardId(context);
    if (!cardId) {
      return { message: 'Open a job card to suggest a next action.' };
    }
    return { toolName: 'suggestNextAction', input: { cardId } };
  }

  return null;
}

export function validateToolProposal(proposal: ToolProposal): ToolProposal {
  const tool = getToolDefinition(proposal.toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${proposal.toolName}`);
  }
  const parsed = tool.schema.parse(proposal.input);
  return { toolName: proposal.toolName, input: parsed as Record<string, unknown> };
}
