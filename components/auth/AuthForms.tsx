'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { signInAction, signUpAction, type AuthActionState } from '@/lib/domain/auth/actions';

const initialState: AuthActionState = {};

function AuthForm({
  action,
  submitLabel,
  children,
}: {
  action: (prevState: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state.error ? (
        <p className="rounded-lg border border-[var(--urgent)] bg-white px-3 py-2 text-sm text-[var(--urgent)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Working…' : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  type = 'text',
  name,
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={id} className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--text-primary)]">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-lg border border-[var(--topbar-border)] bg-white px-3 py-2 text-[var(--text-primary)] outline-none ring-[var(--accent)] focus:ring-2"
      />
    </label>
  );
}

export function LoginForm() {
  return (
    <AuthForm action={signInAction} submitLabel="Sign in">
      <Field id="email" label="Email" name="email" type="email" autoComplete="email" />
      <Field
        id="password"
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
      />
    </AuthForm>
  );
}

export function SignUpForm() {
  return (
    <AuthForm action={signUpAction} submitLabel="Create account">
      <Field id="fullName" label="Full name" name="fullName" autoComplete="name" />
      <Field
        id="organizationName"
        label="Business name"
        name="organizationName"
        required={false}
      />
      <Field id="email" label="Email" name="email" type="email" autoComplete="email" />
      <Field
        id="password"
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
      />
    </AuthForm>
  );
}
