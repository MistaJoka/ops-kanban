# Design tokens — Field ledger theme

Canonical CSS variables for Tailwind / `globals.css`. Source: `CARD_DESIGN.md`, `WORKSPACE_DESIGN.md`.

```css
:root {
  /* Surfaces */
  --surface-board: #f4f1ec;
  --surface-card: #ffffff;
  --surface-rail: #faf8f5;
  --topbar-bg: #faf8f5;
  --topbar-border: #e2ddd4;
  --group-header-bg: #ebe6dc;
  --group-header-text: #3d4438;

  /* Navigation */
  --nav-bg: #1a1f16;
  --nav-text: #e8ebe4;
  --nav-text-muted: #9aa393;
  --nav-active: #2d5a3d;
  --nav-active-bg: rgba(45, 90, 61, 0.2);

  /* Text */
  --text-primary: #1a1f16;
  --text-secondary: #5c6356;

  /* Brand */
  --accent: #2d5a3d;
  --accent-muted: #e8f0eb;

  /* Pipeline category accents (card left border) */
  --cat-sales: #4a6fa5;
  --cat-production: #2d5a3d;
  --cat-billing: #b8860b;
  --cat-aftercare: #6b5b73;

  /* Semantic */
  --urgent: #c44d34;
  --overdue: #c44d34;
  --paid: #2d5a3d;
  --draft: #8a8478;
}
```

## Typography

| Token | Font stack |
|-------|------------|
| `--font-sans` | `'DM Sans', system-ui, sans-serif` |
| `--font-display` | `'Fraunces', Georgia, serif` |
| `--font-mono` | `'IBM Plex Mono', monospace` |

Load via `next/font/google` in root layout.

## Spacing & layout

| Token | Value | Use |
|-------|-------|-----|
| `--column-width` | 300px | Kanban column |
| `--sidebar-expanded` | 240px | Nav |
| `--sidebar-collapsed` | 64px | Nav rail |
| `--panel-width` | 720px | Card slide-over |
| `--ai-dock-collapsed` | 48px | |
| `--ai-dock-expanded` | 220px | |

## Radii & shadow

```css
--radius-card: 10px;
--shadow-card: 0 1px 2px rgba(26, 31, 22, 0.06);
--shadow-card-hover: 0 4px 12px rgba(26, 31, 22, 0.1);
```

## Motion

```css
--ease-panel: cubic-bezier(0.2, 0.8, 0.2, 1);
--duration-panel: 280ms;
--duration-tab: 120ms;
```

Respect `prefers-reduced-motion: reduce`.

## shadcn mapping

Map `--primary` → `--accent`, `--background` → `--surface-board` on pipeline route only.
