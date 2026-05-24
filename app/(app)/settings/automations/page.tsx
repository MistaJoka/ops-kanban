'use client';

import { useMemo, useState } from 'react';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import {
  useSettingsAutomations,
  useSettingsMessageTemplates,
} from '@/components/settings/hooks/useSettingsHooks';

export default function AutomationsSettingsPage() {
  const automations = useSettingsAutomations();
  const templates = useSettingsMessageTemplates();
  const loading = automations.loading || templates.loading;

  const smsTemplates = useMemo(
    () => templates.items.filter((template) => template.channel === 'sms'),
    [templates.items],
  );

  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'column_enter' | 'invoice_paid'>('column_enter');
  const [triggerStateKey, setTriggerStateKey] = useState('scheduled');
  const [actionType, setActionType] = useState<
    'log_activity' | 'set_next_action' | 'send_sms_template' | 'send_review_request'
  >('log_activity');
  const [actionSummary, setActionSummary] = useState('Automation ran for this job.');
  const [nextActionText, setNextActionText] = useState('Follow up with customer.');
  const [templateId, setTemplateId] = useState('');
  const [reviewUrl, setReviewUrl] = useState('https://g.page/r/your-business/review');
  const [saving, setSaving] = useState(false);

  const error = automations.error ?? templates.error;
  const setError = (message: string | null) => {
    automations.setError(message);
    templates.setError(null);
  };

  const create = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    let actionConfig: Record<string, unknown> = {};
    if (actionType === 'log_activity') {
      actionConfig = { summary: actionSummary.trim() };
    } else if (actionType === 'set_next_action') {
      actionConfig = { text: nextActionText.trim() };
    } else if (actionType === 'send_sms_template') {
      if (!templateId) {
        setError('Select an SMS template.');
        setSaving(false);
        return;
      }
      actionConfig = { templateId };
    } else {
      actionConfig = { reviewUrl: reviewUrl.trim() };
    }

    try {
      await automations.create({
        name: name.trim(),
        triggerType,
        triggerStateKey: triggerType === 'column_enter' ? triggerStateKey : null,
        actionType,
        actionConfig,
      });
      setName('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create automation.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await automations.remove(id);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Failed to delete automation.');
    }
  };

  return (
    <div className="ops-page-shell max-w-3xl">
      <SettingsPageHeader
        title="Automations"
        description="Column triggers, invoice-paid follow-ups, SMS templates, and review requests."
      />

      {error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {error}
        </p>
      ) : null}

      <section className="ops-section-card mt-8">
        <h2 className="font-semibold text-[var(--text-primary)]">New automation</h2>
        <div className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Automation name"
            className="field-input w-full"
          />
          <select
            value={triggerType}
            onChange={(event) =>
              setTriggerType(event.target.value as 'column_enter' | 'invoice_paid')
            }
            className="field-input w-full"
          >
            <option value="column_enter">When card enters column</option>
            <option value="invoice_paid">When invoice is paid</option>
          </select>
          {triggerType === 'column_enter' ? (
            <select
              value={triggerStateKey}
              onChange={(event) => setTriggerStateKey(event.target.value)}
              className="field-input w-full"
            >
              <option value="scheduled">Scheduled</option>
              <option value="on_site">On site</option>
              <option value="complete">Complete</option>
              <option value="archived">Archived</option>
              <option value="paid">Paid</option>
            </select>
          ) : null}
          <select
            value={actionType}
            onChange={(event) =>
              setActionType(
                event.target.value as
                  | 'log_activity'
                  | 'set_next_action'
                  | 'send_sms_template'
                  | 'send_review_request',
              )
            }
            className="field-input w-full"
          >
            <option value="log_activity">Log activity</option>
            <option value="set_next_action">Set next action</option>
            <option value="send_sms_template">Send SMS template</option>
            <option value="send_review_request">Send review request SMS</option>
          </select>
          {actionType === 'log_activity' ? (
            <input
              value={actionSummary}
              onChange={(event) => setActionSummary(event.target.value)}
              placeholder="Activity log message"
              className="field-input w-full"
            />
          ) : null}
          {actionType === 'set_next_action' ? (
            <input
              value={nextActionText}
              onChange={(event) => setNextActionText(event.target.value)}
              placeholder="Next action text"
              className="field-input w-full"
            />
          ) : null}
          {actionType === 'send_sms_template' ? (
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="field-input w-full"
            >
              <option value="">Select SMS template</option>
              {smsTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          ) : null}
          {actionType === 'send_review_request' ? (
            <input
              value={reviewUrl}
              onChange={(event) => setReviewUrl(event.target.value)}
              placeholder="Google review URL"
              className="field-input w-full"
            />
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void create()}
            className="ops-btn-primary"
          >
            {saving ? 'Saving…' : 'Create automation'}
          </button>
        </div>
      </section>

      <section className="ops-section-card mt-6">
        <h2 className="font-semibold text-[var(--text-primary)]">Active rules</h2>
        {loading ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : automations.items.length ? (
          <ul className="mt-4 space-y-3">
            {automations.items.map((automation) => (
              <li
                key={automation.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
                style={{ borderColor: 'var(--topbar-border)' }}
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{automation.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {automation.triggerType === 'invoice_paid'
                      ? 'On invoice paid'
                      : `Enter ${automation.triggerStateKey ?? 'column'}`}{' '}
                    → {automation.actionType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(automation.id)}
                  className="text-sm font-medium text-[var(--urgent)]"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">No automations yet.</p>
        )}
      </section>
    </div>
  );
}
