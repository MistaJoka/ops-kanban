'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Kanban,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { AccountMenu } from '@/components/workspace/AccountMenu';
import { ThemeToggle } from '@/components/workspace/ThemeToggle';
import { cn } from '@/lib/utils';

const SIDEBAR_KEY = 'opsboard-sidebar-collapsed';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
};

const WORKSPACE_ITEMS: NavItem[] = [
  { href: '/pipeline', label: 'Job Pipeline', icon: Kanban },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

const SUPPORT_ITEMS: NavItem[] = [
  { href: '/support/help', label: 'Help & guides', icon: HelpCircle },
  { href: '/support/contact', label: 'Contact support', icon: Mail },
  { href: '/support/changelog', label: "What's new", icon: Sparkles },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active =
    item.href === '/settings'
      ? pathname.startsWith('/settings')
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  if (item.soon) {
    return (
      <span
        title={collapsed ? `${item.label} (Soon)` : undefined}
        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--nav-text-muted)] opacity-60"
      >
        <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
        {!collapsed ? (
          <>
            <span>{item.label}</span>
            <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
          </>
        ) : null}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-[var(--nav-active-bg)] text-[var(--nav-text)]'
          : 'text-[var(--nav-text-muted)] hover:bg-white/5 hover:text-[var(--nav-text)]',
      )}
    >
      {active ? (
        <span
          className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-[var(--nav-active)]"
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn('size-[18px] shrink-0', active && 'text-[var(--nav-text)]')}
        strokeWidth={active ? 2.25 : 1.75}
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
  displayName,
  authDisabled,
}: {
  collapsed: boolean;
  onToggle: () => void;
  displayName: string;
  authDisabled: boolean;
}) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-black/20 bg-[var(--nav-bg)] text-[var(--nav-text)] transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--nav-active)] text-xs font-bold tracking-tight text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          OB
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">OpsBoard</p>
            <p className="text-[11px] text-[var(--nav-text-muted)]">Field ledger</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        <div>
          {!collapsed ? (
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nav-text-muted)]">
              Workspace
            </p>
          ) : null}
          <div className="space-y-0.5">
            {WORKSPACE_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>

        <div>
          {!collapsed ? (
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nav-text-muted)]">
              Support
            </p>
          ) : null}
          <div className="space-y-0.5">
            {SUPPORT_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>
      </nav>

      <div className="space-y-2 border-t border-white/10 p-3">
        <NavLink
          collapsed={collapsed}
          item={{ href: '/settings', label: 'Settings', icon: Settings }}
        />
        <AccountMenu
          displayName={displayName}
          collapsed={collapsed}
          authDisabled={authDisabled}
        />
        <ThemeToggle collapsed={collapsed} />
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-[var(--nav-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--nav-text)]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <>
              <ChevronLeft className="size-3.5" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    if (stored === 'true') {
      setCollapsed(true);
    }
  }, []);

  const toggle = () => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  };

  return [collapsed, toggle];
}
