import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Page not found</h1>
      <p className="max-w-md text-sm text-[var(--text-secondary)]">
        The page you requested does not exist or may have been moved.
      </p>
      <Link
        href="/pipeline"
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
      >
        Go to pipeline
      </Link>
    </main>
  );
}
