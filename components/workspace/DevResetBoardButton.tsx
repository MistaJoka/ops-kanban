'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DevResetBoardButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const resetBoard = async () => {
    const confirmed = window.confirm(
      'Delete all jobs and customers in the dev workspace? Columns and settings are kept.',
    );

    if (!confirmed) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch('/api/dev/reset-board', { method: 'POST' });
      const payload = (await response.json()) as {
        data?: { deletedCards: number; deletedCustomers: number };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to reset board.');
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset board.';
      window.alert(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void resetBoard()}
      disabled={pending}
      className="rounded-md border border-[var(--accent)]/30 bg-[var(--surface-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-panel)]/80 disabled:opacity-60"
    >
      {pending ? 'Resetting…' : 'Reset board'}
    </button>
  );
}
