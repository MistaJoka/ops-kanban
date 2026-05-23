'use client';

import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { QuoteView } from '@/lib/domain/money/quotes';
import type { PaymentView } from '@/lib/domain/integrations/payments';

export function MoneyTab({
  quote,
  invoice,
  payment,
  stripeEnabled,
  canManage,
  onCreateInvoice,
  onMarkPaid,
  onCreatePaymentLink,
  onCopyPortalLink,
  saving,
}: {
  quote: QuoteView | null;
  invoice: InvoiceView | null;
  payment: PaymentView | null;
  stripeEnabled: boolean;
  canManage: boolean;
  onCreateInvoice: () => Promise<void>;
  onMarkPaid: () => Promise<void>;
  onCreatePaymentLink: () => Promise<void>;
  onCopyPortalLink: () => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Invoice & balance</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Native accounting ledger records invoices and payments automatically. Stripe payment links
          when configured; manual mark paid always available.
        </p>
      </div>

      {!invoice ? (
        <div className="ops-empty-state">
          <p className="text-sm text-[var(--text-secondary)]">
            {quote && quote.total > 0
              ? `Estimate total: $${quote.total.toFixed(2)}`
              : 'Save an estimate with line items first.'}
          </p>
          {canManage && quote && quote.total > 0 ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void onCreateInvoice()}
              className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Create invoice draft
            </button>
          ) : null}
        </div>
      ) : (
        <div className="ops-section-card space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Status" value={invoice.status.replace(/_/g, ' ')} />
            <Stat label="Total" value={`$${invoice.total.toFixed(2)}`} />
            <Stat
              label="Balance due"
              value={`$${invoice.balanceDue.toFixed(2)}`}
              highlight={invoice.balanceDue > 0}
            />
            <Stat
              label="Due date"
              value={invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
            />
          </div>

          {payment?.paymentUrl && invoice.status !== 'paid' ? (
            <div className="rounded-lg bg-[var(--surface-rail)] px-3 py-2 text-sm">
              <p className="font-medium text-[var(--text-primary)]">Stripe payment link</p>
              <a
                href={payment.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-[var(--accent)] underline"
              >
                {payment.paymentUrl}
              </a>
            </div>
          ) : null}

          {canManage && invoice.status !== 'paid' && invoice.balanceDue > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stripeEnabled ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onCreatePaymentLink()}
                  className="ops-btn-accent-outline"
                >
                  {payment?.paymentUrl ? 'Refresh payment link' : 'Create payment link'}
                </button>
              ) : null}
              <button
                type="button"
                disabled={saving}
                onClick={() => void onCopyPortalLink()}
                className="ops-btn-secondary"
              >
                Copy customer portal link
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void onMarkPaid()}
                className="ops-btn-primary"
              >
                Mark paid & archive
              </button>
            </div>
          ) : null}

          {invoice.status === 'paid' ? (
            <p className="rounded-lg bg-[var(--surface-rail)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              Paid — recorded in ledger and job moved to archived.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="ops-stat-card__label">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums tracking-tight ${
          highlight ? 'text-[var(--urgent)]' : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
