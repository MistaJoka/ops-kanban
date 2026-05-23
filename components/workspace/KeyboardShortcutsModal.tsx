'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SHORTCUT_ROWS: Array<{ keys: string[]; label: string }> = [
  { keys: ['`'], label: 'Toggle sidebar' },
  { keys: ['/', '⌘K'], label: 'Focus job search (pipeline)' },
  { keys: ['N'], label: 'New job (pipeline)' },
  { keys: ['?'], label: 'Show keyboard shortcuts' },
  { keys: ['Esc'], label: 'Close panel, collapse dock, or dismiss modal' },
  { keys: ['←', '→'], label: 'Jump pipeline groups (full mode, pipeline focused)' },
];

export function KeyboardShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement;
    panelRef.current?.focus();

    return () => {
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="ops-shortcuts-modal" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        tabIndex={-1}
        className="ops-shortcuts-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="shortcuts-title" className="ops-modal-title">
              Keyboard shortcuts
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Workspace navigation and pipeline actions.
            </p>
          </div>
          <button type="button" onClick={onClose} className="ops-icon-btn" aria-label="Close">
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <tbody>
            {SHORTCUT_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-[var(--border-subtle)]">
                <td className="py-2.5 pr-4 align-top">
                  <div className="flex flex-wrap gap-1">
                    {row.keys.map((key) => (
                      <kbd key={key} className="ops-kbd">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 text-[var(--text-secondary)]">{row.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
