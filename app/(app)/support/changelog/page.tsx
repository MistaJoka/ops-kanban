import { ChangelogTimeline } from '@/components/support/ChangelogTimeline';

export default function ChangelogPage() {
  return (
    <main className="ops-page-shell max-w-3xl">
      <header>
        <h1 className="ops-page-title text-2xl">What&apos;s new</h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Major product updates with release date and time. Newest first.
        </p>
      </header>

      <ChangelogTimeline />

      <p className="mt-8 text-xs text-[var(--text-tertiary)]">
        Full engineering history lives in{' '}
        <code className="rounded bg-[var(--surface-rail)] px-1.5 py-0.5">CHANGELOG.md</code> and{' '}
        <code className="rounded bg-[var(--surface-rail)] px-1.5 py-0.5">docs/roadmap/DEVELOPMENT_LOG.md</code>.
      </p>
    </main>
  );
}
