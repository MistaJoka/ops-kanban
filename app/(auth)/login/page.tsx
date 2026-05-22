import Link from 'next/link';

import { LoginForm } from '@/components/auth/AuthForms';

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-[var(--topbar-border)] bg-[var(--surface-card)] p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        OpsBoard AI
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Sign in</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Access your landscaping job pipeline.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm text-[var(--text-secondary)]">
        Need an account?{' '}
        <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
