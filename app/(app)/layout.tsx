import { AppShell } from '@/components/workspace/AppShell';
import { getAppContext } from '@/lib/domain/auth/appContext';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const app = await getAppContext();

  return (
    <AppShell displayName={app.displayName} authDisabled={app.authDisabled}>
      {children}
    </AppShell>
  );
}
