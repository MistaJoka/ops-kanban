'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { useSettingsContracts } from '@/components/settings/hooks/useSettingsHooks';

export default function ContractsSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="ops-page-shell">
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        </div>
      }
    >
      <ContractsSettingsContent />
    </Suspense>
  );
}

function ContractsSettingsContent() {
  const searchParams = useSearchParams();
  const contracts = useSettingsContracts();

  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'seasonal'>(
    'monthly',
  );
  const [nextRunAt, setNextRunAt] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const presetCustomerId = searchParams.get('customerId');
    if (presetCustomerId) {
      setCustomerId(presetCustomerId);
    }
  }, [searchParams]);

  const runDue = async () => {
    setSaving(true);
    contracts.setError(null);
    try {
      await contracts.postAction('/api/contracts/run-due');
    } catch (runError) {
      contracts.setError(
        runError instanceof Error ? runError.message : 'Failed to run due contracts.',
      );
    } finally {
      setSaving(false);
    }
  };

  const create = async () => {
    if (!customerId.trim() || !title.trim() || !nextRunAt) {
      contracts.setError('Customer, title, and next run date are required.');
      return;
    }

    setSaving(true);
    contracts.setError(null);

    try {
      await contracts.create({
        customerId: customerId.trim(),
        title: title.trim(),
        frequency,
        nextRunAt: new Date(nextRunAt).toISOString(),
        amount: amount ? Number(amount) : null,
      });
      setCustomerId('');
      setTitle('');
      setNextRunAt('');
      setAmount('');
    } catch (createError) {
      contracts.setError(
        createError instanceof Error ? createError.message : 'Failed to create contract.',
      );
    } finally {
      setSaving(false);
    }
  };

  const generate = async (id: string) => {
    try {
      await contracts.postAction(`/api/contracts/${id}/generate`);
    } catch (generateError) {
      contracts.setError(
        generateError instanceof Error ? generateError.message : 'Failed to generate job.',
      );
    }
  };

  return (
    <div className="ops-page-shell max-w-3xl">
      <SettingsPageHeader
        title="Recurring contracts"
        description="Maintenance routes that spawn new pipeline cards on schedule."
        actions={
          <button
            type="button"
            disabled={saving}
            onClick={() => void runDue()}
            className="ops-btn-secondary"
          >
            Run due contracts
          </button>
        }
      />

      {contracts.error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {contracts.error}
        </p>
      ) : null}

      <section className="ops-section-card mt-8">
        <h2 className="font-semibold text-[var(--text-primary)]">New contract</h2>
        <div className="mt-4 space-y-3">
          <input
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            placeholder="Customer ID (UUID from card)"
            className="field-input w-full"
          />
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contract title"
            className="field-input w-full"
          />
          <select
            value={frequency}
            onChange={(event) =>
              setFrequency(event.target.value as 'weekly' | 'biweekly' | 'monthly' | 'seasonal')
            }
            className="field-input w-full"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="seasonal">Seasonal (quarterly)</option>
          </select>
          <input
            type="datetime-local"
            value={nextRunAt}
            onChange={(event) => setNextRunAt(event.target.value)}
            className="field-input w-full"
          />
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount (optional)"
            className="field-input w-full"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void create()}
            className="ops-btn-primary"
          >
            {saving ? 'Saving…' : 'Create contract'}
          </button>
        </div>
      </section>

      <section className="ops-section-card mt-6">
        <h2 className="font-semibold text-[var(--text-primary)]">Active contracts</h2>
        {contracts.loading ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : contracts.items.length ? (
          <ul className="mt-4 space-y-3">
            {contracts.items.map((contract) => (
              <li
                key={contract.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
                style={{ borderColor: 'var(--topbar-border)' }}
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{contract.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {contract.customerName} · {contract.frequency} · next{' '}
                    {new Date(contract.nextRunAt).toLocaleDateString()}
                  </p>
                  {contract.lastCardId ? (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Last job: {contract.lastCardId}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void generate(contract.id)}
                  className="ops-btn-secondary shrink-0"
                >
                  Generate job
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">No contracts yet.</p>
        )}
      </section>
    </div>
  );
}
