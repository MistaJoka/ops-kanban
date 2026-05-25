'use client';

import { useEffect, useState } from 'react';

type InquiryConfig = {
  title: string;
  organizationName: string;
  bookingSlug: string | null;
};

export function InquiryForm({
  slug,
  initialSource,
  initialCampaign,
}: {
  slug: string;
  initialSource?: string;
  initialCampaign?: string;
}) {
  const [config, setConfig] = useState<InquiryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    void fetch(`/api/inquiry/${slug}`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.data) {
          setConfig(payload.data);
        } else {
          setError(payload.error ?? 'Inquiry page unavailable.');
        }
      })
      .catch(() => setError('Inquiry page unavailable.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/inquiry/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          customerAddress: customerAddress || undefined,
          message: inquiryMessage,
          source: initialSource || 'website',
          campaign: initialCampaign || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Submission failed.');
      }

      setMessage(
        payload.data?.idempotent
          ? 'We already received this request. We will contact you shortly.'
          : 'We received your request — we will contact you shortly.',
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--text-secondary)]">Loading inquiry form…</p>;
  }

  if (error && !config) {
    return (
      <p role="alert" className="text-sm text-[var(--urgent)]">
        {error}
      </p>
    );
  }

  if (!config) {
    return null;
  }

  if (message) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-primary)]">{message}</p>
        {config.bookingSlug ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Ready to pick a time?{' '}
            <a href={`/book/${config.bookingSlug}`} className="ops-link font-medium">
              Schedule a site visit
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <Field label="Your name">
        <input
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          className="field-input"
          required
          autoComplete="name"
        />
      </Field>

      <Field label="Phone">
        <input
          type="tel"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          className="field-input"
          autoComplete="tel"
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          className="field-input"
          autoComplete="email"
        />
      </Field>

      <p className="text-xs text-[var(--text-tertiary)]">Provide at least a phone number or email.</p>

      <Field label="Property address">
        <input
          value={customerAddress}
          onChange={(event) => setCustomerAddress(event.target.value)}
          className="field-input"
          autoComplete="street-address"
        />
      </Field>

      <Field label="What do you need?">
        <textarea
          value={inquiryMessage}
          onChange={(event) => setInquiryMessage(event.target.value)}
          rows={4}
          className="field-input"
          required
          placeholder="Describe the work — e.g. weekly lawn maintenance, patio install, spring cleanup"
        />
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-[var(--urgent)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Request a quote'}
      </button>

      {config.bookingSlug ? (
        <p className="text-xs text-[var(--text-secondary)]">
          Prefer to pick a time?{' '}
          <a href={`/book/${config.bookingSlug}`} className="ops-link">
            Schedule a site visit
          </a>
        </p>
      ) : null}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--text-primary)]">{label}</span>
      {children}
    </label>
  );
}
