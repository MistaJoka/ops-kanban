import { redirect } from 'next/navigation';

import { isAuthDisabled } from '@/lib/env/authBypass';
import { createClient } from '@/lib/db/supabase/server';

export default async function HomePage() {
  if (isAuthDisabled()) {
    redirect('/pipeline');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? '/pipeline' : '/login');
}
