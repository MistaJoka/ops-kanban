'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

import { AiDock, type AiClientContext } from '@/components/ai/AiDock';
import { cn } from '@/lib/utils';

export function AiCopilotPopover({
  open,
  onClose,
  context,
  onRefresh,
  suggestedChips,
  autoFocus = false,
}: {
  open: boolean;
  onClose: () => void;
  context: AiClientContext;
  onRefresh?: () => void;
  suggestedChips?: string[];
  autoFocus?: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        className="ops-panel-overlay z-[70]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ops copilot"
        className={cn(
          'panel-slide-in fixed z-[71] flex max-h-[min(85vh,560px)] flex-col overflow-hidden border bg-[var(--surface-rail)]',
          'inset-x-0 bottom-0 rounded-t-[var(--radius-card)]',
          'md:inset-x-auto md:bottom-4 md:right-4 md:w-[min(calc(100vw-2rem),420px)] md:rounded-[var(--radius-card)]',
        )}
        style={{
          borderColor: 'var(--topbar-border)',
          boxShadow: 'var(--shadow-lift)',
        }}
      >
        <div className="flex items-center justify-end border-b px-2 py-1.5" style={{ borderColor: 'var(--topbar-border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="ops-icon-btn"
            aria-label="Close copilot"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AiDock
            context={context}
            onRefresh={onRefresh}
            compact
            suggestedChips={suggestedChips}
            autoFocus={autoFocus}
          />
        </div>
      </div>
    </>
  );
}
