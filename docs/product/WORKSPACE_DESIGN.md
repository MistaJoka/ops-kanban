# Main workspace design — landscaping

The **Job Pipeline** is the primary workspace: a horizontal Kanban board with grouped columns, filters, and AI. Everything else is reached through a **collapsible app shell** (sidebar + top bar).

**UI philosophy:** [`UI_MASTER_FORMULA.md`](UI_MASTER_FORMULA.md) — why the workspace feels and behaves this way. This doc is the layout spec (including bottom AI dock §5).

Related: `CARD_DESIGN.md`, `FULL_PIPELINE.md`, `VERTICAL_LANDSCAPING.md`.

---

## 1. App shell overview

```txt
┌──────────┬──────────────────────────────────────────────────────────────┐
│          │  Top bar: breadcrumb · filters · search · actions · account   │
│  Side    ├──────────────────────────────────────────────────────────────┤
│  nav     │                                                              │
│ (collap- │              Job Pipeline (main workspace)                   │
│  sible)  │              column groups · horizontal scroll               │
│          │                                                              │
│          ├──────────────────────────────────────────────────────────────┤
│          │  AI command dock (expandable)                                │
└──────────┴──────────────────────────────────────────────────────────────┘
```

| Zone | Role |
|------|------|
| **Sidebar** | Global navigation; collapses to icon rail |
| **Top bar** | Context, filters, search, primary actions |
| **Board** | Column groups + cards (80% of attention) |
| **AI dock** | Collapsed chip → expanded command panel |

Default route after login: `/pipeline` (not dashboard).

---

## 2. Collapsible sidebar navigation

### States

| State | Width | Content |
|-------|-------|---------|
| Expanded | 240px | Icons + labels + section headers |
| Collapsed | 64px | Icons only + tooltips on hover |

Toggle: chevron at bottom of sidebar or `` ` `` keyboard shortcut. Preference stored in `localStorage`.

### Structure

```txt
[Logo mark]
───────────── WORKSPACE ─────────────
  ◉ Job Pipeline          ← default, active
  ○ Dashboard
  ○ Customers
  ○ Calendar
  ○ Reports
───────────── SUPPORT ───────────────
  ○ Help & guides
  ○ Contact support
  ○ Keyboard shortcuts
  ○ What’s new
───────────── bottom ─────────────────
  ○ Settings
  [Avatar] Rivera Landscaping ▾
```

### Nav items (MVP vs post-MVP)

| Item | Route | MVP |
|------|-------|-----|
| Job Pipeline | `/pipeline` | ✓ |
| Dashboard | `/dashboard` | Minimal |
| Customers | `/customers` | Defer |
| Calendar | `/calendar` | Defer |
| Reports | `/reports` | Defer |
| Help & guides | `/support/help` | ✓ static |
| Contact support | `/support/contact` | ✓ form/mailto |
| Keyboard shortcuts | `/support/shortcuts` or modal | ✓ modal OK |
| What’s new | `/support/changelog` | ✓ static |
| Settings | `/settings` | Minimal |

Deferred items appear in nav **disabled** with “Soon” tooltip, or hidden until feature flag — recommend **visible + Soon** so the product story is clear.

### Support pages (content)

| Page | Purpose |
|------|---------|
| **Help & guides** | Landscaping workflows: inquiry → paid, estimate tips, crew scheduling; link to column glossary |
| **Contact support** | Email form, expected response time, optional screenshot |
| **Keyboard shortcuts** | Table: `N` new job, `/` search, `` ` `` sidebar, `?` shortcuts, `Esc` close panel |
| **What’s new** | Versioned changelog (markdown) |
| **Settings** (not support but adjacent) | Org name, pipeline mode (compact/full), members; AI rules hidden or “Coming soon” (no fake rows) |

Legal links in Help footer: Privacy, Terms.

---

## 3. Top bar (pipeline workspace)

