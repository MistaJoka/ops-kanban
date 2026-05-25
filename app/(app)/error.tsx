'use client';

import { useEffect } from 'react';

import { captureClientError } from '@/lib/ops/captureError';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientError(error, { surface: 'app-error' });
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Something went wrong</h1>
      <p className="max-w-md text-sm text-[var(--text-secondary)]" role="alert">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
