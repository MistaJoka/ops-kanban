import type { CardIntegrationSummary } from '@/lib/domain/integrations/cardIntegrationSummary';

function statusDot(status: string): string {
  if (status === 'paid' || status === 'signed' || status === 'completed') return 'bg-[var(--success)]';
  if (status === 'failed') return 'bg-[var(--urgent)]';
  if (status === 'pending' || status === 'due' || status === 'awaiting') return 'bg-[var(--cat-billing)]';
  if (status === 'active') return 'bg-[var(--accent)]';
  return 'bg-[var(--text-tertiary)]';
}

export function IntegrationStrip({ integrations }: { integrations: CardIntegrationSummary }) {
  const items = [
    { key: 'Stripe', ...integrations.stripe },
    { key: 'Estimate sign', ...integrations.estimateSign },
    {
      key: 'Twilio',
      label:
        integrations.twilio.unread > 0
          ? `${integrations.twilio.label} · ${integrations.twilio.unread} unread`
          : integrations.twilio.label,
      status: integrations.twilio.status,
    },
    { key: 'Accounting', ...integrations.accounting },
  ];

  return (
    <section className="ops-section-card bg-[var(--surface-rail)]">
      <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Integrations</h3>
      <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2.5 py-2 text-sm first:pt-0 last:pb-0">
            <span className={`size-2 shrink-0 rounded-full ${statusDot(item.status)}`} aria-hidden />
            <span className="min-w-[5.5rem] font-medium text-[var(--text-primary)]">{item.key}</span>
            <span className="truncate text-[var(--text-secondary)]">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
