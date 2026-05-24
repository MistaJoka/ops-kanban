'use client';

import { useState } from 'react';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { useSettingsMessageTemplates } from '@/components/settings/hooks/useSettingsHooks';

export default function MessageTemplatesPage() {
  const templates = useSettingsMessageTemplates();
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    templates.setError(null);

    try {
      await templates.create({
        name,
        channel,
        subject: channel === 'email' ? subject : undefined,
        body,
        variables: ['customer_name', 'job_title', 'scheduled_date', 'organization_name'],
      });
      setName('');
      setSubject('');
      setBody('');
    } catch (createError) {
      templates.setError(
        createError instanceof Error ? createError.message : 'Failed to create template.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ops-page-shell max-w-3xl">
      <SettingsPageHeader
        title="Message templates"
        description="Reusable SMS and email copy. Use {{customer_name}}, {{job_title}}, {{scheduled_date}}."
      />

      {templates.error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {templates.error}
        </p>
      ) : null}

      <form onSubmit={(event) => void create(event)} className="ops-section-card mt-8 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">New template</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Template name"
          className="field-input"
          required
        />
        <select
          value={channel}
          onChange={(event) => setChannel(event.target.value as 'sms' | 'email')}
          className="field-input"
        >
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </select>
        {channel === 'email' ? (
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            className="field-input"
          />
        ) : null}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          placeholder="Use {{customer_name}}, {{job_title}}, {{scheduled_date}}"
          className="field-input"
          required
        />
        <button type="submit" disabled={saving} className="ops-btn-primary">
          {saving ? 'Saving…' : 'Add template'}
        </button>
      </form>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Saved templates</h2>
        {templates.loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : templates.items.length === 0 ? (
          <p className="ops-empty-state">No templates yet.</p>
        ) : (
          templates.items.map((template) => (
            <article key={template.id} className="ops-section-card">
              <p className="font-medium text-[var(--text-primary)]">
                {template.name}{' '}
                <span className="ops-badge ml-1 normal-case">{template.channel}</span>
              </p>
              {template.subject ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Subject: {template.subject}
                </p>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                {template.body}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
