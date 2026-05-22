'use client';

import { useEffect, useState } from 'react';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';

type IntegrationStatus = {
  stripe: { configured: boolean; status: string; errorMessage?: string | null };
  twilio: { configured: boolean; status: string; errorMessage?: string | null };
  resend: { configured: boolean };
  nativeAccounting: { enabled: boolean };
  nativeSigning: { enabled: boolean };
  bookingPageUrl: string | null;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="ops-badge shrink-0 bg-[var(--surface-inset)] uppercase text-[var(--text-secondary)]">
      {status}
    </span>
  );
}

export default function IntegrationsSettingsPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const response = await fetch('/api/integrations');
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? 'Failed to load integrations.');
      setLoading(false);
      return;
    }
    setStatus(payload.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const patch = async (body: Record<string, string>) => {
    const response = await fetch('/api/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? 'Failed to update integration.');
      return;
    }
    setStatus(payload.data);
  };

  return (
    <div className="ops-page-shell max-w-3xl">
      <SettingsPageHeader
        title="Integrations"
        description="Native accounting, e-sign, and booking are always on. Optional delivery pipes below."
      />

      {error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {error}
        </p>
      ) : null}

      {loading || !status ? (
        <p className="mt-8 text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="ops-section-card">
            <h2 className="font-semibold text-[var(--text-primary)]">Native modules</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>Accounting ledger — invoices and payments recorded automatically</li>
              <li>Estimate approval — customer portal e-sign (name + IP audit)</li>
              <li>Public booking page — site visit requests create cards</li>
            </ul>
          </section>

          {status.bookingPageUrl ? (
            <section className="ops-section-card">
              <h2 className="font-semibold text-[var(--text-primary)]">Public booking page</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Share this link so customers can request site visits.
              </p>
              <a
                href={status.bookingPageUrl}
                target="_blank"
                rel="noreferrer"
                className="ops-link mt-3 block truncate text-sm"
              >
                {status.bookingPageUrl}
              </a>
            </section>
          ) : null}

          <div>
            <p className="ops-field-label mb-3">Connectors</p>
            <div className="space-y-4">
              <article className="ops-section-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-[var(--text-primary)]">Stripe payments</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {status.stripe.configured
                        ? 'Platform keys detected. Enable to show payment links on invoices.'
                        : 'Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your environment.'}
                    </p>
                  </div>
                  <StatusBadge status={status.stripe.status} />
                </div>
                {status.stripe.configured ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void patch({ stripe: 'active' })}
                      className="ops-btn-primary"
                    >
                      Enable
                    </button>
                    <button
                      type="button"
                      onClick={() => void patch({ stripe: 'disconnected' })}
                      className="ops-btn-secondary"
                    >
                      Disable
                    </button>
                  </div>
                ) : null}
              </article>

              <article className="ops-section-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-[var(--text-primary)]">Twilio SMS</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {status.twilio.configured
                        ? 'Send/receive SMS on card threads. Set TWILIO_DEFAULT_ORGANIZATION_ID for inbound routing.'
                        : 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and a sender number or messaging service.'}
                    </p>
                  </div>
                  <StatusBadge status={status.twilio.status} />
                </div>
                {status.twilio.configured ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void patch({ twilio: 'active' })}
                      className="ops-btn-primary"
                    >
                      Enable
                    </button>
                    <button
                      type="button"
                      onClick={() => void patch({ twilio: 'disconnected' })}
                      className="ops-btn-secondary"
                    >
                      Disable
                    </button>
                  </div>
                ) : null}
              </article>

              <article className="ops-section-card">
                <h2 className="font-semibold text-[var(--text-primary)]">Resend email</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {status.resend.configured
                    ? 'Ready to send estimates and card email threads.'
                    : 'Set RESEND_API_KEY and RESEND_FROM_EMAIL to send email.'}
                </p>
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
