'use client';

import type { QuoteView } from '@/lib/domain/money/quotes';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export type PanelTabKey =
  | 'overview'
  | 'property'
  | 'scope'
  | 'schedule'
  | 'comments'
  | 'checklist'
  | 'estimate'
  | 'money'
  | 'comms'
  | 'files';

const PRIMARY_TABS: Array<{ key: PanelTabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'property', label: 'Property' },
  { key: 'scope', label: 'Scope' },
  { key: 'estimate', label: 'Estimate' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'money', label: 'Money' },
];

const SECONDARY_TABS: Array<{ key: PanelTabKey; label: string }> = [
  { key: 'comments', label: 'Comments' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'comms', label: 'Comms' },
  { key: 'files', label: 'Files' },
];

export function getTabBadges(input: {
  quote: QuoteView | null;
  invoice: InvoiceView | null;
  commentCount: number;
}): Partial<Record<PanelTabKey, string>> {
  const badges: Partial<Record<PanelTabKey, string>> = {};

  if (input.quote && input.quote.total > 0 && input.quote.status !== 'sent') {
    badges.estimate = '•';
  }

  if (input.invoice && input.invoice.balanceDue > 0) {
    badges.money = '•';
  }

  if (input.commentCount > 0) {
    badges.comments = String(input.commentCount);
  }

  return badges;
}

export function CardPanelTabBar({
  tab,
  onTabChange,
  badges,
}: {
  tab: PanelTabKey;
  onTabChange: (tab: PanelTabKey) => void;
  badges: Partial<Record<PanelTabKey, string>>;
}) {
  const activeSecondary = SECONDARY_TABS.find((item) => item.key === tab);
  const secondaryActive = Boolean(activeSecondary);

  return (
    <div className="ops-tab-bar">
      <div className="flex gap-0.5 py-1.5">
        {PRIMARY_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTabChange(item.key)}
            className={cn('ops-tab', tab === item.key && 'ops-tab--active')}
          >
            {item.label}
            {badges[item.key] ? (
              <span className="ops-tab__badge">{badges[item.key]}</span>
            ) : null}
          </button>
        ))}

        <details className="ops-tab-bar__more group/details">
          <summary
            className={cn(
              'ops-tab cursor-pointer list-none [&::-webkit-details-marker]:hidden',
              secondaryActive && 'ops-tab--active',
            )}
          >
            More{activeSecondary ? ` · ${activeSecondary.label}` : ''}
            <ChevronDown className="ml-0.5 inline size-3 opacity-60" strokeWidth={2.25} />
          </summary>
          <div className="ops-menu ops-menu--portal left-auto right-2 top-full mt-0 min-w-[140px]">
            {SECONDARY_TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className="ops-menu-item flex items-center justify-between gap-2"
                onClick={() => onTabChange(item.key)}
              >
                <span>{item.label}</span>
                {badges[item.key] ? (
                  <span className="ops-tab__badge">{badges[item.key]}</span>
                ) : null}
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
