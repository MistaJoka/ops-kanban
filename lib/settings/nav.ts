import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CreditCard,
  FileText,
  LayoutGrid,
  Plug,
  RefreshCw,
  Repeat,
  Sparkles,
  Users,
} from 'lucide-react';

export type SettingsNavItem = {
  href?: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  soon?: boolean;
  exact?: boolean;
};

export type SettingsNavGroup = {
  id: string;
  label: string;
  items: SettingsNavItem[];
};

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        href: '/settings',
        label: 'Overview',
        description: 'Shortcuts to every settings area',
        icon: LayoutGrid,
        exact: true,
      },
      {
        href: '/settings/general',
        label: 'General',
        description: 'Organization name and pipeline mode',
        icon: Building2,
      },
      {
        href: '/settings/team',
        label: 'Team',
        description: 'Members and roles in your workspace',
        icon: Users,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        href: '/settings/integrations',
        label: 'Integrations',
        description: 'Payments, SMS, email, and native modules',
        icon: Plug,
      },
      {
        href: '/settings/templates',
        label: 'Message templates',
        description: 'Reusable SMS and email copy',
        icon: FileText,
      },
      {
        href: '/settings/automations',
        label: 'Automations',
        description: 'Column triggers and follow-up rules',
        icon: RefreshCw,
      },
      {
        href: '/settings/contracts',
        label: 'Contracts',
        description: 'Recurring jobs that spawn pipeline cards',
        icon: Repeat,
      },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    items: [
      {
        label: 'AI rules',
        description: 'Copilot guardrails and approval defaults',
        icon: Sparkles,
        soon: true,
      },
      {
        label: 'Billing',
        description: 'Plan and payment method',
        icon: CreditCard,
        soon: true,
      },
    ],
  },
];

export const SETTINGS_OVERVIEW_ITEMS = SETTINGS_NAV_GROUPS.flatMap((group) =>
  group.items.filter((item): item is SettingsNavItem & { href: string } => Boolean(item.href)),
);
