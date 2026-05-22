'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SETTINGS_NAV_GROUPS } from '@/lib/settings/nav';
import { cn } from '@/lib/utils';

export function SettingsNav({ integrationsAttention }: { integrationsAttention?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <nav className="ops-settings-nav hidden w-60 shrink-0 flex-col md:flex" aria-label="Settings">
        <div className="border-b border-[var(--topbar-border)] px-4 py-5">
          <p className="ops-page-title text-lg">Settings</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Workspace configuration</p>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
          {SETTINGS_NAV_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  if (item.soon || !item.href) {
                    return (
                      <span
                        key={item.label}
                        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] opacity-60"
                      >
                        <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{item.label}</span>
                        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide">
                          Soon
                        </span>
                      </span>
                    );
                  }

                  const active = isActive(item.href, item.exact);
                  const showAttention =
                    item.href === '/settings/integrations' && integrationsAttention;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-[var(--accent-muted)] font-medium text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      {active ? (
                        <span
                          className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-[var(--accent)]"
                          aria-hidden
                        />
                      ) : null}
                      <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                      <span className="truncate">{item.label}</span>
                      {showAttention ? (
                        <span
                          className="ml-auto size-2 shrink-0 rounded-full bg-[var(--urgent)]"
                          title="Connector needs attention"
                          aria-hidden
                        />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-b border-[var(--topbar-border)] bg-[var(--surface-rail)] md:hidden">
        <p className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">Settings</p>
        <div className="ops-tab-bar mt-3 px-2 pb-0">
          {SETTINGS_NAV_GROUPS.flatMap((group) =>
            group.items
              .filter((item): item is typeof item & { href: string } => Boolean(item.href))
              .map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('ops-tab', active && 'ops-tab--active')}
                  >
                    {item.label}
                  </Link>
                );
              }),
          )}
        </div>
      </div>
    </>
  );
}
