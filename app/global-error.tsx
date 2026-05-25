'use client';

import { useEffect } from 'react';

import { captureClientError } from '@/lib/ops/captureError';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientError(error, { surface: 'global-error' });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-sm text-neutral-600" role="alert">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
