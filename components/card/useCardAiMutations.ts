'use client';

import { useState } from 'react';

type AiContext = {
  page: 'card';
  organizationId: string;
  userId: string;
  role: string;
  selectedCardId: string;
};

export function useCardAiMutations({
  aiContext,
  setError,
  setAiApproval,
  patchCard,
}: {
  aiContext: AiContext | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setAiApproval: React.Dispatch<
    React.SetStateAction<{
      toolCallId: string;
      toolName: string;
      preview: { summary: string; input: Record<string, unknown> };
      message: string;
    } | null>
  >;
  patchCard: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [suggestNextActionLoading, setSuggestNextActionLoading] = useState(false);

  const suggestNextActionFromAi = async () => {
    if (!aiContext) {
      return;
    }

    setSuggestNextActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'Suggest next action',
          context: { ...aiContext, mode: 'analyze' },
        }),
      });
      const responsePayload = await response.json();
      if (!response.ok) {
        throw new Error(responsePayload.error ?? 'AI suggestion failed.');
      }

      const result = responsePayload.data as {
        status?: string;
        message?: string;
        data?: { suggestion?: string };
      };

      if (result?.status === 'approval_required') {
        setAiApproval(responsePayload.data);
        return;
      }

      const suggestion =
        result?.data?.suggestion ?? (typeof result?.message === 'string' ? result.message : null);
      if (!suggestion) {
        throw new Error('No suggestion returned.');
      }

      await patchCard({ nextAction: suggestion });
    } catch (suggestError) {
      setError(suggestError instanceof Error ? suggestError.message : 'AI suggestion failed.');
    } finally {
      setSuggestNextActionLoading(false);
    }
  };

  return { suggestNextActionLoading, suggestNextActionFromAi };
}
