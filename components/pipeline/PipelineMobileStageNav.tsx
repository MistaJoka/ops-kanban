'use client';

import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { cn } from '@/lib/utils';

export function PipelineMobileStageNav({
  columns,
  cardsByColumn,
  activeColumnId,
  onSelectColumn,
}: {
  columns: BoardColumnView[];
  cardsByColumn: Map<string, BoardCardView[]>;
  activeColumnId: string | null;
  onSelectColumn: (columnId: string) => void;
}) {
  if (columns.length <= 1) {
    return null;
  }

  return (
    <nav className="ops-mobile-stage-nav md:hidden" aria-label="Pipeline stages">
      <div className="ops-mobile-stage-nav__track">
        {columns.map((column) => {
          const count = cardsByColumn.get(column.id)?.length ?? 0;
          const isActive = activeColumnId === column.id;

          return (
            <button
              key={column.id}
              type="button"
              data-column-nav={column.id}
              onClick={() => onSelectColumn(column.id)}
              className={cn(
                'ops-mobile-stage-nav__chip',
                isActive && 'ops-mobile-stage-nav__chip--active',
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="truncate">{column.name}</span>
              {count > 0 ? (
                <span className="ops-mobile-stage-nav__count" aria-hidden>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
