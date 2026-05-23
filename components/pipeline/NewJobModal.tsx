'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { BoardColumnView } from '@/lib/domain/board/getBoard';

const JOB_TYPES = ['maintenance', 'install', 'hardscape', 'cleanup', 'irrigation', 'other'] as const;

export type NewJobFormValues = {
  title: string;
  customerName: string;
  customerAddress: string;
  jobType: string;
  columnId: string;
};

export function NewJobModal({
  columns,
  defaultColumnId,
  pending = false,
  error = null,
  onClose,
  onSubmit,
}: {
  columns: BoardColumnView[];
  defaultColumnId?: string;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: NewJobFormValues, openAfterCreate: boolean) => void | Promise<void>;
}) {
  const selectableColumns = useMemo(
    () => columns.filter((column) => column.stateKey !== 'archived'),
    [columns],
  );

  const defaultColumn =
    selectableColumns.find((column) => column.id === defaultColumnId) ??
    selectableColumns.find((column) => column.stateKey === 'inquiry') ??
    selectableColumns[0];

  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [jobType, setJobType] = useState('');
  const [columnId, setColumnId] = useState(defaultColumn?.id ?? '');

  useEffect(() => {
    setColumnId(defaultColumn?.id ?? '');
  }, [defaultColumn?.id]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) {
        onClose();
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose, pending]);

  const canSubmit = title.trim().length > 0 && columnId.length > 0;

  const submit = (openAfterCreate: boolean) => {
    if (!canSubmit) return;
    void onSubmit(
      {
        title: title.trim(),
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        jobType,
        columnId,
      },
      openAfterCreate,
    );
  };

  return (
    <div className="ops-modal-overlay" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-job-modal-title"
        className="ops-modal max-w-lg"
      >
        <h2 id="new-job-modal-title" className="ops-modal-title">
          New job
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Create a job on the pipeline. Customer details are optional.
        </p>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit(false);
          }}
        >
          <Field label="Job title" required>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              autoFocus
              aria-label="Job title"
              className="field-input"
              placeholder="Weekly maintenance — Oak St"
            />
          </Field>

          <Field label="Customer name">
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              aria-label="Customer name"
              className="field-input"
              placeholder="Jane Smith"
            />
          </Field>

          <Field label="Property address">
            <input
              value={customerAddress}
              onChange={(event) => setCustomerAddress(event.target.value)}
              aria-label="Property address"
              className="field-input"
              placeholder="123 Oak Street"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job type">
              <select
                value={jobType}
                onChange={(event) => setJobType(event.target.value)}
                aria-label="Job type"
                className="field-input"
              >
                <option value="">Select type</option>
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Starting column">
              <select
                value={columnId}
                onChange={(event) => setColumnId(event.target.value)}
                aria-label="Starting column"
                className="field-input"
                required
              >
                {selectableColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {error ? (
            <p role="alert" className="ops-alert-error text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" disabled={pending} onClick={onClose} className="ops-btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || pending}
              className="ops-btn-primary"
            >
              {pending ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              disabled={!canSubmit || pending}
              onClick={() => submit(true)}
              className="ops-btn-accent-outline"
            >
              {pending ? 'Creating…' : 'Create + open'}
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
