'use client';

import { useEffect, useState } from 'react';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';

type Template = {
  id: string;
  name: string;
  channel: 'sms' | 'email';
  subject: string | null;
  body: string;
};

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const response = await fetch('/api/message-templates');
    const payload = await response.json();
    if (payload.data) {
      setTemplates(payload.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/message-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          channel,
          subject: channel === 'email' ? subject : undefined,
          body,
          variables: ['customer_name', 'job_title', 'scheduled_date', 'organization_name'],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to create template.');
      }

      setName('');
      setSubject('');
      setBody('');
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create template.');
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

      {error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {error}
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
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="ops-empty-state">No templates yet.</p>
        ) : (
          templates.map((template) => (
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
