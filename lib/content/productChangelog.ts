export type ChangelogSection = {
  title: 'Added' | 'Changed' | 'Fixed' | 'Security';
  items: string[];
};

export type ProductRelease = {
  version: string;
  title: string;
  releasedAt: string;
  summary?: string;
  sections: ChangelogSection[];
};

/**
 * Product-facing release history for `/support/changelog`.
 * Keep in sync with `CHANGELOG.md`.
 */
export const PRODUCT_CHANGELOG: ProductRelease[] = [
  {
    version: '0.5.0',
    title: 'Optimistic background sync',
    releasedAt: '2026-05-23T00:30:00.000Z',
    summary:
      'Board, panel, and money actions apply instantly while a background sync queue saves to the server — no waiting on the network.',
    sections: [
      {
        title: 'Added',
        items: [
          'Background outbound sync queue — drag, edit, and money actions enqueue server work',
          'Sync pill shows pending count while changes save (Saving · N pending)',
          'Retry button when sync is out of alignment',
          'Card panel opens immediately from board cache while full detail loads in background',
        ],
      },
      {
        title: 'Changed',
        items: [
          'Create job closes the modal instantly after the optimistic card appears',
          'Estimate, invoice, and customer saves update the panel without full reload flashes',
          'Move validation failures roll back asynchronously with existing prompts',
        ],
      },
    ],
  },
  {
    version: '0.4.0',
    title: 'UI master formula alignment',
    releasedAt: '2026-05-22T23:59:00.000Z',
    summary:
      'Pipeline workspace aligned to the Field ledger UI master formula: bottom AI dock, group jump chips, topo board surface, global keyboard shortcuts, and brand assets.',
    sections: [
      {
        title: 'Added',
        items: [
          'Bottom AI command dock on the pipeline — collapsed bar expands to full Ops copilot',
          'Group jump chips in full (19-column) pipeline mode',
          'Global keyboard shortcuts modal (? in sidebar or press ?)',
          'Topo-pattern board background and empty-pipeline illustration',
          'Brand mark in sidebar and SVG app icon',
        ],
      },
      {
        title: 'Changed',
        items: [
          'Pipeline toolbar AI button expands the bottom dock instead of a popup',
          'Keyboard shortcuts: / and ⌘K focus search, N opens New job, ` toggles sidebar',
        ],
      },
    ],
  },
  {
    version: '0.3.0',
    title: 'Card ops complete',
    releasedAt: '2026-05-22T22:00:00.000Z',
    summary:
      'Full CARD_DESIGN board layer: true stage age, scan signals, card menu, modals, drag reorder, panel refactor, and advanced filters.',
    sections: [
      {
        title: 'Added',
        items: [
          'True stage age on board cards — days in current column, not since last edit',
          'Board card scan signals: job type chip, money amount, schedule label, assignee initials',
          'Board card menu: assign, due date, move to column, archive',
          'Double-click inline title edit on board cards',
          'New Job modal with customer, address, job type, and starting column',
          'Customer create modal from toolbar',
          'Estimate send and mark paid confirmation modals',
          'Within-column drag reorder with @dnd-kit drop indicators',
          'Advanced filters: assigned to me, unassigned, balance due, job type, scheduled this week',
          'Press N on pipeline to open New Job modal',
        ],
      },
      {
        title: 'Changed',
        items: [
          'Move validation requires customer and quote line items before estimate sent',
          'Workers can only move cards assigned to them or unassigned jobs',
          'Card panel split into focused tabs and hooks for easier maintenance',
          'Overdue board cards show dotted outline per Field ledger spec',
        ],
      },
    ],
  },
  {
    version: '0.2.0',
    title: 'Pilot polish',
    releasedAt: '2025-05-22T22:00:00.000Z',
    summary:
      'Toolbar create menu, popup AI copilot, settings hub, instant board updates, and pilot deploy readiness.',
    sections: [
      {
        title: 'Added',
        items: [
          'Settings hub with General, Team, Integrations, Templates, Automations, and Contracts',
          'Toolbar + create menu for jobs, customers, automations, templates, and contracts',
          'AI toolbar button opens the in-app Ops copilot in a popup panel',
          'Board sync status pill (Synced, Saving, Live, Needs attention)',
          'Delete job action for owners and managers',
          'Standalone customer create from the toolbar',
          'Native accounting ledger with AR register and CSV export',
          'Dev-only Reset board tooling for auth-bypass environments',
        ],
      },
      {
        title: 'Changed',
        items: [
          'Board and card actions update instantly with background sync and rollback on failure',
          'Field ledger UI polish across pipeline cards, detail panel, and dashboard',
          'Removed QuickBooks and DocuSign placeholders in favor of native flows',
        ],
      },
    ],
  },
  {
    version: '0.1.4',
    title: 'Wave 4 — scale',
    releasedAt: '2025-05-21T20:00:00.000Z',
    summary: 'Customer portal, automations, recurring contracts, and reporting.',
    sections: [
      {
        title: 'Added',
        items: [
          'Customer portal links for estimate approval and payment',
          'Column and payment automations with SMS templates',
          'Recurring maintenance contracts with due-job runner',
          'Reports dashboard with pipeline snapshot and AR summary',
          'Review request SMS after paid jobs',
        ],
      },
    ],
  },
  {
    version: '0.1.3',
    title: 'Wave 3 — documents',
    releasedAt: '2025-05-21T18:00:00.000Z',
    summary: 'Files, native e-sign, and change orders on jobs.',
    sections: [
      {
        title: 'Added',
        items: [
          'Card Files tab with attachments upload and download',
          'Native click-to-accept estimate approval on the portal',
          'Change orders linked to parent jobs',
        ],
      },
    ],
  },
  {
    version: '0.1.2',
    title: 'Wave 2 — scheduling & comms',
    releasedAt: '2025-05-21T16:00:00.000Z',
    summary: 'Booking page, crew calendar, and SMS/email threads on cards.',
    sections: [
      {
        title: 'Added',
        items: [
          'Public booking page that creates inquiry cards',
          'Calendar view of scheduled jobs',
          'Card Comms tab with SMS and email threads',
          'Message templates for reusable outbound copy',
        ],
      },
    ],
  },
  {
    version: '0.1.1',
    title: 'Wave 1 — payments',
    releasedAt: '2025-05-21T14:00:00.000Z',
    summary: 'PayPal payment links, webhooks, and integration health.',
    sections: [
      {
        title: 'Added',
        items: [
          'PayPal payment links on invoices with webhook settlement',
          'Estimate PDF export and email send',
          'Integration health checks for PayPal, Twilio, and Resend',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    title: 'Wave 0 MVP',
    releasedAt: '2025-05-21T12:00:00.000Z',
    summary: 'Landscaping operations board with deep cards and AI copilot.',
    sections: [
      {
        title: 'Added',
        items: [
          '9-column job pipeline with drag-and-drop, search, and filters',
          'Deep card panel: property, scope, schedule, estimate, invoice, and activity',
          'Move validation gates for schedule, estimates, and archive reasons',
          'AI copilot on board and card with approval for write actions',
          'Multi-tenant Supabase RLS across all org data',
          'Auth signup, login, and org bootstrap with zero demo cards',
        ],
      },
      {
        title: 'Changed',
        items: [
          'Archived jobs hidden from default board view; use the Archived filter',
          'Empty states use honest copy — no sample jobs in production paths',
        ],
      },
      {
        title: 'Security',
        items: [
          'Org isolation enforced via RLS matrix tests',
          'AI prompt injection guards and rate limits on command API',
        ],
      },
    ],
  },
];

export function formatReleaseTimestamp(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
