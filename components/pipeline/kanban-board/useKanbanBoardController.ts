'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

import type { BoardView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { getAssigneeInitials } from '@/lib/domain/cards/boardCardFormatters';
import {
  filterBoardCards,
  getAdvancedFilterLabel,
  BOARD_JOB_TYPES,
  type AdvancedFilterKey,
} from '@/lib/domain/board/boardFilters';
import { isTempCardId } from '@/lib/domain/board/boardOptimistic';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import { nextGroupKey, pickActiveGroup } from '@/lib/domain/pipeline/pickActiveGroup';
import { PIPELINE_GROUP_LABELS, type PipelineGroupKey } from '@/lib/landscaping-full-pipeline';
import type { BoardCardPatch } from '@/components/pipeline/BoardCardMenu';
import type { NewJobFormValues } from '@/components/pipeline/NewJobModal';
import { usePipelineSearch } from '@/components/pipeline/PipelineSearchProvider';
import { useBoardRealtime } from '@/components/pipeline/useBoardRealtime';
import type { BoardSyncHandlers } from '@/components/pipeline/useBoardState';
import { createClientMutationId } from '@/components/pipeline/useOutboundSync';
import { useWorkspaceShortcutsOptional } from '@/components/workspace/WorkspaceShortcutsProvider';
import {
  GROUP_KEYS,
  resolveAdvancedFilter,
  resolveDragOverColumnId,
  resolveReorderTarget,
} from '@/components/pipeline/kanban-board/kanbanDndUtils';

type BoardStateSlice = {
  board: BoardView;
  error: string | null;
  pipelineModePending: boolean;
  refreshBoard: (includeArchived?: boolean) => Promise<void>;
  createCardWithDetails: (input: {
    title: string;
    columnId: string;
    jobType?: string;
    customerName?: string;
    customerAddress?: string;
  }) => Promise<{ ok: true; card: BoardCardView } | { ok: false; message: string }>;
  reorderCard: (
    cardId: string,
    targetColumnId: string,
    insertIndex: number,
  ) => Promise<{ ok: boolean }>;
  togglePipelineMode: (includeArchived: boolean) => Promise<void>;
  boardSync: BoardSyncHandlers;
  hasPendingMutations: () => boolean;
  setLiveConnected: (connected: boolean) => void;
};

export function useKanbanBoardController(
  boardState: BoardStateSlice,
  organizationId: string,
  userId: string | null,
  role: string,
) {
  const {
    board,
    error,
    pipelineModePending,
    refreshBoard,
    createCardWithDetails,
    reorderCard,
    togglePipelineMode,
    boardSync,
    hasPendingMutations,
    setLiveConnected,
  } = boardState;

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMemberView[]>([]);
  const [search, setSearch] = useState('');
  const [filterKey, setFilterKey] = useState<AdvancedFilterKey>('all');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>(BOARD_JOB_TYPES[0]);
  const [aiDockExpanded, setAiDockExpanded] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<PipelineGroupKey | null>(null);
  const pipelineSearch = usePipelineSearch();
  const workspaceShortcuts = useWorkspaceShortcutsOptional();
  const [newJobModal, setNewJobModal] = useState<{ defaultColumnId?: string } | null>(null);
  const [newJobPending, setNewJobPending] = useState(false);
  const [newJobError, setNewJobError] = useState<string | null>(null);
  const [inlinePrompt, setInlinePrompt] = useState<{
    cardId: string;
    message: string;
    actionLabel: string;
    command: string;
  } | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ cardIds: string[] } | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCardId = searchParams.get('card');
  const advancedFilter = useMemo(
    () => resolveAdvancedFilter(filterKey, jobTypeFilter),
    [filterKey, jobTypeFilter],
  );
  const includeArchived = filterKey === 'archived';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const activeCard = useMemo(
    () => (activeCardId ? (board.cards.find((card) => card.id === activeCardId) ?? null) : null),
    [activeCardId, board.cards],
  );

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

  useEffect(() => {
    setSelectedCardIds((current) => {
      const validIds = new Set(board.cards.map((card) => card.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of current) {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [board.cards]);

  const toggleCardSelection = useCallback((cardId: string) => {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }, []);

  const selectAllInColumn = useCallback((_columnId: string, cardIds: string[]) => {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      const allSelected = cardIds.length > 0 && cardIds.every((id) => next.has(id));
      if (allSelected) {
        for (const id of cardIds) next.delete(id);
      } else {
        for (const id of cardIds) next.add(id);
      }
      return next;
    });
  }, []);

  const requestDeleteSelectedInColumn = useCallback((_columnId: string, cardIds: string[]) => {
    if (cardIds.length === 0) return;
    setBulkDeleteConfirm({ cardIds: [...cardIds] });
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteConfirm || bulkDeleteConfirm.cardIds.length === 0) return;

    const cardIds = bulkDeleteConfirm.cardIds;
    const previousCards = boardSync.getBoardSnapshot();
    setBulkDeletePending(true);

    for (const cardId of cardIds) {
      boardSync.removeCard(cardId);
    }

    setSelectedCardIds((current) => {
      const next = new Set(current);
      for (const id of cardIds) next.delete(id);
      return next;
    });

    try {
      if (boardSync.queueEnabled) {
        for (const cardId of cardIds) {
          boardSync.enqueue({
            kind: 'deleteCard',
            clientMutationId: createClientMutationId(),
            cardId,
            rollback: { cards: previousCards },
          });
        }
      } else {
        boardSync.beginOutboundSync();
        for (const cardId of cardIds) {
          const response = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? 'Failed to delete job.');
        }
        boardSync.endOutboundSync(true);
      }

      setBulkDeleteConfirm(null);
      if (selectedCardId && cardIds.includes(selectedCardId)) closeCard();
    } catch (deleteError) {
      if (!boardSync.queueEnabled) {
        await refreshBoard(includeArchived);
        boardSync.endOutboundSync(
          false,
          deleteError instanceof Error ? deleteError.message : 'Failed to delete jobs.',
        );
      }
    } finally {
      setBulkDeletePending(false);
    }
  }, [boardSync, bulkDeleteConfirm, closeCard, includeArchived, refreshBoard, selectedCardId]);

  useEffect(() => {
    void fetch('/api/members')
      .then((response) => response.json())
      .then((payload) => {
        if (payload.data) setMembers(payload.data);
      });
  }, []);

  useBoardRealtime(organizationId, () => void refreshBoard(includeArchived), {
    shouldSkip: hasPendingMutations,
    onConnectionChange: (status) => setLiveConnected(status === 'connected'),
  });

  const visibleColumns = useMemo(
    () =>
      includeArchived
        ? board.columns.filter((column) => column.stateKey === 'archived')
        : board.columns.filter((column) => column.stateKey !== 'archived'),
    [board.columns, includeArchived],
  );

  const filteredCards = useMemo(
    () => filterBoardCards(board.cards, search, advancedFilter, userId),
    [board.cards, search, advancedFilter, userId],
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

  const openNewJobModal = useCallback((columnId?: string) => {
    setNewJobError(null);
    setNewJobModal({ defaultColumnId: columnId });
  }, []);

  const closeNewJobModal = useCallback(() => {
    if (newJobPending) return;
    setNewJobModal(null);
    setNewJobError(null);
  }, [newJobPending]);

  useEffect(() => {
    pipelineSearch?.registerNewJobHandler(openNewJobModal);
    return () => pipelineSearch?.registerNewJobHandler(null);
  }, [openNewJobModal, pipelineSearch]);

  const setBoardScrollRef = useCallback(
    (element: HTMLDivElement | null) => pipelineSearch?.registerBoardScrollRef(element),
    [pipelineSearch],
  );

  const setGroupRef = useCallback(
    (key: PipelineGroupKey, element: HTMLDivElement | null) =>
      pipelineSearch?.registerGroupRef(key, element),
    [pipelineSearch],
  );

  useEffect(() => {
    if (board.pipelineMode !== 'full' || !pipelineSearch) return;
    const root = document.querySelector('.ops-board-surface');
    if (!(root instanceof HTMLDivElement)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const ratios = entries
          .map((entry) => {
            const key = entry.target.getAttribute('data-group-key') as PipelineGroupKey | null;
            if (!key) return null;
            return { key, ratio: entry.intersectionRatio };
          })
          .filter((entry): entry is { key: PipelineGroupKey; ratio: number } => entry !== null);
        const next = pickActiveGroup(ratios);
        if (next) setActiveGroup(next);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const key of GROUP_KEYS) {
      const element = root.querySelector(`[data-group-key="${key}"]`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [board.pipelineMode, columnGroups, pipelineSearch, visibleColumns.length]);

  useEffect(() => {
    if (!workspaceShortcuts) return;
    workspaceShortcuts.registerPipelineHandlers({
      focusSearch: () => pipelineSearch?.focusSearch(),
      openNewJob: () => openNewJobModal(),
      jumpGroup: (direction) => {
        if (board.pipelineMode !== 'full') return;
        const current = activeGroup ?? GROUP_KEYS[0];
        const next = nextGroupKey(current, direction);
        setActiveGroup(next);
        pipelineSearch?.scrollToGroup(next);
      },
      handleEscape: () => {
        if (aiCopilotOpen) {
          setAiCopilotOpen(false);
          return true;
        }
        if (aiDockExpanded) {
          setAiDockExpanded(false);
          return true;
        }
        if (selectedCardId) {
          closeCard();
          return true;
        }
        if (newJobModal) {
          closeNewJobModal();
          return true;
        }
        if (search.trim()) {
          setSearch('');
          document.querySelector<HTMLInputElement>('input[aria-label="Search jobs"]')?.blur();
          return true;
        }
        return false;
      },
    });
    return () => workspaceShortcuts.registerPipelineHandlers(null);
  }, [
    activeGroup,
    aiCopilotOpen,
    aiDockExpanded,
    board.pipelineMode,
    closeCard,
    closeNewJobModal,
    newJobModal,
    openNewJobModal,
    pipelineSearch,
    search,
    selectedCardId,
    workspaceShortcuts,
  ]);

  useEffect(() => {
    if (board.pipelineMode !== 'full' || !pipelineSearch) return;
    pipelineSearch.registerGroupJumpHandler((direction) => {
      const current = activeGroup ?? GROUP_KEYS[0];
      const next = nextGroupKey(current, direction);
      setActiveGroup(next);
      pipelineSearch.scrollToGroup(next);
    });
    return () => pipelineSearch.registerGroupJumpHandler(null);
  }, [activeGroup, board.pipelineMode, pipelineSearch]);

  useEffect(() => {
    if (board.pipelineMode !== 'full') setActiveGroup(null);
  }, [board.pipelineMode]);

  const handleNewJobSubmit = useCallback(
    async (values: NewJobFormValues, openAfterCreate: boolean) => {
      setNewJobPending(true);
      setNewJobError(null);
      const result = await createCardWithDetails({
        title: values.title,
        columnId: values.columnId,
        jobType: values.jobType || undefined,
        customerName: values.customerName || undefined,
        customerAddress: values.customerAddress || undefined,
      });
      setNewJobPending(false);
      if (!result.ok) {
        setNewJobError(result.message);
        return;
      }
      setNewJobModal(null);
      if (openAfterCreate) openCard(result.card.id);
    },
    [createCardWithDetails, openCard],
  );

  const setMoveInlinePrompt = useCallback((cardId: string, stateKey: string) => {
    if (['estimating', 'site_visit'].includes(stateKey)) {
      setInlinePrompt({
        cardId,
        message: 'Job moved — draft an estimate from scope notes?',
        actionLabel: 'AI draft estimate',
        command: 'Draft estimate from scope notes',
      });
    } else if (['complete', 'invoice_prep'].includes(stateKey)) {
      setInlinePrompt({
        cardId,
        message: 'Job complete — create an invoice draft?',
        actionLabel: 'Create invoice',
        command: 'Create invoice draft for this job',
      });
    } else {
      setInlinePrompt(null);
    }
  }, []);

  const handleMoveCard = useCallback(
    async (cardId: string, targetColumnId: string) => {
      const targetColumn = board.columns.find((column) => column.id === targetColumnId);
      const columnCards = board.cards
        .filter((card) => card.columnId === targetColumnId && card.id !== cardId)
        .sort((a, b) => a.position - b.position);
      const result = await reorderCard(cardId, targetColumnId, columnCards.length);
      if (result.ok && targetColumn) setMoveInlinePrompt(cardId, targetColumn.stateKey);
    },
    [board.cards, board.columns, reorderCard, setMoveInlinePrompt],
  );

  const handlePatchCard = useCallback(
    async (cardId: string, patch: BoardCardPatch) => {
      const existing = board.cards.find((card) => card.id === cardId);
      if (!existing || isTempCardId(cardId)) return;

      const optimisticPatch: Partial<BoardCardView> = {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
      };
      if (patch.assignedTo !== undefined) {
        const member = members.find((item) => item.userId === patch.assignedTo);
        optimisticPatch.assignedTo = patch.assignedTo;
        optimisticPatch.assigneeName = member?.fullName ?? null;
        optimisticPatch.assigneeInitials = getAssigneeInitials(member?.fullName);
      }

      boardSync.patchCard(cardId, optimisticPatch);
      const apiPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) apiPatch.title = patch.title;
      if (patch.dueDate !== undefined) apiPatch.dueDate = patch.dueDate;
      if (patch.assignedTo !== undefined) apiPatch.assignedTo = patch.assignedTo;

      if (boardSync.queueEnabled) {
        boardSync.enqueue({
          kind: 'patchCard',
          clientMutationId: createClientMutationId(),
          cardId,
          patch: apiPatch,
          rollback: { cards: board.cards },
        });
        return;
      }

      boardSync.beginOutboundSync();
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPatch),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Failed to save job.');
        boardSync.syncFromDetail(payload.data);
        boardSync.endOutboundSync(true);
      } catch (patchError) {
        boardSync.patchCard(cardId, existing);
        boardSync.endOutboundSync(
          false,
          patchError instanceof Error ? patchError.message : 'Failed to save job.',
        );
      }
    },
    [board.cards, boardSync, members],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const overId = event.over ? String(event.over.id) : null;
      if (!overId) {
        setDragOverColumnId(null);
        return;
      }
      setDragOverColumnId(resolveDragOverColumnId(board.columns, cardsByColumn, overId));
    },
    [board.columns, cardsByColumn],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;
      setActiveCardId(null);
      setDragOverColumnId(null);
      if (!overId) return;

      const target = resolveReorderTarget(board.columns, cardsByColumn, activeId, overId);
      if (!target) return;

      const targetColumn = board.columns.find((column) => column.id === target.targetColumnId);
      const result = await reorderCard(activeId, target.targetColumnId, target.insertIndex);
      if (result.ok && targetColumn) {
        const priorStateKey = board.cards.find((card) => card.id === activeId)?.stateKey;
        if (priorStateKey !== targetColumn.stateKey) {
          setMoveInlinePrompt(activeId, targetColumn.stateKey);
        }
      }
    },
    [board.columns, board.cards, cardsByColumn, reorderCard, setMoveInlinePrompt],
  );

  const handleDragCancel = useCallback(() => {
    setActiveCardId(null);
    setDragOverColumnId(null);
  }, []);

  const handleArchiveCard = useCallback(
    async (cardId: string) => {
      const archivedColumn = board.columns.find((column) => column.stateKey === 'archived');
      if (!archivedColumn) return;
      const columnCards = board.cards
        .filter((card) => card.columnId === archivedColumn.id && card.id !== cardId)
        .sort((a, b) => a.position - b.position);
      await reorderCard(cardId, archivedColumn.id, columnCards.length);
    },
    [board.cards, board.columns, reorderCard],
  );

  const runInlineAi = useCallback(async () => {
    if (!inlinePrompt || !userId) return;
    const response = await fetch('/api/ai/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: inlinePrompt.command,
        context: {
          page: 'card',
          organizationId,
          userId,
          role,
          selectedCardId: inlinePrompt.cardId,
          mode: 'draft',
        },
      }),
    });
    if (response.ok) {
      const cardId = inlinePrompt.cardId;
      setInlinePrompt(null);
      void refreshBoard(includeArchived);
      openCard(cardId);
    }
  }, [inlinePrompt, userId, organizationId, role, refreshBoard, includeArchived, openCard]);

  const aiContext = userId
    ? {
        page: (selectedCardId ? 'card' : 'board') as 'board' | 'card',
        organizationId,
        userId,
        role,
        pipelineMode: board.pipelineMode,
        ...(selectedCardId ? { selectedCardId } : {}),
      }
    : null;

  const toolbarAiContext = aiContext
    ? { ...aiContext, page: 'board' as const, selectedCardId: undefined }
    : null;

  const activeCardCount = useMemo(
    () => board.cards.filter((card) => card.stateKey !== 'archived').length,
    [board.cards],
  );

  const showNoMatches = filteredCards.length === 0 && activeCardCount > 0;
  const showEmptyBoard = activeCardCount === 0 && filterKey === 'all' && !search.trim();
  const filterLabel = getAdvancedFilterLabel(advancedFilter).toLowerCase();

  const boardHealth = useMemo(
    () => ({
      jobCount: filteredCards.length,
      overdueCount: filteredCards.filter((card) => card.isOverdue).length,
      unassignedCount: filteredCards.filter(
        (card) => !card.assigneeInitials && card.stateKey !== 'archived',
      ).length,
      balanceDueCount: filteredCards.filter((card) => card.moneyBadge === 'balance_due').length,
      stageCount: visibleColumns.length,
      pipelineMode: board.pipelineMode,
    }),
    [filteredCards, visibleColumns.length, board.pipelineMode],
  );

  return {
    error,
    pipelineModePending,
    board,
    boardSync,
    includeArchived,
    refreshBoard: () => refreshBoard(includeArchived),
    togglePipelineMode: () => void togglePipelineMode(includeArchived),
    sensors,
    search,
    setSearch,
    filterKey,
    setFilterKey,
    jobTypeFilter,
    setJobTypeFilter,
    aiDockExpanded,
    setAiDockExpanded,
    aiCopilotOpen,
    setAiCopilotOpen,
    activeGroup,
    setActiveGroup,
    pipelineSearch,
    newJobModal,
    newJobPending,
    newJobError,
    inlinePrompt,
    setInlinePrompt,
    selectedCardIds,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    bulkDeletePending,
    selectedCardId,
    openCard,
    closeCard,
    openNewJobModal,
    closeNewJobModal,
    confirmBulkDelete,
    visibleColumns,
    filteredCards,
    cardsByColumn,
    columnGroups,
    activeCard,
    activeCardId,
    dragOverColumnId,
    members,
    handleNewJobSubmit,
    handleMoveCard,
    handlePatchCard,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    handleArchiveCard,
    runInlineAi,
    aiContext,
    toolbarAiContext,
    showNoMatches,
    showEmptyBoard,
    filterLabel,
    boardHealth,
    setBoardScrollRef,
    setGroupRef,
    toggleCardSelection,
    selectAllInColumn,
    requestDeleteSelectedInColumn,
  };
}
