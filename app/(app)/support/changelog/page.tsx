export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">What&apos;s new</h1>
      <article className="mt-8 rounded-xl border border-[var(--topbar-border)] bg-[var(--surface-card)] p-6">
        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">2025-05-21 · v0.1.0</p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">Wave 0 MVP</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          <li>9-column job pipeline with drag-and-drop, search, and filters</li>
          <li>Deep card: property, scope, schedule, estimate, invoice, and activity</li>
          <li>Manual mark paid → archive; move validation gates</li>
          <li>AI copilot on board and card with approval for write actions</li>
          <li>Multi-tenant RLS — your org data only</li>
        </ul>
        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          Full history: see <code className="rounded bg-[var(--surface-rail)] px-1">CHANGELOG.md</code> in the repo.
        </p>
      </article>
    </main>
  );
}
