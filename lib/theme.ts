export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'opsboard-theme';

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function readStoredTheme(): Theme | null {
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  if (value === 'light' || value === 'dark') {
    return value;
  }
  return null;
}

export function resolveTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) {
    return stored;
  }
  return 'dark';
}

export function persistTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var d=s!=='light';document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;
