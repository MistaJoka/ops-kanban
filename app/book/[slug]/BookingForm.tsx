'use client';

import { useEffect, useState } from 'react';

type BookingConfig = {
  title: string;
  serviceTypes: Array<{ key: string; label: string; description?: string }>;
  slots: string[];
};

export function BookingForm({ slug }: { slug: string }) {
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [serviceKey, setServiceKey] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    void fetch(`/api/book/${slug}`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.data) {
          setConfig(payload.data);
          setServiceKey(payload.data.serviceTypes[0]?.key ?? '');
          setScheduledStart(payload.data.slots[0] ?? '');
        } else {
          setError(payload.error ?? 'Booking page unavailable.');
        }
      })
      .catch(() => setError('Booking page unavailable.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const serviceLabel =
      config?.serviceTypes.find((service) => service.key === serviceKey)?.label ?? serviceKey;

    try {
      const response = await fetch(`/api/book/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceKey,
          serviceLabel,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          customerAddress: customerAddress || undefined,
          scheduledStart,
          notes: notes || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Booking failed.');
      }

      setMessage(
        payload.data?.idempotent
          ? 'This booking was already submitted. We will be in touch shortly.'
          : 'Booking confirmed! We will contact you to confirm details.',
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Booking failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--text-secondary)]">Loading booking page…</p>;
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

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <Field label="Service">
        <select
          value={serviceKey}
          onChange={(event) => setServiceKey(event.target.value)}
          className="field-input"
          required
        >
          {config.serviceTypes.map((service) => (
            <option key={service.key} value={service.key}>
              {service.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Preferred time">
        <select
          value={scheduledStart}
          onChange={(event) => setScheduledStart(event.target.value)}
          className="field-input"
          required
        >
          {config.slots.map((slot) => (
            <option key={slot} value={slot}>
              {new Date(slot).toLocaleString()}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Your name">
        <input
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          className="field-input"
          required
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          className="field-input"
          required
        />
      </Field>

      <Field label="Phone">
        <input
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          className="field-input"
        />
      </Field>

      <Field label="Property address">
        <input
          value={customerAddress}
          onChange={(event) => setCustomerAddress(event.target.value)}
          className="field-input"
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="field-input"
        />
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-[var(--urgent)]">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-[var(--text-primary)]">{message}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Request booking'}
      </button>
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
