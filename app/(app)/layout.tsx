import { AppShell } from '@/components/workspace/AppShell';
import { SessionGuardProvider } from '@/components/auth/SessionGuardProvider';
import { getAppContext } from '@/lib/domain/auth/appContext';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const app = await getAppContext();

  return (
    <SessionGuardProvider authDisabled={app.authDisabled}>
      <AppShell displayName={app.displayName} authDisabled={app.authDisabled}>
        {children}
      </AppShell>
    </SessionGuardProvider>
  );
}
