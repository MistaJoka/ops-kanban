export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Contact support</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        We respond within one business day during the MVP pilot.
      </p>
      <form className="mt-8 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Name</span>
          <input
            type="text"
            className="w-full rounded-lg border border-[var(--topbar-border)] bg-white px-3 py-2"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Email</span>
          <input
            type="email"
            className="w-full rounded-lg border border-[var(--topbar-border)] bg-white px-3 py-2"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Message</span>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-[var(--topbar-border)] bg-white px-3 py-2"
          />
        </label>
        <button
          type="button"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Send message
        </button>
      </form>
    </main>
  );
}
