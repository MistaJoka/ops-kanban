'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

type Props = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  /** Show the control even when not hovered (selection mode or this card selected). */
  visible?: boolean;
  className?: string;
};

/** Card-edge selection toggle — separate from status/menu header controls. */
export function BoardCardSelectionControl({
  checked,
  onToggle,
  label,
  visible = false,
  className,
}: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      className={cn(
        'ops-board-card__select-toggle',
        checked && 'ops-board-card__select-toggle--checked',
        visible && 'ops-board-card__select-toggle--visible',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {checked ? <Check className="size-3" strokeWidth={2.75} aria-hidden /> : null}
    </button>
  );
}
