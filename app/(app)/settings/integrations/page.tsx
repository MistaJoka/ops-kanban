'use client';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { useSettingsIntegrations } from '@/components/settings/hooks/useSettingsHooks';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="ops-badge shrink-0 bg-[var(--surface-inset)] uppercase text-[var(--text-secondary)]">
      {status}
    </span>
  );
}

export default function IntegrationsSettingsPage() {
  const { data: status, loading, error, setError, save } = useSettingsIntegrations();

  const patch = async (body: Record<string, string>) => {
    try {
      await save(body);
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : 'Failed to update integration.');
    }
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
              <li>Public inquiry form — quote requests create inquiry cards</li>
              <li>Public booking page — site visit requests create cards</li>
            </ul>
          </section>

          {status.inquiryPageUrl ? (
            <section className="ops-section-card">
              <h2 className="font-semibold text-[var(--text-primary)]">Public inquiry form</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Share this link on your website, email signature, or QR codes for quote requests.
              </p>
              <a
                href={status.inquiryPageUrl}
                target="_blank"
                rel="noreferrer"
                className="ops-link mt-3 block truncate text-sm"
              >
                {status.inquiryPageUrl}
              </a>
              {status.inquiryLinkPresets.length ? (
                <ul className="mt-4 space-y-2">
                  {status.inquiryLinkPresets.map((preset) => (
                    <li key={preset.url} className="text-sm">
                      <span className="font-medium text-[var(--text-primary)]">{preset.label}: </span>
                      <a href={preset.url} target="_blank" rel="noreferrer" className="ops-link break-all">
                        {preset.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

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
