'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { registerSessionRedirect } from '@/lib/client/apiFetch';
import { createClient } from '@/lib/db/supabase/client';

export function SessionGuardProvider({
  children,
  authDisabled = false,
}: {
  children: React.ReactNode;
  authDisabled?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (authDisabled) {
      return;
    }

    registerSessionRedirect((nextPath) => {
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
    });

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        const next = `${window.location.pathname}${window.location.search}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
      }
    });

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void fetch('/api/app/context').catch(() => undefined);
    }, 15 * 60 * 1000);

    return () => {
      window.clearInterval(heartbeat);
      subscription.unsubscribe();
      registerSessionRedirect(() => undefined);
    };
  }, [authDisabled, router]);

  return children;
}