```txt
Job Pipeline ▾  |  [Compact ▾] [Filter ▾] [Assigned: All ▾]  |  🔍 Search…  |  + New job  |  🔔  |  AI
```

| Control | Behavior |
|---------|----------|
| **Job Pipeline ▾** | Rename board (settings); switch pipeline mode if enabled |
| **Compact / Full ▾** | Toggle column set: 9-column MVP vs 19-column full (`FULL_PIPELINE.md`) |
| **Filter** | Mine, unassigned, overdue, this week, balance due, job type |
| **Search** | Title, customer, address; `Cmd+K` / `/` focus |
| **+ New job** | Quick-create popover → opens card detail if needed |
| **Notifications** | Badge: AI approvals, overdue count (MVP: approvals only) |
| **AI** | Expands bottom dock |

Mobile: top bar compresses to menu + search icon + `+`; filters in sheet.

---

## 4. Main workspace — Job Pipeline board

### Layout

```txt
┌─ Intake & sales ────────────▼──┐ ┌─ Production ───▼──┐ ┌─ Billing ──▼──┐ …
│ Inbound │ Qualified │ …       │ │ Scheduling │ …    │ │ Invoice …    │
│  (3)    │    (1)    │         │ │    (5)       │     │ │   (2)        │
│ [card]  │  [card]   │         │ │  [card]      │     │ │              │
└───────────────────────────────┘ └────────────────────┘ └──────────────┘
        ← horizontal scroll ─────────────────────────────────────────────→
```

### Column groups (collapsible)

Groups wrap full pipeline columns. Header shows **group name**, **card count**, collapse chevron.

| Group | `group_key` | Full pipeline columns |
|-------|-------------|------------------------|
| Intake & sales | `sales` | Inbound → Approved (7) |
| Production | `production` | Scheduling → Quality review (6) |
| Billing | `billing` | Completed → Paid (5) |
| Aftercare | `aftercare` | Retention, Archived (2) |

**Collapsed group:** shows vertical label + total count; click to expand.

**Compact mode (9 columns):** single group row or no group headers — see `DEFAULT_PIPELINE.md`.

### Column chrome

Each column (see `FULL_PIPELINE.md` for full list):

```txt
┌─────────────────┐
│ Site visit    ⋮ │  ← display name + column menu
│ 2 jobs · $3.2k  │  ← count + sum revenue_value
├─────────────────┤
│ [cards…]        │
│                 │
│  + Add job      │  ← adds to this column
└─────────────────┘
```

- Fixed column width: **300px** (comfortable cards per `CARD_DESIGN.md`)
- Min board height: viewport − top bar − AI dock
- Empty column: dashed “Drop jobs here” + CTA

### Board background

`--surface-board: #f4f1ec` with subtle **topographic contour** pattern at 3% opacity (SVG asset) — reinforces landscaping without clutter.

### Horizontal scroll UX

- Shift+scroll or trackpad horizontal
- **Mini-map** (post-MVP): strip showing groups; click to scroll
- MVP: **group jump chips** above board: `Sales | Production | Billing | Aftercare`

---

## 5. AI command dock

Sits **bottom** of workspace (not covering board center). Behavior: `docs/ai/AI_UTILIZATION.md`.

| State | Height | UI |
|-------|--------|-----|
| Collapsed | 48px | “Ask about today’s jobs…” + sparkle icon |
| Expanded | 220px | Mode chips (Ask / Analyze / Act / Draft), suggested prompts, composer, approval strip |
| Daily brief | chip | Owner-only: runs Analyze tier (read-only) |

Context: `page: 'board'`, `pipelineMode`, visible column IDs, capped card list, filter state — never full DB.

---

## 6. Visual system (workspace)

Extends `CARD_DESIGN.md` **Field ledger** theme.

### CSS variables (app shell)

```css
--nav-bg: #1a1f16;
--nav-text: #e8ebe4;
--nav-text-muted: #9aa393;
--nav-active: #2d5a3d;
--nav-active-bg: rgba(45, 90, 61, 0.2);
--topbar-bg: #faf8f5;
--topbar-border: #e2ddd4;
--group-header-bg: #ebe6dc;
--group-header-text: #3d4438;
```

