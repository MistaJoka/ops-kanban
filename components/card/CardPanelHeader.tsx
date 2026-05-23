'use client';

import { ChevronLeft, MapPin, MoreVertical } from 'lucide-react';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import { CardPanelSummary } from '@/components/card/CardPanelSummary';
import { CATEGORY_ACCENT } from '@/lib/domain/pipeline/types';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { QuoteView } from '@/lib/domain/money/quotes';
import { cn } from '@/lib/utils';

export function CardPanelHeader({
  card,
  columns,
  currentColumn,
  propertyLabel,
  quote,
  invoice,
  canDelete,
  onClose,
  onPatchTitle,
  onPatchPriority,
  onMove,
  onCopyJobLink,
  onCopyPortalLink,
  onArchive,
  onDelete,
}: {
  card: CardDetailView;
  columns: BoardColumnView[];
  currentColumn: BoardColumnView | undefined;
  propertyLabel: string | null;
  quote: QuoteView | null;
  invoice: InvoiceView | null;
  canDelete: boolean;
  onClose: () => void;
  onPatchTitle: (title: string) => void;
  onPatchPriority: (priority: string) => void;
  onMove: (columnId: string) => void;
  onCopyJobLink: () => void;
  onCopyPortalLink: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <header
      className={cn('ops-panel-header', `ops-panel-header--${card.columnCategory}`)}
      style={{ borderLeft: `4px solid ${CATEGORY_ACCENT[card.columnCategory]}` }}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onClose}
          className="ops-icon-btn"
          aria-label="Close panel"
        >
          <ChevronLeft className="size-4" strokeWidth={2.25} />
        </button>
        <div className="min-w-0 flex-1">
          <input
            defaultValue={card.title}
            aria-label="Job title"
            onBlur={(event) => {
              if (event.target.value.trim() && event.target.value !== card.title) {
                onPatchTitle(event.target.value.trim());
              }
            }}
            className="w-full bg-transparent font-display text-xl font-semibold tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-0"
          />
          {propertyLabel ? (
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm leading-snug text-[var(--text-secondary)]">
              <MapPin className="size-3.5 shrink-0 opacity-55" strokeWidth={2.25} aria-hidden />
              <span className="truncate">{propertyLabel}</span>
            </p>
          ) : null}
          {currentColumn ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn('ops-panel-category-pill', `ops-panel-category-pill--${card.columnCategory}`)}
              >
                {card.columnCategory}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                {currentColumn.stateKey.replace(/_/g, ' ')}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
          <details className="relative">
            <summary className="ops-icon-btn cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <MoreVertical className="size-4" strokeWidth={2.25} />
            </summary>
            <div className="ops-menu">
              <button type="button" onClick={onCopyJobLink} className="ops-menu-item">
                Copy job link
              </button>
              <button type="button" onClick={onCopyPortalLink} className="ops-menu-item">
                Copy portal link
              </button>
              <button type="button" onClick={onArchive} className="ops-menu-item">
                Archive job
              </button>
              {canDelete ? (
                <>
                  <div
                    className="my-1 border-t"
                    style={{ borderColor: 'var(--topbar-border)' }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={onDelete}
                    className="ops-menu-item text-[var(--urgent)]"
                  >
                    Delete job
                  </button>
                </>
              ) : null}
            </div>
          </details>
          <select
            value={card.columnId}
            onChange={(event) => onMove(event.target.value)}
            aria-label="Pipeline column"
            className="ops-control h-8 min-w-[7rem] py-0 text-xs"
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
          <select
            value={card.priority}
            onChange={(event) => onPatchPriority(event.target.value)}
            aria-label="Priority"
            className={cn(
              'ops-control h-8 min-w-[5.5rem] py-0 text-xs capitalize',
              card.priority === 'urgent' && 'border-[var(--urgent)] text-[var(--urgent)]',
            )}
          >
            {['low', 'medium', 'high', 'urgent'].map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CardPanelSummary card={card} quote={quote} invoice={invoice} />
    </header>
  );
}
