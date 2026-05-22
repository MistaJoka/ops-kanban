'use client';

import { useState } from 'react';

export function PortalPayActions({
  token,
  canPay,
  balanceDue,
  paymentUrl,
  invoiceStatus,
}: {
  token: string;
  canPay: boolean;
  balanceDue: number;
  paymentUrl: string | null;
  invoiceStatus: string;
}) {
  const [url, setUrl] = useState<string | null>(paymentUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!canPay || invoiceStatus === 'paid' || balanceDue <= 0) {
    if (invoiceStatus === 'paid') {
      return <p className="mt-4 text-sm font-medium text-[var(--success)]">This invoice is paid in full.</p>;
    }
    return null;
  }

  const createLink = async () => {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/portal/${token}/payment-link`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Could not create payment link.');
      }
      setUrl(payload.data?.paymentUrl ?? null);
      setMessage('Payment link ready.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create payment link.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <p className="text-lg font-semibold">Balance due: ${balanceDue.toFixed(2)}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Pay now
        </a>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => void createLink()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Preparing…' : 'Get payment link'}
        </button>
      )}
      {message ? <p className="text-sm text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
