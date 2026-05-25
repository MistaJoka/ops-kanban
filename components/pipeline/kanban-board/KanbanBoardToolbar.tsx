'use client';

import { Bot, Search, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { CreateMenu } from '@/components/workspace/CreateMenu';
import { NotificationsBell } from '@/components/ai/NotificationsBell';
import { BoardSyncStatusIndicator } from '@/components/pipeline/BoardSyncStatusIndicator';
import { usePipelineSearch } from '@/components/pipeline/PipelineSearchProvider';
import {
  ADVANCED_FILTER_LABELS,
  BOARD_JOB_TYPES,
  type AdvancedFilterKey,
} from '@/lib/domain/board/boardFilters';
import type { OrgRole } from '@/lib/domain/auth/roles';
import type { BoardSyncStatus } from '@/lib/domain/board/boardSyncStatus';
import { cn } from '@/lib/utils';

export type BoardHealthSummary = {
  jobCount: number;
  totalActiveCount: number;
  overdueCount: number;
  unassignedCount: number;
  balanceDueCount: number;
  scheduledThisWeekCount: number;
  assignedToMeCount: number;
  stageCount: number;
  pipelineMode: 'compact' | 'full';
};

const PRIMARY_FILTER_CHIPS: Array<{
  key: AdvancedFilterKey;
  label: string;
  countKey: keyof BoardHealthSummary;
}> = [
  { key: 'all', label: 'All', countKey: 'totalActiveCount' },
  { key: 'overdue', label: 'Overdue', countKey: 'overdueCount' },
  { key: 'assigned_to_me', label: 'Mine', countKey: 'assignedToMeCount' },
  { key: 'unassigned', label: 'Unassigned', countKey: 'unassignedCount' },
  { key: 'balance_due', label: 'Balance due', countKey: 'balanceDueCount' },
  { key: 'scheduled_this_week', label: 'This week', countKey: 'scheduledThisWeekCount' },
];

type Props = {
  health: BoardHealthSummary;
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
  showAiButton: boolean;
  onOpenAiCopilot: () => void;
  role: OrgRole;
  onCreateJob: (columnId?: string) => void;
  error: string | null;
};

export function KanbanBoardToolbar({
  health,
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
  showAiButton,
  onOpenAiCopilot,
  role,
  onCreateJob,
  error,
}: Props) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const pipelineSearch = usePipelineSearch();

  useEffect(() => {
    pipelineSearch?.registerSearchInput(searchInputRef.current);
    return () => pipelineSearch?.registerSearchInput(null);
  }, [pipelineSearch]);

  return (
    <div className="ops-toolbar ops-toolbar--command">
      <div className="ops-toolbar-command-head">
        <h1 className="ops-page-title ops-page-title--compact">Job Pipeline</h1>
        <div className="ops-toolbar-health" role="status" aria-label="Board health summary">
          <span className="ops-toolbar-health__stat">
            <span className="ops-toolbar-health__value">{health.jobCount}</span>
            <span className="ops-toolbar-health__label">jobs</span>
          </span>
          <span className="ops-toolbar-health__sep" aria-hidden>
            ·
          </span>
          <span className="ops-toolbar-health__stat">
            <span className="ops-toolbar-health__value">{health.stageCount}</span>
            <span className="ops-toolbar-health__label">stages</span>
          </span>
          {health.overdueCount > 0 ? (
            <>
              <span className="ops-toolbar-health__sep" aria-hidden>
                ·
              </span>
              <span className="ops-toolbar-health__stat ops-toolbar-health__stat--alert">
                <span className="ops-toolbar-health__value">{health.overdueCount}</span>
                <span className="ops-toolbar-health__label">overdue</span>
              </span>
            </>
          ) : null}
          {health.unassignedCount > 0 ? (
            <>
              <span className="ops-toolbar-health__sep" aria-hidden>
                ·
              </span>
              <span className="ops-toolbar-health__stat ops-toolbar-health__stat--warn">
                <span className="ops-toolbar-health__value">{health.unassignedCount}</span>
                <span className="ops-toolbar-health__label">unassigned</span>
              </span>
            </>
          ) : null}
          {health.balanceDueCount > 0 ? (
            <>
              <span className="ops-toolbar-health__sep" aria-hidden>
                ·
              </span>
              <span className="ops-toolbar-health__stat ops-toolbar-health__stat--money">
                <span className="ops-toolbar-health__value">{health.balanceDueCount}</span>
                <span className="ops-toolbar-health__label">due</span>
              </span>
            </>
          ) : null}
          <span className="ops-toolbar-health__mode">
            {health.pipelineMode === 'full' ? 'Full view' : 'Compact'}
          </span>
        </div>
      </div>

      <div className="ops-toolbar-command-bar">
        <div className="ops-filter-chips" role="toolbar" aria-label="Filter jobs">
          {PRIMARY_FILTER_CHIPS.map((chip) => {
            const count = health[chip.countKey] as number;

            return (
              <button
                key={chip.key}
                type="button"
                className={cn('ops-filter-chip', filterKey === chip.key && 'ops-filter-chip--active')}
                onClick={() => onFilterKeyChange(chip.key)}
              >
                {chip.label}
                {(chip.key === 'all' || count > 0) && (
                  <span className="ops-filter-chip__count">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="ops-toolbar-actions">
          {error ? (
            <p role="alert" aria-live="polite" className="ops-toolbar-error" title={error}>
              {error}
            </p>
          ) : null}

          <BoardSyncStatusIndicator status={syncStatus} onRetry={onRetrySync} />

          <NotificationsBell />

          <button
            type="button"
            disabled={pipelineModePending}
            onClick={onTogglePipelineMode}
            className="ops-btn-secondary hidden sm:inline-flex"
          >
            {health.pipelineMode === 'full' ? 'Compact' : 'Full (19)'}
          </button>

          <details className="relative hidden sm:block">
            <summary className="ops-btn-secondary cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              More filters
            </summary>
            <div className="ops-menu ops-menu--portal right-0 top-full mt-1 min-w-[180px]">
              <button
                type="button"
                role="menuitem"
                className={cn('ops-menu-item', filterKey === 'archived' && 'font-semibold')}
                onClick={() => onFilterKeyChange('archived')}
              >
                {ADVANCED_FILTER_LABELS.archived}
              </button>
              <button
                type="button"
                role="menuitem"
                className={cn('ops-menu-item', filterKey === 'job_type' && 'font-semibold')}
                onClick={() => onFilterKeyChange('job_type')}
              >
                {ADVANCED_FILTER_LABELS.job_type}
              </button>
              <button
                type="button"
                role="menuitem"
                className={cn('ops-menu-item', filterKey === 'scheduled' && 'font-semibold')}
                onClick={() => onFilterKeyChange('scheduled')}
              >
                {ADVANCED_FILTER_LABELS.scheduled}
              </button>
            </div>
          </details>

          {filterKey === 'job_type' ? (
            <select
              value={jobTypeFilter}
              onChange={(event) => onJobTypeFilterChange(event.target.value)}
              aria-label="Filter by job type"
              className="ops-control ops-control--filter"
            >
              {BOARD_JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          ) : null}

          <div className="ops-search-field">
            <Search className="ops-search-field__icon size-3.5" strokeWidth={2.25} aria-hidden />
            <input
              ref={(element) => {
                searchInputRef.current = element;
                pipelineSearch?.registerSearchInput(element);
              }}
              id="pipeline-job-search"
              type="text"
              inputMode="search"
              role="searchbox"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search jobs…"
              aria-label="Search jobs"
              className="ops-search-field__input"
            />
            <kbd className="ops-search-field__kbd hidden lg:inline-flex" aria-hidden>
              /
            </kbd>
          </div>

          {showAiButton ? (
            <button
              type="button"
              onClick={onOpenAiCopilot}
              className="ops-btn-secondary inline-flex items-center gap-1"
              aria-label="Open Ops copilot"
              aria-haspopup="dialog"
            >
              <Sparkles className="size-3.5 shrink-0 opacity-80" strokeWidth={2.25} aria-hidden />
              <span className="hidden sm:inline">Copilot</span>
              <Bot className="size-3.5 shrink-0 sm:hidden" strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}

          <CreateMenu role={role} onCreateJob={onCreateJob} disabled={pipelineModePending} />
        </div>
      </div>
    </div>
  );
}
