'use server';

import { redirect } from 'next/navigation';

import { bootstrapWorkspace } from '@/lib/domain/bootstrap/signupBootstrap';
import { createClient } from '@/lib/db/supabase/server';
import { createServiceClient } from '@/lib/db/supabase/service';

export type AuthActionState = {
  error?: string;
};

function defaultOrganizationName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return 'My Landscaping';
  }

  return trimmed.endsWith('s') ? `${trimmed}' Landscaping` : `${trimmed}'s Landscaping`;
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();
  const organizationName =
    String(formData.get('organizationName') ?? '').trim() || defaultOrganizationName(fullName);

  if (!email || !password || !fullName) {
    return { error: 'Email, password, and full name are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Signup succeeded but no user was returned.' };
  }

  if (!data.session) {
    return {
      error: 'Check your email to confirm your account, then sign in.',
    };
  }

  try {
    const service = createServiceClient();
    await bootstrapWorkspace(service, {
      userId: data.user.id,
      email,
      fullName,
      organizationName,
    });
  } catch (bootstrapError) {
    const message =
      bootstrapError instanceof Error ? bootstrapError.message : 'Workspace bootstrap failed.';
    return { error: message };
  }

  redirect('/pipeline');
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Sign in failed.' };
  }

  const service = createServiceClient();
  const { data: membership } = await service
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!membership) {
    const fullName =
      typeof data.user.user_metadata?.full_name === 'string'
        ? data.user.user_metadata.full_name
        : email.split('@')[0];

    await bootstrapWorkspace(service, {
      userId: data.user.id,
      email: data.user.email ?? email,
      fullName,
      organizationName: defaultOrganizationName(fullName),
    });
  }

  redirect('/pipeline');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
