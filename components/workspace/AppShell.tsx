'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

import { Sidebar, useSidebarCollapsed } from '@/components/workspace/Sidebar';
import { ThemeSync } from '@/components/workspace/ThemeToggle';
import { WorkspaceShortcutsProvider } from '@/components/workspace/WorkspaceShortcutsProvider';

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEscape);
    };
  }, [mobileNavOpen]);

  return (
    <WorkspaceShortcutsProvider onToggleSidebar={toggleCollapsed}>
      <div className="ops-app-shell">
        <ThemeSync />
        {mobileNavOpen ? (
          <button
            type="button"
            className="ops-sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          displayName={displayName}
          authDisabled={authDisabled}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <div className="ops-main">
          <div className="flex min-h-0 flex-1 flex-col md:contents">
            <div className="flex items-center gap-2 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)] px-3 py-2 md:hidden">
              <button
                type="button"
                className="ops-mobile-nav-toggle"
                aria-label="Open navigation"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">OpsBoard</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </WorkspaceShortcutsProvider>
  );
}
