'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { persistTheme, readStoredTheme, resolveTheme, type Theme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme() ?? resolveTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    persistTheme(next);
  };

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-[var(--nav-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--nav-text)]',
        collapsed ? 'w-full' : 'w-full',
        className,
      )}
    >
      {mounted && theme === 'dark' ? (
        <Sun className="size-3.5 shrink-0" strokeWidth={2} />
      ) : (
        <Moon className="size-3.5 shrink-0" strokeWidth={2} />
      )}
      {!collapsed ? (
        <span>{mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Theme'}</span>
      ) : null}
    </button>
  );
}

export function ThemeToggleStandalone({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme() ?? resolveTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    persistTheme(next);
  };

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn('ops-icon-btn', className)}
    >
      {mounted && theme === 'dark' ? (
        <Sun className="size-4" strokeWidth={2} />
      ) : (
        <Moon className="size-4" strokeWidth={2} />
      )}
    </button>
  );
}

/** Reserved for future system-theme sync; default is dark unless user picks light. */
export function ThemeSync() {
  return null;
}
