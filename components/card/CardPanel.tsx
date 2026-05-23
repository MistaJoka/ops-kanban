'use client';

import { useEffect, useState } from 'react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardSyncHandlers, MoveCardResult } from '@/components/pipeline/useBoardState';
import type { EnqueueSidecar } from '@/components/pipeline/useOutboundSync';
import { CardPanelHeader } from '@/components/card/CardPanelHeader';
import { CardPanelBody } from '@/components/card/CardPanelBody';
import { CardPanelModals } from '@/components/card/CardPanelModals';
import { useCardDetail } from '@/components/card/useCardDetail';
import { useCardMutations } from '@/components/card/useCardMutations';
import { getCardPropertyLabel } from '@/components/pipeline/board-card-primitives';
import { cn } from '@/lib/utils';

type TabKey =
  | 'overview'
  | 'property'
  | 'scope'
  | 'schedule'
  | 'comments'
  | 'checklist'
  | 'estimate'
  | 'money'
  | 'comms'
  | 'files';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'property', label: 'Property' },
  { key: 'scope', label: 'Scope' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'comments', label: 'Comments' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'estimate', label: 'Estimate' },
  { key: 'money', label: 'Money' },
  { key: 'comms', label: 'Comms' },
  { key: 'files', label: 'Files' },
];

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
  const [tab, setTab] = useState<TabKey>('overview');

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
  const currentColumn = columns.find((column) => column.id === card?.columnId);
  const propertyLabel = card
    ? getCardPropertyLabel(card.customer?.address, card.customer?.name, card.jobType)
    : null;
  const canManageMoney = role === 'owner' || role === 'manager';

  return (
    <>
      <div className="ops-panel-overlay" onClick={onClose} aria-hidden />
      <aside
        className="ops-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Job detail panel"
      >
        {detail.loading && !detail.payload?.card ? (
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-sm text-[var(--text-secondary)]"
            role="status"
            aria-live="polite"
          >
            <p>Loading job…</p>
          </div>
        ) : detail.error && !detail.payload?.card ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p role="alert" className="text-sm text-[var(--urgent)]">
              {detail.error}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => void detail.loadCard()} className="ops-btn-primary">
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

            <div className="ops-tab-bar">
              <div className="flex gap-0.5 py-1.5">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={cn('ops-tab', tab === item.key && 'ops-tab--active')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {detail.error ? (
              <p className="ops-alert-error mx-4 mt-3">{detail.error}</p>
            ) : null}

            <CardPanelBody
              tab={tab}
              setTab={setTab}
              cardId={cardId}
              card={card}
              payload={detail.payload}
              members={detail.members}
              changeOrders={detail.changeOrders}
              canManageMoney={canManageMoney}
              stripeEnabled={detail.stripeEnabled}
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
