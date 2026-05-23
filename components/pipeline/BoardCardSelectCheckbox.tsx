'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export function BoardCardSelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate, checked]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      onChange={() => onChange()}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={label}
      className={cn('ops-board-card__select', className)}
    />
  );
}
