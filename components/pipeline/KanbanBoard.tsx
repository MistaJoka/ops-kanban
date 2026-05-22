'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AiDock } from '@/components/ai/AiDock';
import { CardPanel } from '@/components/card/CardPanel';
import type { BoardView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { KanbanColumn } from '@/components/pipeline/KanbanColumn';
import { BoardSyncStatusIndicator } from '@/components/pipeline/BoardSyncStatusIndicator';
import { useBoardRealtime } from '@/components/pipeline/useBoardRealtime';
import { useBoardState } from '@/components/pipeline/useBoardState';
import { PIPELINE_GROUP_LABELS, type PipelineGroupKey } from '@/lib/landscaping-full-pipeline';

type FilterKey = 'all' | 'overdue' | 'scheduled' | 'archived';

function matchesSearch(card: BoardCardView, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const haystack = [card.title, card.customerName, card.customerAddress, card.jobType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function matchesFilter(card: BoardCardView, filter: FilterKey): boolean {
  if (filter === 'archived') {
    return card.stateKey === 'archived';
  }

  if (filter === 'overdue') {
    return card.isOverdue;
  }

  if (filter === 'scheduled') {
    return Boolean(card.scheduledStart);
  }

  return card.stateKey !== 'archived';
}

export function KanbanBoard({
  initialBoard,
  role,
  organizationId,
  userId,
}: {
  initialBoard: BoardView;
  role: string;
  organizationId: string;
  userId: string | null;
}) {
  const {
    board,
    error,
    pipelineModePending,
    refreshBoard,
    createCard,
    moveCard,
    togglePipelineMode,
    boardSync,
    hasPendingMutations,
    syncStatus,
    setLiveConnected,
  } = useBoardState(initialBoard);

  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCardId = searchParams.get('card');

  const includeArchived = filter === 'archived';

  const openCard = useCallback(
    (cardId: string) => {
      router.push(`/pipeline?card=${cardId}`, { scroll: false });
    },
    [router],
  );

  const closeCard = useCallback(() => {
    router.push('/pipeline', { scroll: false });
  }, [router]);

  useEffect(() => {
    if (includeArchived) {
      void refreshBoard(true);
    }
  }, [includeArchived, refreshBoard]);

  useBoardRealtime(organizationId, () => {
    void refreshBoard(includeArchived);
  }, {
    shouldSkip: hasPendingMutations,
    onConnectionChange: (status) => {
      setLiveConnected(status === 'connected');
    },
  });

  const visibleColumns = useMemo(
    () =>
      includeArchived
        ? board.columns.filter((column) => column.stateKey === 'archived')
        : board.columns.filter((column) => column.stateKey !== 'archived'),
    [board.columns, includeArchived],
  );

  const filteredCards = useMemo(
    () => board.cards.filter((card) => matchesSearch(card, search) && matchesFilter(card, filter)),
    [board.cards, search, filter],
  );

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, BoardCardView[]>();
    for (const column of visibleColumns) {
      map.set(
        column.id,
        filteredCards
          .filter((card) => card.columnId === column.id)
          .sort((a, b) => a.position - b.position),
      );
    }
    return map;
  }, [visibleColumns, filteredCards]);

  const columnGroups = useMemo(() => {
    if (board.pipelineMode !== 'full') {
      return [{ key: 'all', label: null as string | null, columns: visibleColumns }];
    }

    const groups = new Map<PipelineGroupKey, typeof visibleColumns>();
    for (const column of visibleColumns) {
      const groupKey = (column.groupKey ?? 'sales') as PipelineGroupKey;
      const bucket = groups.get(groupKey) ?? [];
      bucket.push(column);
      groups.set(groupKey, bucket);
    }

    return [...groups.entries()].map(([key, columns]) => ({
      key,
      label: PIPELINE_GROUP_LABELS[key],
      columns,
    }));
  }, [board.pipelineMode, visibleColumns]);

  const handleMoveCard = useCallback(
    async (cardId: string, targetColumnId: string) => {
      const result = await moveCard(cardId, targetColumnId);
      if (!result.ok) {
        // Validation errors from drag moves are rare; panel handles prompts.
      }
      setDraggingCardId(null);
      setDropTargetColumnId(null);
    },
    [moveCard],
  );

  const clearDrag = useCallback(() => {
    setDraggingCardId(null);
    setDropTargetColumnId(null);
  }, []);

  const aiContext =
    userId ?
      {
        page: 'board' as const,
        organizationId,
        userId,
        role,
      }
    : null;

  const activeCardCount = useMemo(
    () => board.cards.filter((card) => card.stateKey !== 'archived').length,
    [board.cards],
  );

  const showNoMatches = filteredCards.length === 0 && activeCardCount > 0;
  const showEmptyBoard = activeCardCount === 0 && filter === 'all' && !search.trim();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="ops-toolbar">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div>
            <h1 className="ops-page-title">Job Pipeline</h1>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              <span className="font-medium tabular-nums text-[var(--text-primary)]">
                {filteredCards.length}
              </span>{' '}
              jobs · {visibleColumns.length} stages
              {board.pipelineMode === 'full' ? ' · full view' : ' · compact'}
            </p>
            <div className="mt-2">
              <BoardSyncStatusIndicator status={syncStatus} />
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pipelineModePending}
              onClick={() => void togglePipelineMode(includeArchived)}
              className="ops-btn-secondary"
            >
              {board.pipelineMode === 'full' ? 'Compact' : 'Full (19)'}
            </button>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterKey)}
              aria-label="Filter jobs"
              className="ops-control"
            >
              <option value="all">All jobs</option>
              <option value="overdue">Overdue</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search jobs…"
              aria-label="Search jobs"
              className="ops-control min-w-[200px]"
            />
            <button type="button" onClick={() => void createCard()} className="ops-btn-primary">
              + New job
            </button>
          </div>
        </div>
        {error ? (
          <p role="alert" aria-live="polite" className="ops-alert-error mt-3">
            {error}
          </p>
        ) : null}
      </div>

      {showEmptyBoard ? (
        <div role="status" className="ops-empty-state mx-4 mt-4">
          Your pipeline is ready.{' '}
          <button
            type="button"
            onClick={() => void createCard()}
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Create your first inquiry
          </button>
          .
        </div>
      ) : null}

      {showNoMatches ? (
        <div role="status" className="ops-empty-state mx-4 mt-4">
          {filter === 'archived'
            ? 'No archived jobs match your search.'
            : filter !== 'all'
              ? `No ${filter} jobs match your search.`
              : 'No jobs match your search.'}
        </div>
      ) : null}

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 md:p-4" onDragEnd={clearDrag}>
        <div className="flex h-full min-h-[520px] gap-4 md:gap-5">
          {columnGroups.map((group) => (
            <div key={group.key} className="flex shrink-0 gap-3 md:gap-4">
              {group.label ? (
                <div className="flex w-7 shrink-0 items-start justify-center pt-3">
                  <p className="origin-top-left rotate-180 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)] [writing-mode:vertical-rl]">
                    {group.label}
                  </p>
                </div>
              ) : null}
              <div className="flex gap-3 md:gap-4">
                {group.columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={cardsByColumn.get(column.id) ?? []}
                    draggingCardId={draggingCardId}
                    onDragStart={setDraggingCardId}
                    onDragEnd={clearDrag}
                    onDragOver={setDropTargetColumnId}
                    onDrop={(columnId) => {
                      if (draggingCardId) {
                        void handleMoveCard(draggingCardId, columnId);
                      }
                    }}
                    onCreate={createCard}
                    onOpenCard={openCard}
                    isDragTarget={dropTargetColumnId === column.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!selectedCardId && aiContext ? (
        <AiDock context={aiContext} onRefresh={() => void refreshBoard(includeArchived)} />
      ) : null}

      {selectedCardId ? (
        <CardPanel
          cardId={selectedCardId}
          columns={board.columns}
          role={role}
          organizationId={organizationId}
          userId={userId}
          onClose={closeCard}
          boardSync={boardSync}
          onMoveCard={moveCard}
        />
      ) : null}
    </div>
  );
}
