'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function CustomerCreateModal({
  pending = false,
  error = null,
  onClose,
  onSubmit,
}: {
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  }) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) {
        onClose();
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose, pending]);

  const canSubmit = name.trim().length > 0;

  return (
    <div className="ops-modal-overlay" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-create-modal-title"
        className="ops-modal max-w-lg"
      >
        <h2 id="customer-create-modal-title" className="ops-modal-title">
          New customer
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Add a property owner record for future jobs.
        </p>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            void onSubmit({
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim(),
              address: address.trim(),
              notes: notes.trim(),
            });
          }}
        >
          <Field label="Customer name" required>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
              aria-label="Customer name"
              className="field-input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-label="Phone"
                className="field-input"
              />
            </Field>
            <Field label="Email">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                aria-label="Email"
                className="field-input"
              />
            </Field>
          </div>

          <Field label="Address">
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              aria-label="Address"
              className="field-input"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              aria-label="Notes"
              className="field-input"
            />
          </Field>

          {error ? (
            <p role="alert" className="ops-alert-error text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={pending} onClick={onClose} className="ops-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit || pending} className="ops-btn-primary">
              {pending ? 'Creating…' : 'Create customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="ops-field-label">
        {label}
        {required ? <span className="text-[var(--urgent)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
