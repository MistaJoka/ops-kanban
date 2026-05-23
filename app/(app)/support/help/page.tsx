export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Help & guides</h1>
      <div className="mt-6 space-y-8 text-sm leading-7 text-[var(--text-secondary)]">
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Run your pipeline</h2>
          <p>
            Drag cards between columns as work progresses, or use the <strong>+</strong> create menu in the
            toolbar or <strong>+ Add job</strong> on a column.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create a job</h2>
          <p>
            Use a clear title (customer or property plus service). Add property, scope, and job type
            in the card panel as details become available.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Estimates & invoices</h2>
          <p>
            Build estimates on the Estimate tab before moving to estimate sent. Create invoices from
            approved estimates on the Money tab.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ops copilot dock</h2>
          <p>
            On the pipeline, Ops copilot lives in a bottom dock — click the bar to expand it and ask
            about today&apos;s jobs, draft estimates, or analyze pipeline health. When a job panel is
            open, the dock switches to card context automatically.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Keyboard shortcuts</h2>
          <p>
            Press <strong>?</strong> anywhere in the workspace to open the shortcuts list. On the
            pipeline: <strong>/</strong> or <strong>⌘K</strong> focuses job search, <strong>N</strong>{' '}
            opens New job, <strong>`</strong> toggles the sidebar, and arrow keys jump pipeline groups
            in full (19-column) mode.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Roles</h2>
          <p>
            Owners and managers can skip certain columns with a reason. Workers move one column at a
            time. Viewers are read-only.
          </p>
        </section>
      </div>
    </main>
  );
}
