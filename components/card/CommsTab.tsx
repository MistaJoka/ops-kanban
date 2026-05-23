'use client';

import { useEffect, useState } from 'react';

import type { MessageView } from '@/lib/domain/comms/messages';

type TemplateOption = {
  id: string;
  name: string;
  channel: 'sms' | 'email';
};

export function CommsTab({
  cardId,
  canManage,
  twilioEnabled,
  resendEnabled,
}: {
  cardId: string;
  canManage: boolean;
  twilioEnabled: boolean;
  resendEnabled: boolean;
}) {
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [messagesResponse, templatesResponse] = await Promise.all([
      fetch(`/api/cards/${cardId}/messages`),
      fetch('/api/message-templates'),
    ]);
    const messagesPayload = await messagesResponse.json();
    const templatesPayload = await templatesResponse.json();
    if (messagesPayload.data) setMessages(messagesPayload.data);
    if (templatesPayload.data) setTemplates(templatesPayload.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [cardId]);

  const send = async () => {
    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards/${cardId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          body: body.trim() || undefined,
          subject: subject.trim() || undefined,
          templateId: templateId || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Send failed.');
      }

      setBody('');
      setSubject('');
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Send failed.');
    } finally {
      setSending(false);
    }
  };

  const channelEnabled = channel === 'sms' ? twilioEnabled : resendEnabled;
  const filteredTemplates = templates.filter((template) => template.channel === channel);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Communications</h3>
        <p className="text-sm text-[var(--text-secondary)]">SMS and email thread for this job.</p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading thread…</p>
      ) : messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--topbar-border)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          No messages yet.
        </p>
      ) : (
        <div className="space-y-2">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-xl border px-3 py-2 text-sm ${
                message.direction === 'inbound'
                  ? 'border-[var(--topbar-border)] bg-[var(--surface-rail)]'
                  : 'border-[var(--accent)]/30 bg-white'
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                {message.channel} · {message.direction} ·{' '}
                {new Date(message.createdAt).toLocaleString()}
              </p>
              {message.subject ? (
                <p className="mt-1 font-medium text-[var(--text-primary)]">{message.subject}</p>
              ) : null}
              <p className="mt-1 text-[var(--text-primary)]">{message.body}</p>
            </article>
          ))}
        </div>
      )}

      {canManage ? (
        <div className="rounded-xl border border-[var(--topbar-border)] p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                channel === 'sms'
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--topbar-border)]'
              }`}
            >
              SMS
            </button>
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                channel === 'email'
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--topbar-border)]'
              }`}
            >
              Email
            </button>
          </div>

          {!channelEnabled ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {channel === 'sms' ? 'Twilio' : 'Resend'} is not configured. Check Settings →
              Integrations.
            </p>
          ) : (
            <>
              {filteredTemplates.length > 0 ? (
                <select
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                  className="field-input mt-3"
                >
                  <option value="">No template</option>
                  {filteredTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              ) : null}

              {channel === 'email' ? (
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                  className="field-input mt-3"
                />
              ) : null}

              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={4}
                placeholder={templateId ? 'Optional override text' : 'Message body'}
                className="field-input mt-3"
              />

              {error ? (
                <p role="alert" className="mt-2 text-sm text-[var(--urgent)]">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={sending || (!body.trim() && !templateId)}
                onClick={() => void send()}
                className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {sending ? 'Sending…' : `Send ${channel}`}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
