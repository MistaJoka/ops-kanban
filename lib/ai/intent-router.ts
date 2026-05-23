import type { LoadedAiContext } from '@/lib/ai/context-loader';
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

function resolveCardId(context: LoadedAiContext, explicitId?: string): string | undefined {
  if (explicitId) return explicitId;
  if (context.page === 'card') {
    return String(context.card.id);
  }
  return undefined;
}

export function routeCommand(
  command: string,
  context: LoadedAiContext,
): ToolProposal | { message: string } | null {
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();

  if (isBlockedPrompt(trimmed)) {
    return {
      message: 'I cannot run destructive or unsafe commands. Use the board to manage jobs safely.',
    };
  }

  if (/unpaid|who owes|outstanding balance/.test(lower)) {
    return { toolName: 'getUnpaidInvoices', input: { minBalance: 0 } };
  }

  if (/revenue|books|conversion/.test(lower)) {
    return { toolName: 'getRevenueSummary', input: {} };
  }

  if (/schedule|calendar|this week/.test(lower) && /conflict|overlap/.test(lower)) {
    return { message: 'Open the calendar or specify a job and time to check conflicts.' };
  }

  if (/create invoice|invoice draft/.test(lower)) {
    const cardId = resolveCardId(context);
    if (!cardId) {
      return { message: 'Open the job you want to invoice.' };
    }
    return { toolName: 'createInvoiceDraft', input: { cardId } };
  }

  if (/payment link|pay link/.test(lower)) {
    const cardId = resolveCardId(context);
    if (!cardId) {
      return { message: 'Open the job with the invoice first.' };
    }
    return { toolName: 'createPaymentLink', input: { cardId } };
  }

  if (/assign/.test(lower) && /to|crew|lead/.test(lower)) {
    const cardId = resolveCardId(context);
    const nameMatch = trimmed.match(/assign(?:\s+to)?\s+([A-Za-z][A-Za-z\s.'-]+)/i);
    if (!cardId) {
      return { message: 'Open the job you want to assign.' };
    }
    if (nameMatch) {
      return {
        toolName: 'assignCard',
        input: { cardId, assigneeName: nameMatch[1].trim() },
      };
    }
  }

  if (/daily\s+brief|morning\s+brief|what\s+should\s+we\s+(tackle|do)\s+first/.test(lower)) {
    return { toolName: 'getDailyBrief', input: {} };
  }

  if (/pipeline\s+metrics|revenue\s+by\s+column/.test(lower)) {
    return { toolName: 'getPipelineMetrics', input: {} };
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

  const createMatch = trimmed.match(
    /create(?:\s+a)?\s+(?:job|inquiry|card)\s+["“']?([^"”']+)["”']?/i,
  );
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
          scopeNotes: String(context.card.description),
        },
      };
    }
    return {
      toolName: 'createQuoteDraft',
      input: {
        cardId,
        scopeNotes: trimmed,
      },
    };
  }

  if (/mark\s+(?:invoice\s+)?paid/.test(lower)) {
    const cardId = resolveCardId(context);
    if (!cardId) {
      return { message: 'Open the job with the invoice you want to mark paid.' };
    }
    return { toolName: 'markInvoicePaid', input: { cardId } };
  }

  if (/archive/.test(lower)) {
    const cardId = resolveCardId(context);
    if (!cardId) {
      const titleMatch = trimmed.match(
        /archive(?:\s+(?:the|this))?\s+(?:job\s+)?["“']?([^"”'\n.!?]+?)["”']?(?:\s+job)?/i,
      );
      if (titleMatch?.[1]) {
        return { toolName: 'archiveCard', input: { title: titleMatch[1].trim() } };
      }
      return { message: 'Which job should I archive? Tell me the job title.' };
    }
    return { toolName: 'archiveCard', input: { cardId } };
  }

  if (/\bdelete\b|\bremove\b/.test(lower)) {
    const cardId = resolveCardId(context);
    if (cardId) {
      return { toolName: 'deleteCard', input: { cardId } };
    }
    const titleMatch = trimmed.match(
      /(?:delete|remove)(?:\s+(?:the|this|that))?\s+(?:job\s+)?(.+?)\s*$/i,
    );
    if (titleMatch?.[1]) {
      const title = titleMatch[1]
        .trim()
        .replace(/\s+job\s*$/i, '')
        .trim();
      return { toolName: 'deleteCard', input: { title } };
    }
    return { message: 'Which job should I delete? Tell me the job title.' };
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
