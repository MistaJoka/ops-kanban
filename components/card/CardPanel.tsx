'use client';

import { useEffect, useRef, useState } from 'react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardSyncHandlers, MoveCardResult } from '@/components/pipeline/useBoardState';
import type { EnqueueSidecar } from '@/components/pipeline/useOutboundSync';
import { CardPanelSkeleton } from '@/components/card/CardPanelSkeleton';
import { CardPanelHeader } from '@/components/card/CardPanelHeader';
import { CardPanelBody } from '@/components/card/CardPanelBody';
import { CardPanelModals } from '@/components/card/CardPanelModals';
import {
  CardPanelTabBar,
  getTabBadges,
  type PanelTabKey,
} from '@/components/card/CardPanelTabBar';
import { useCardDetail } from '@/components/card/useCardDetail';
import { useCardMutations } from '@/components/card/useCardMutations';
import { getCardPropertyLabel } from '@/components/pipeline/board-card-primitives';
import { defaultPanelTabForState } from '@/lib/domain/cards/defaultPanelTab';

export function CardPanel({
  cardId,
  columns,
  role,
  organizationId,
  userId,
  onClose,
  boardSync,
  onMoveCard,
  initialBoardCard,
}: {
  cardId: string;
  columns: BoardColumnView[];
  role: string;
  organizationId: string;
  userId: string | null;
  onClose: () => void;
  boardSync: BoardSyncHandlers;
  onMoveCard: (
    cardId: string,
    targetColumnId: string,
    extras?: { reason?: string },
    sidecar?: EnqueueSidecar,
  ) => Promise<MoveCardResult>;
  initialBoardCard?: BoardCardView;
}) {
  const [tab, setTab] = useState<PanelTabKey>('overview');
  const openedCardRef = useRef<string | null>(null);

  const detail = useCardDetail(cardId, boardSync, initialBoardCard);
  const mutations = useCardMutations({
    cardId,
    columns,
    role,
    organizationId,
    userId,
    onClose,
    boardSync,
    onMoveCard,
    payload: detail.payload,
    setPayload: detail.setPayload,
    setError: detail.setError,
    loadCard: detail.loadCard,
    setTab,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const card = detail.payload?.card;

  useEffect(() => {
    openedCardRef.current = null;
  }, [cardId]);

  useEffect(() => {
    if (!card || openedCardRef.current === cardId) {
      return;
    }

    openedCardRef.current = cardId;
    setTab(defaultPanelTabForState(card.stateKey));
  }, [card, cardId]);

  const currentColumn = columns.find((column) => column.id === card?.columnId);
  const propertyLabel = card
    ? getCardPropertyLabel(card.customer?.address, card.customer?.name, card.jobType)
    : null;
  const canManageMoney = role === 'owner' || role === 'manager';

  const tabBadges =
    detail.payload && card
      ? getTabBadges({
          quote: detail.payload.quote,
          invoice: detail.payload.invoice,
          commentCount: detail.payload.comments?.length ?? 0,
        })
      : {};

  return (
    <>
      <div className="ops-panel-overlay" onClick={onClose} aria-hidden />
      <aside className="ops-panel" role="dialog" aria-modal="true" aria-label="Job detail panel">
        {detail.loading && !detail.payload?.card ? (
          <CardPanelSkeleton />
        ) : detail.error && !detail.payload?.card ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p role="alert" className="text-sm text-[var(--urgent)]">
              {detail.error}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void detail.loadCard()}
                className="ops-btn-primary"
              >
                Try again
              </button>
              <button type="button" onClick={onClose} className="ops-btn-secondary">
                Close
              </button>
            </div>
          </div>
        ) : !card || !detail.payload ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-secondary)]">
            Job not found.
          </div>
        ) : (
          <>
            <CardPanelHeader
              card={card}
              columns={columns}
              currentColumn={currentColumn}
              propertyLabel={propertyLabel}
              quote={detail.payload.quote}
              invoice={detail.payload.invoice}
              canDelete={mutations.canDelete}
              onClose={onClose}
              onPatchTitle={(title) => void mutations.patchCard({ title })}
              onPatchPriority={(priority) => void mutations.patchCard({ priority })}
              onMove={(columnId) => void mutations.attemptMove(columnId)}
              onCopyJobLink={() => void mutations.copyJobLink()}
              onCopyPortalLink={() => void mutations.copyPortalLink()}
              onArchive={() => void mutations.archiveJob()}
              onDelete={() => void mutations.deleteJob()}
            />

            <CardPanelTabBar tab={tab} onTabChange={setTab} badges={tabBadges} />

            {detail.error ? <p className="ops-alert-error mx-4 mt-3">{detail.error}</p> : null}

            <CardPanelBody
              tab={tab}
              setTab={setTab}
              cardId={cardId}
              card={card}
              payload={detail.payload}
              members={detail.members}
              changeOrders={detail.changeOrders}
              canManageMoney={canManageMoney}
              paypalEnabled={detail.paypalEnabled}
              twilioEnabled={detail.twilioEnabled}
              resendEnabled={detail.resendEnabled}
              mutations={mutations}
              onRefresh={() => void detail.loadCard(true)}
            />
          </>
        )}
      </aside>

      <CardPanelModals
        mutations={mutations}
        defaultEmail={detail.payload?.card.customer?.email}
        onRefresh={() => void detail.loadCard(true)}
        onEstimateComplete={() => setTab('estimate')}
      />
    </>
  );
}
