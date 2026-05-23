export type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export const MAX_CONVERSATION_TURNS = 10;

export function trimConversationHistory(
  history: ConversationTurn[] | undefined,
): ConversationTurn[] {
  if (!history?.length) {
    return [];
  }

  return history.slice(-MAX_CONVERSATION_TURNS);
}

export function appendTurn(
  history: ConversationTurn[],
  role: ConversationTurn['role'],
  content: string,
): ConversationTurn[] {
  return trimConversationHistory([...history, { role, content }]);
}
