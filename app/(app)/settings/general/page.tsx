'use client';

import { useEffect, useState } from 'react';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { DevWorkspaceSection } from '@/components/settings/DevWorkspaceSection';
import {
  useSettingsAiMemory,
  useSettingsOrganization,
} from '@/components/settings/hooks/useSettingsHooks';
import { cn } from '@/lib/utils';

export default function GeneralSettingsPage() {
  const org = useSettingsOrganization();
  const aiMemory = useSettingsAiMemory();
  const [name, setName] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [savingVoice, setSavingVoice] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);

  useEffect(() => {
    if (org.data) setName(org.data.name);
  }, [org.data]);

  useEffect(() => {
    if (aiMemory.data) setBrandVoice(aiMemory.data.brandVoice);
  }, [aiMemory.data]);

  const canEdit = org.data ? org.data.role === 'owner' || org.data.role === 'manager' : false;
  const error = org.error ?? aiMemory.error;
  const loading = org.loading || aiMemory.loading;

  const saveName = async () => {
    if (!canEdit || !name.trim()) {
      org.setError('Organization name is required.');
      return;
    }
    setSavingName(true);
    org.setError(null);
    setNameSaved(false);
    try {
      await org.save({ name: name.trim() });
      setNameSaved(true);
    } catch (saveError) {
      org.setError(saveError instanceof Error ? saveError.message : 'Failed to save.');
    } finally {
      setSavingName(false);
    }
  };

  const setPipelineMode = async (pipelineMode: 'compact' | 'full') => {
    if (!canEdit || org.data?.pipelineMode === pipelineMode) return;
    setSavingMode(true);
    org.setError(null);
    try {
      await org.save({ pipelineMode });
    } catch (saveError) {
      org.setError(saveError instanceof Error ? saveError.message : 'Failed to update pipeline mode.');
    } finally {
      setSavingMode(false);
    }
  };

  const saveBrandVoice = async () => {
    if (!canEdit) return;
    setSavingVoice(true);
    aiMemory.setError(null);
    setVoiceSaved(false);
    try {
      await aiMemory.save({ brandVoice });
      setVoiceSaved(true);
    } catch (saveError) {
      aiMemory.setError(saveError instanceof Error ? saveError.message : 'Failed to save brand voice.');
    } finally {
      setSavingVoice(false);
    }
  };

  return (
    <div className="ops-page-shell max-w-3xl">
      <SettingsPageHeader
        title="General"
        description="Organization identity, pipeline display, and AI brand voice."
      />

      {error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {error}
        </p>
      ) : null}

      {loading || !org.data ? (
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
                  disabled={savingName || name.trim() === org.data.name}
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
                    org.data?.pipelineMode === mode
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

          <section className="ops-section-card space-y-4">
            <div>
              <p className="ops-field-label">AI brand voice</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Tone guidance for customer-facing AI drafts. Do not include customer names, phone
                numbers, or other PII.
              </p>
            </div>
            <textarea
              value={brandVoice}
              onChange={(event) => {
                setBrandVoice(event.target.value);
                setVoiceSaved(false);
              }}
              disabled={!canEdit || savingVoice}
              rows={4}
              className="field-input w-full resize-y"
              placeholder="Friendly, professional, local lawn-care expert. Use plain language."
            />
            {canEdit ? (
              <button
                type="button"
                disabled={savingVoice}
                onClick={() => void saveBrandVoice()}
                className="ops-btn-primary"
              >
                {savingVoice ? 'Saving…' : 'Save brand voice'}
              </button>
            ) : null}
            {voiceSaved ? (
              <p className="text-xs font-medium text-[var(--paid)]">Brand voice saved.</p>
            ) : null}
          </section>

          <DevWorkspaceSection />
        </div>
      )}
    </div>
  );
}
