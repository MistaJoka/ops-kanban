import { notFound } from 'next/navigation';

import { PortalActions } from '@/app/p/[token]/PortalActions';
import { PortalPayActions } from '@/app/p/[token]/PortalPayActions';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { getInvoiceForCardPaymentContext } from '@/lib/domain/integrations/payments';
import { verifyPortalToken } from '@/lib/domain/integrations/portalTokens';
import { getQuoteForCard } from '@/lib/domain/money/quotes';
import { createServiceClient } from '@/lib/db/supabase/service';

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const service = createServiceClient();
  const portal = await verifyPortalToken(service, token);

  if (!portal) {
    notFound();
  }

  const [card, quote, billing] = await Promise.all([
    getCardDetail(service, portal.organizationId, portal.cardId),
    getQuoteForCard(service, portal.organizationId, portal.cardId),
    getInvoiceForCardPaymentContext(service, portal.organizationId, portal.cardId),
  ]);

  if (!card) {
    notFound();
  }

  const canViewEstimate = portal.scopes.includes('view_estimate');
  const canViewSchedule = portal.scopes.includes('view_schedule');
  const canPay = portal.scopes.includes('pay');
  const scheduledLabel = formatDateTime(card.scheduledStart);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
        Customer portal
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{card.title}</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {card.customer?.address ?? card.customer?.name ?? 'Property details pending'}
      </p>

      {canViewSchedule ? (
        <section className="mt-8 rounded-xl border border-[var(--topbar-border)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Schedule</h2>
          {scheduledLabel ? (
            <p className="mt-3 text-sm text-[var(--text-primary)]">
              Scheduled for {scheduledLabel}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Your visit is not scheduled yet. We will notify you when a date is confirmed.
            </p>
          )}
        </section>
      ) : null}

      {canViewEstimate && quote ? (
        <section className="mt-8 rounded-xl border border-[var(--topbar-border)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Estimate</h2>
          <ul className="mt-4 space-y-2">
            {quote.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.description} × {item.quantity}
                </span>
                <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-lg font-semibold">Total: ${quote.total.toFixed(2)}</p>
          <PortalActions token={token} canApprove={portal.scopes.includes('approve')} />
        </section>
      ) : canViewEstimate ? (
        <p className="mt-8 text-sm text-[var(--text-secondary)]">No estimate is available yet.</p>
      ) : null}

      {billing.invoice ? (
        <section className="mt-8 rounded-xl border border-[var(--topbar-border)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invoice</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Total ${billing.invoice.total.toFixed(2)} · Status {billing.invoice.status}
          </p>
          <PortalPayActions
            token={token}
            canPay={canPay}
            balanceDue={billing.invoice.balanceDue}
            paymentUrl={billing.payment?.paymentUrl ?? null}
            invoiceStatus={billing.invoice.status}
          />
        </section>
      ) : null}
    </main>
  );
}
