'use client';

import { AiCommandDock } from '@/components/ai/AiCommandDock';
import { AiCopilotPopover } from '@/components/ai/AiCopilotPopover';
import { AiInlineBanner } from '@/components/ai/AiInlineBanner';

type AiContext = {
  page: 'board' | 'card';
  organizationId: string;
  userId: string;
  role: string;
  pipelineMode?: 'compact' | 'full';
  selectedCardId?: string;
};

type InlinePrompt = {
  message: string;
  actionLabel: string;
};

type Props = {
  inlinePrompt: InlinePrompt | null;
  onInlineAction: () => void;
  onDismissInline: () => void;
  toolbarAiContext: AiContext | null;
  aiCopilotOpen: boolean;
  onCloseCopilot: () => void;
  onRefresh: () => void;
  aiContext: AiContext | null;
  aiDockExpanded: boolean;
  onAiDockExpandedChange: (expanded: boolean) => void;
};

export function KanbanBoardAiChrome({
  inlinePrompt,
  onInlineAction,
  onDismissInline,
  toolbarAiContext,
  aiCopilotOpen,
  onCloseCopilot,
  onRefresh,
  aiContext,
  aiDockExpanded,
  onAiDockExpandedChange,
}: Props) {
  return (
    <>
      {inlinePrompt ? (
        <div className="px-4 pb-2">
          <AiInlineBanner
            message={inlinePrompt.message}
            actionLabel={inlinePrompt.actionLabel}
            onAction={onInlineAction}
            onDismiss={onDismissInline}
          />
        </div>
      ) : null}

      {toolbarAiContext ? (
        <AiCopilotPopover
          open={aiCopilotOpen}
          onClose={onCloseCopilot}
          context={toolbarAiContext}
          onRefresh={onRefresh}
          suggestedChips={['Daily brief', 'Show overdue jobs', 'Create job from notes']}
          autoFocus
        />
      ) : null}

      {aiContext ? (
        <AiCommandDock
          context={aiContext}
          expanded={aiDockExpanded}
          onExpandedChange={onAiDockExpandedChange}
          onRefresh={onRefresh}
        />
      ) : null}
    </>
  );
}
