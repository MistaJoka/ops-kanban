'use client';

import { useState } from 'react';

export function MovePromptModal({
  type,
  message,
  onCancel,
  onConfirm,
}: {
  type: 'schedule' | 'reason' | 'error';
  message: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div className="ops-modal-overlay" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-prompt-title"
        className="ops-modal max-w-md"
      >
        <h2 id="move-prompt-title" className="ops-modal-title">
          {type === 'schedule'
            ? 'Schedule required'
            : type === 'reason'
              ? 'Reason required'
              : 'Move blocked'}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>

        {type === 'schedule' ? (
          <input
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-label="Scheduled start"
            className="field-input mt-4"
          />
        ) : null}

        {type === 'reason' ? (
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={3}
            placeholder="Why skip columns?"
            aria-label="Skip reason"
            className="field-input mt-4"
          />
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="ops-btn-secondary">
            Cancel
          </button>
          {type !== 'error' ? (
            <button
              type="button"
              disabled={!value.trim()}
              onClick={() =>
                onConfirm(
                  type === 'schedule' && value
                    ? new Date(value).toISOString()
                    : value.trim(),
                )
              }
              className="ops-btn-primary"
            >
              Continue
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
