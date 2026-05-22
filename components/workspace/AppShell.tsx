'use client';

import { DevResetBoardButton } from '@/components/workspace/DevResetBoardButton';
import { Sidebar, useSidebarCollapsed } from '@/components/workspace/Sidebar';
import { ThemeSync } from '@/components/workspace/ThemeToggle';

export function AppShell({
  displayName,
  authDisabled,
  children,
}: {
  displayName: string;
  authDisabled: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  return (
    <div className="flex min-h-screen bg-[var(--surface-board)]">
      <ThemeSync />
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        displayName={displayName}
        authDisabled={authDisabled}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {authDisabled ? (
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[var(--topbar-border)] bg-[var(--accent-muted)] px-4 py-2 text-center text-xs font-medium text-[var(--accent)]">
            <span>Auth bypassed for build — all phases in progress</span>
            <DevResetBoardButton />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
