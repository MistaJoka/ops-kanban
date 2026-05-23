'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings } from 'lucide-react';

import { signOutAction } from '@/lib/domain/auth/actions';
import { cn } from '@/lib/utils';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'OB';
}

export function AccountMenu({
  displayName,
  collapsed,
  authDisabled,
}: {
  displayName: string;
  collapsed: boolean;
  authDisabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="ops-dropdown">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={collapsed ? displayName : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border border-white/10 px-2 py-2 text-left transition-colors hover:bg-white/5',
          collapsed && 'justify-center px-0',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--nav-active)] text-xs font-bold text-white">
          {initialsFromName(displayName)}
        </span>
        {!collapsed ? (
          <span className="min-w-0 flex-1 truncate text-xs text-[var(--nav-text)]">
            {displayName}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn('ops-menu', collapsed ? 'ops-menu--up left-0 right-auto' : 'right-0')}
        >
          <Link
            href="/settings"
            role="menuitem"
            className="ops-menu-item flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4 shrink-0" strokeWidth={1.75} />
            Settings
          </Link>
          {authDisabled ? (
            <Link
              href="/settings/general#dev-workspace"
              role="menuitem"
              className="ops-menu-item flex items-center gap-2 text-[var(--nav-text-muted)]"
              onClick={() => setOpen(false)}
            >
              Dev workspace
            </Link>
          ) : (
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="ops-menu-item flex w-full items-center gap-2 text-[var(--nav-text-muted)] hover:text-[var(--nav-text)]"
              >
                <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                Sign out
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