Sidebar: dark forest green-charcoal (not generic gray `#1f2937`).

### Typography

Same as cards: **DM Sans** UI, **Fraunces** for “Job Pipeline” page title only.

---

## 7. Icons and assets

### Icon library

**Lucide React** — consistent stroke, 1.5px, 20px nav / 16px inline.

| Nav item | Lucide icon |
|----------|-------------|
| Job Pipeline | `LayoutGrid` |
| Dashboard | `LayoutDashboard` |
| Customers | `Users` |
| Calendar | `CalendarDays` |
| Reports | `BarChart3` |
| Help | `BookOpen` |
| Contact | `LifeBuoy` |
| Shortcuts | `Keyboard` |
| What’s new | `Sparkles` |
| Settings | `Settings` |
| Collapse nav | `PanelLeftClose` / `PanelLeft` |

| Workspace action | Icon |
|------------------|------|
| New job | `Plus` |
| Search | `Search` |
| Filter | `SlidersHorizontal` |
| Notifications | `Bell` |
| AI | `Bot` or custom mark |
| Column menu | `MoreHorizontal` |
| Drag card | `GripVertical` (handle only) |

### Brand assets (ship in `/public/brand/`)

| Asset | File | Spec |
|-------|------|------|
| Logomark | `mark.svg` | Stylized leaf + grid mark; works 24px and favicon |
| Wordmark | `wordmark.svg` | “OpsBoard” set in Fraunces |
| Favicon | `favicon.ico` | From mark |
| Empty board | `empty-pipeline.svg` | Simple line art, stone + green |
| Topographic pattern | `topo-pattern.svg` | Seamless tile for board bg |
| OG image | `og.png` | 1200×630 for marketing |

**No** stock photo heroes. Optional job-type icons later (lucide: `Leaf`, `Hammer`, `Droplets`, `Trash2`, `Wrench`).

### Avatar

User initials on `--accent` circle; org name truncated in sidebar footer.

---

## 8. Responsive behavior

| Breakpoint | Sidebar | Board | Detail panel |
|------------|---------|-------|--------------|
| ≥1280px | Expanded default | Groups + 300px columns | 720px slide-over |
| 1024–1279 | Collapsed default | Horizontal scroll | Full width sheet |
| <1024 | Overlay drawer | Single group visible; swipe groups | Full screen |

---

## 9. Keyboard shortcuts (workspace)

| Key | Action |
|-----|--------|
| `` ` `` | Toggle sidebar |
| `/` or `Cmd+K` | Focus search |
| `N` | New job |
| `?` | Shortcuts modal |
| `Esc` | Close card panel / clear search |
| `←` `→` | Scroll column groups (when board focused) |

---

## 10. Settings tied to workspace

| Setting | Effect |
|---------|--------|
| Pipeline mode | `compact` (9) vs `full` (19) columns |
| Default sidebar | expanded / collapsed |
| Show archived | Toggle archived column/cards in aftercare |
| Timezone | Org schedule labels |

---

## 11. Acceptance (workspace)

1. Login lands on Job Pipeline with sidebar expanded (desktop).
2. Sidebar collapses to icons; tooltips show labels.
3. Support pages reachable without leaving app shell.
4. Full pipeline: 4 collapsible groups, 19 columns scroll horizontally.
5. Compact pipeline: 9 columns fit with less scroll on 1440px display.
6. `+ New job` creates card in selected column or `inquiry`.
7. AI dock expands without hiding filter bar.

---

## 12. Open decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| F | Deferred nav items | **Visible + “Soon” badge** |
| G | Full pipeline default | **Compact for new orgs**; full in Settings |
| H | Archived column | **Show in aftercare group**, collapsed by default |
| I | AI dock position | **Bottom** (keeps board vertical space) |
