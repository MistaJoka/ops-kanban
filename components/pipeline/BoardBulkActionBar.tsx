'use client';

import { Trash2, X } from 'lucide-react';

type Props = {
  selectedCount: number;
  visibleCount: number;
  allVisibleSelected: boolean;
  pending?: boolean;
  onDelete: () => void;
  onClear: () => void;
  onSelectAllVisible: () => void;
  onDeselectAllVisible: () => void;
};

export function BoardBulkActionBar({
  selectedCount,
  visibleCount,
  allVisibleSelected,
  pending = false,
  onDelete,
  onClear,
  onSelectAllVisible,
  onDeselectAllVisible,
}: Props) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="ops-bulk-bar" role="toolbar" aria-label="Bulk job actions">
      <div className="ops-bulk-bar__summary">
        <span className="ops-bulk-bar__count">{selectedCount}</span>
        <span className="ops-bulk-bar__label">
          job{selectedCount === 1 ? '' : 's'} selected
        </span>
      </div>

      <div className="ops-bulk-bar__actions">
        {visibleCount > 0 ? (
          <button
            type="button"
            className="ops-bulk-bar__btn"
            disabled={pending}
            onClick={allVisibleSelected ? onDeselectAllVisible : onSelectAllVisible}
          >
            {allVisibleSelected ? 'Deselect visible' : 'Select visible'}
          </button>
        ) : null}
        <button
          type="button"
          className="ops-bulk-bar__btn ops-bulk-bar__btn--danger"
          disabled={pending}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" strokeWidth={2.25} aria-hidden />
          Delete
        </button>
        <button
          type="button"
          className="ops-bulk-bar__btn ops-bulk-bar__btn--icon"
          disabled={pending}
          aria-label="Clear selection"
          title="Clear selection"
          onClick={onClear}
        >
          <X className="size-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
