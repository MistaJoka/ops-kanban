import Link from 'next/link';

import { SignUpForm } from '@/components/auth/AuthForms';

export default function SignUpPage() {
  return (
    <div className="rounded-xl border border-[var(--topbar-border)] bg-[var(--surface-card)] p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        OpsBoard AI
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Create account</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        We&apos;ll set up your organization and default 9-column pipeline. No sample jobs.
      </p>
      <div className="mt-6">
        <SignUpForm />
      </div>
      <p className="mt-6 text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
