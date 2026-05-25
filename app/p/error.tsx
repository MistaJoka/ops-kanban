'use client';

import { useEffect } from 'react';

import { captureClientError } from '@/lib/ops/captureError';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientError(error, { surface: 'portal-error' });
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Unable to load portal</h1>
      <p className="max-w-md text-sm text-[var(--text-secondary)]" role="alert">
        {error.message || 'Something went wrong while loading this customer portal.'}
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
