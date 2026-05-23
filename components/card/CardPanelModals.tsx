'use client';

import { MovePromptModal } from '@/components/card/MovePromptModal';
import { SendEstimateModal } from '@/components/card/SendEstimateModal';
import { ApprovalModal } from '@/components/ai/ApprovalModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { useCardMutations } from '@/components/card/useCardMutations';

type Mutations = ReturnType<typeof useCardMutations>;

export function CardPanelModals({
  mutations,
  defaultEmail,
  onRefresh,
  onEstimateComplete,
}: {
  mutations: Mutations;
  defaultEmail: string | null | undefined;
  onRefresh: () => void;
  onEstimateComplete: () => void;
}) {
  return (
    <>
      {mutations.aiApproval && mutations.aiContext ? (
        <ApprovalModal
          toolCallId={mutations.aiApproval.toolCallId}
          toolName={mutations.aiApproval.toolName}
          preview={mutations.aiApproval.preview}
          context={mutations.aiContext}
          onClose={() => mutations.setAiApproval(null)}
          onComplete={() => {
            mutations.setAiApproval(null);
            onRefresh();
            onEstimateComplete();
          }}
        />
      ) : null}

      {mutations.movePrompt ? (
        <MovePromptModal
          type={mutations.movePrompt.type}
          message={mutations.movePrompt.message}
          onCancel={() => mutations.setMovePrompt(null)}
          onConfirm={(value) => {
            if (mutations.movePrompt?.type === 'schedule') {
              void mutations.attemptMove(mutations.movePrompt.targetColumnId, {
                scheduledStart: value,
              });
            } else if (mutations.movePrompt?.type === 'reason') {
              void mutations.attemptMove(mutations.movePrompt.targetColumnId, { reason: value });
            } else {
              mutations.setMovePrompt(null);
            }
          }}
        />
      ) : null}

      {mutations.confirmAction ? (
        <ConfirmModal
          title={mutations.confirmAction.title}
          message={mutations.confirmAction.message}
          confirmLabel={mutations.confirmAction.confirmLabel}
          confirmVariant={mutations.confirmAction.confirmVariant}
          pending={mutations.saving}
          onCancel={() => {
            if (!mutations.saving) {
              mutations.setConfirmAction(null);
            }
          }}
          onConfirm={async () => {
            await mutations.confirmAction!.onConfirm();
            mutations.setConfirmAction(null);
          }}
        />
      ) : null}

      {mutations.sendEstimateOpen ? (
        <SendEstimateModal
          defaultEmail={defaultEmail}
          pending={mutations.saving}
          error={mutations.sendEstimateError}
          onClose={() => {
            if (!mutations.saving) {
              mutations.setSendEstimateOpen(false);
              mutations.setSendEstimateError(null);
            }
          }}
          onSend={mutations.sendEstimate}
        />
      ) : null}
    </>
  );
}
