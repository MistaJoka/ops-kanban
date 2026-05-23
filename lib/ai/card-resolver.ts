import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { VisibleCardSummary } from '@/lib/ai/context-utils';
import type { LoadedAiContext } from '@/lib/ai/context-loader';

export type CardMatch = {
  id: string;
  title: string;
  stateKey: string;
  customerAddress?: string;
  score: number;
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function scoreMatch(queryTokens: string[], card: { title: string; customerAddress?: string | null }): number {
  const haystack = [card.title, card.customerAddress].filter(Boolean).join(' ').toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (haystack.includes(token)) {
      score += token.length >= 4 ? 3 : 1;
    }
  }

  if (queryTokens.length > 0 && haystack.includes(queryTokens.join(' '))) {
    score += 5;
  }

  return score;
}

export function searchCardsByQuery(
  cards: Array<BoardCardView | VisibleCardSummary>,
  query: string,
  limit = 5,
): CardMatch[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  return cards
    .map((card) => ({
      id: card.id,
      title: card.title,
      stateKey: card.stateKey,
      customerAddress: 'customerAddress' in card ? card.customerAddress ?? undefined : undefined,
      score: scoreMatch(queryTokens, {
        title: card.title,
        customerAddress: 'customerAddress' in card ? card.customerAddress : undefined,
      }),
    }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function formatDisambiguationMessage(matches: CardMatch[]): string {
  const options = matches
    .slice(0, 3)
    .map((match, index) => `${index + 1}. ${match.title}${match.customerAddress ? ` — ${match.customerAddress}` : ''}`)
    .join('\n');

  return `I found multiple jobs. Which one did you mean?\n${options}\n\nReply with the number or full job title.`;
}

export type CardToolProposal = {
  toolName: string;
  input: Record<string, unknown>;
};

const CARD_REFERENCE_TOOLS = new Set([
  'moveCard',
  'deleteCard',
  'archiveCard',
  'summarizeCard',
  'createQuoteDraft',
  'createInvoiceDraft',
  'createPaymentLink',
  'markInvoicePaid',
  'assignCard',
  'updateCard',
  'createInternalNote',
  'updateCustomer',
  'suggestNextAction',
  'draftSms',
  'draftEmail',
  'sendSms',
  'sendEmail',
]);

export function cardIdFromLoadedContext(context: LoadedAiContext): string | undefined {
  if (context.page === 'card') {
    return String(context.card.id);
  }
  return undefined;
}

export function extractCardQueryFromCommand(command: string, toolName?: string): string | null {
  const trimmed = command.trim();

  if (!toolName || toolName === 'deleteCard' || /\b(delete|remove)\b/i.test(trimmed)) {
    const deleteMatch = trimmed.match(
      /(?:delete|remove)(?:\s+(?:the|this|that))?\s+(?:job\s+)?(.+?)\s*$/i,
    );
    if (deleteMatch?.[1]) {
      return deleteMatch[1].trim().replace(/\s+job\s*$/i, '').trim();
    }
  }

  const cardRefMatch = trimmed.match(
    /(?:for|on|job|card)\s+["“']?([^"”'\n]+?)["”']?(?:\s*$|\s+to\b)/i,
  );
  return cardRefMatch?.[1]?.trim() ?? null;
}

function buildCardLookupQuery(
  proposal: CardToolProposal,
  command: string,
): string | null {
  if (typeof proposal.input.query === 'string' && proposal.input.query.trim()) {
    return proposal.input.query.trim();
  }
  if (typeof proposal.input.title === 'string' && proposal.input.title.trim()) {
    return proposal.input.title.trim();
  }
  return extractCardQueryFromCommand(command, proposal.toolName);
}

export function resolveCardProposalInput(
  proposal: CardToolProposal,
  command: string,
  loadedContext: LoadedAiContext,
  cards: Array<BoardCardView | VisibleCardSummary>,
): CardToolProposal | { message: string } {
  if (proposal.input.cardId) {
    return proposal;
  }

  const contextCardId = cardIdFromLoadedContext(loadedContext);
  if (contextCardId) {
    return {
      toolName: proposal.toolName,
      input: { ...proposal.input, cardId: contextCardId },
    };
  }

  const query = buildCardLookupQuery(proposal, command);
  if (!query) {
    if (CARD_REFERENCE_TOOLS.has(proposal.toolName)) {
      return { message: 'Which job did you mean? Tell me the job title.' };
    }
    return proposal;
  }

  const normalizedQuery = query.toLowerCase();
  const exactMatches = cards.filter((card) => card.title.toLowerCase() === normalizedQuery);
  if (exactMatches.length === 1) {
    return {
      toolName: proposal.toolName,
      input: {
        ...proposal.input,
        cardId: exactMatches[0].id,
        title: exactMatches[0].title,
      },
    };
  }

  const matches = searchCardsByQuery(cards, query, 5);

  if (matches.length === 1) {
    return {
      toolName: proposal.toolName,
      input: {
        ...proposal.input,
        cardId: matches[0].id,
        title: matches[0].title,
      },
    };
  }

  if (matches.length > 1) {
    return { message: formatDisambiguationMessage(matches) };
  }

  if (CARD_REFERENCE_TOOLS.has(proposal.toolName)) {
    return { message: `I couldn't find a job matching “${query}”. Try the full title.` };
  }

  return proposal;
}
