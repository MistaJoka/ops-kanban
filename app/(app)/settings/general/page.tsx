'use client';

import { useEffect, useState } from 'react';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { cn } from '@/lib/utils';

type OrgSettings = {
  name: string;
  pipelineMode: 'compact' | 'full';
  role: string;
};

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);

  const canEdit = settings ? settings.role === 'owner' || settings.role === 'manager' : false;

  const load = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch('/api/settings/organization');
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? 'Failed to load settings.');
      setLoading(false);
      return;
    }
    setSettings(payload.data);
    setName(payload.data.name);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveName = async () => {
    if (!canEdit || !name.trim()) {
      setError('Organization name is required.');
      return;
    }
    setSavingName(true);
    setError(null);
    setNameSaved(false);
    const response = await fetch('/api/settings/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? 'Failed to save organization name.');
      setSavingName(false);
      return;
    }
    setSettings(payload.data);
    setName(payload.data.name);
    setNameSaved(true);
    setSavingName(false);
  };

  const setPipelineMode = async (pipelineMode: 'compact' | 'full') => {
    if (!canEdit || settings?.pipelineMode === pipelineMode) return;
    setSavingMode(true);
    setError(null);
    const response = await fetch('/api/settings/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipelineMode }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? 'Failed to update pipeline mode.');
      setSavingMode(false);
      return;
    }
    setSettings(payload.data);
    setSavingMode(false);
  };

  return (
    <div className="ops-page-shell max-w-3xl">
      <SettingsPageHeader
        title="General"
        description="Organization identity and how your job pipeline is displayed on the board."
      />

      {error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {error}
        </p>
      ) : null}

      {loading || !settings ? (
        <p className="mt-8 text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : (
        <div className="mt-8 space-y-6">
          {!canEdit ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Your role can view these settings but only owners and managers can change them.
            </p>
          ) : null}

          <section className="ops-section-card space-y-4">
            <div>
              <p className="ops-field-label">Organization name</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Shown on customer-facing messages and booking pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameSaved(false);
                }}
                disabled={!canEdit || savingName}
                className="field-input min-w-[200px] flex-1"
                placeholder="Your company name"
              />
              {canEdit ? (
                <button
                  type="button"
                  disabled={savingName || name.trim() === settings.name}
                  onClick={() => void saveName()}
                  className="ops-btn-primary"
                >
                  {savingName ? 'Saving…' : 'Save'}
                </button>
              ) : null}
            </div>
            {nameSaved ? (
              <p className="text-xs font-medium text-[var(--paid)]">Organization name saved.</p>
            ) : null}
          </section>

          <section className="ops-section-card space-y-4">
            <div>
              <p className="ops-field-label">Pipeline mode</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                <strong>Compact (9 columns)</strong> — landscaping MVP stages from inquiry through
                archived. <strong>Full (19 columns)</strong> — detailed production and billing
                stages; adds missing columns to your board automatically.
              </p>
            </div>
            <div
              className="inline-flex rounded-lg border p-1"
              style={{ borderColor: 'var(--topbar-border)' }}
              role="group"
              aria-label="Pipeline mode"
            >
              {(['compact', 'full'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={!canEdit || savingMode}
                  onClick={() => void setPipelineMode(mode)}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    settings.pipelineMode === mode
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  )}
                >
                  {mode === 'compact' ? 'Compact (9)' : 'Full (19)'}
                </button>
              ))}
            </div>
            {savingMode ? (
              <p className="text-xs text-[var(--text-secondary)]">Updating pipeline…</p>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
