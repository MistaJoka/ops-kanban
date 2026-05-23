'use client';

import { Sparkles } from 'lucide-react';

import { CreateMenu } from '@/components/workspace/CreateMenu';
import { BoardSyncStatusIndicator } from '@/components/pipeline/BoardSyncStatusIndicator';
import {
  ADVANCED_FILTER_LABELS,
  BOARD_JOB_TYPES,
  type AdvancedFilterKey,
} from '@/lib/domain/board/boardFilters';
import type { OrgRole } from '@/lib/domain/auth/roles';
import type { BoardSyncStatus } from '@/lib/domain/board/boardSyncStatus';

type Props = {
  filteredCount: number;
  visibleColumnCount: number;
  pipelineMode: 'compact' | 'full';
  syncStatus: BoardSyncStatus;
  onRetrySync: () => void;
  pipelineModePending: boolean;
  onTogglePipelineMode: () => void;
  filterKey: AdvancedFilterKey;
  onFilterKeyChange: (key: AdvancedFilterKey) => void;
  jobTypeFilter: string;
  onJobTypeFilterChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchInputRef: (element: HTMLInputElement | null) => void;
  showAiButton: boolean;
  onOpenAiCopilot: () => void;
  role: OrgRole;
  onCreateJob: (columnId?: string) => void;
  error: string | null;
};

export function KanbanBoardToolbar({
  filteredCount,
  visibleColumnCount,
  pipelineMode,
  syncStatus,
  onRetrySync,
  pipelineModePending,
  onTogglePipelineMode,
  filterKey,
  onFilterKeyChange,
  jobTypeFilter,
  onJobTypeFilterChange,
  search,
  onSearchChange,
  searchInputRef,
  showAiButton,
  onOpenAiCopilot,
  role,
  onCreateJob,
  error,
}: Props) {
  return (
    <div className="ops-toolbar">
      <div className="ops-toolbar-row">
        <div>
          <h1 className="ops-page-title">Job Pipeline</h1>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            <span className="font-medium tabular-nums text-[var(--text-primary)]">
              {filteredCount}
            </span>{' '}
            jobs · {visibleColumnCount} stages
            {pipelineMode === 'full' ? ' · full view' : ' · compact'}
          </p>
          <div className="mt-2">
            <BoardSyncStatusIndicator status={syncStatus} onRetry={onRetrySync} />
          </div>
        </div>
        <div className="ops-toolbar-actions">
          <button
            type="button"
            disabled={pipelineModePending}
            onClick={onTogglePipelineMode}
            className="ops-btn-secondary"
          >
            {pipelineMode === 'full' ? 'Compact' : 'Full (19)'}
          </button>
          <select
            value={filterKey}
            onChange={(event) => onFilterKeyChange(event.target.value as AdvancedFilterKey)}
            aria-label="Filter jobs"
            className="ops-control"
          >
            {(Object.keys(ADVANCED_FILTER_LABELS) as AdvancedFilterKey[]).map((key) => (
              <option key={key} value={key}>
                {ADVANCED_FILTER_LABELS[key]}
              </option>
            ))}
          </select>
          {filterKey === 'job_type' ? (
            <select
              value={jobTypeFilter}
              onChange={(event) => onJobTypeFilterChange(event.target.value)}
              aria-label="Filter by job type"
              className="ops-control"
            >
              {BOARD_JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          ) : null}
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search jobs…"
            aria-label="Search jobs"
            className="ops-control min-w-[200px]"
          />
          {showAiButton ? (
            <button
              type="button"
              onClick={onOpenAiCopilot}
              className="ops-btn-secondary inline-flex items-center gap-1.5"
              aria-label="Open AI copilot"
              aria-haspopup="dialog"
            >
              <Sparkles className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
              <span>AI</span>
            </button>
          ) : null}
          <CreateMenu role={role} onCreateJob={onCreateJob} disabled={pipelineModePending} />
        </div>
      </div>
      {error ? (
        <p role="alert" aria-live="polite" className="ops-alert-error mt-3">
          {error}
        </p>
      ) : null}
    </div>
  );
}
