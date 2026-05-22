import type { SupabaseClient } from '@supabase/supabase-js';

export type MessageTemplateView = {
  id: string;
  name: string;
  channel: 'sms' | 'email';
  subject: string | null;
  body: string;
  variables: string[];
};

export async function listMessageTemplates(
  client: SupabaseClient,
  organizationId: string,
  channel?: 'sms' | 'email',
): Promise<MessageTemplateView[]> {
  let query = client
    .from('message_templates')
    .select('id, name, channel, subject, body, variables')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (channel) {
    query = query.eq('channel', channel);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapTemplate);
}

export async function createMessageTemplate(
  client: SupabaseClient,
  organizationId: string,
  input: {
    name: string;
    channel: 'sms' | 'email';
    subject?: string | null;
    body: string;
    variables?: string[];
  },
): Promise<MessageTemplateView> {
  const { data, error } = await client
    .from('message_templates')
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      channel: input.channel,
      subject: input.subject?.trim() || null,
      body: input.body.trim(),
      variables: input.variables ?? [],
    })
    .select('id, name, channel, subject, body, variables')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create template.');
  }

  return mapTemplate(data);
}

export async function getMessageTemplate(
  client: SupabaseClient,
  organizationId: string,
  templateId: string,
): Promise<MessageTemplateView | null> {
  const { data, error } = await client
    .from('message_templates')
    .select('id, name, channel, subject, body, variables')
    .eq('organization_id', organizationId)
    .eq('id', templateId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapTemplate(data);
}

function mapTemplate(row: {
  id: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: unknown;
}): MessageTemplateView {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel as 'sms' | 'email',
    subject: row.subject,
    body: row.body,
    variables: Array.isArray(row.variables) ? (row.variables as string[]) : [],
  };
}

export function renderTemplate(
  body: string,
  subject: string | null,
  vars: Record<string, string>,
): { body: string; subject: string | null } {
  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);

  return {
    body: replace(body),
    subject: subject ? replace(subject) : null,
  };
}

export function buildTemplateVars(input: {
  customerName?: string | null;
  jobTitle?: string | null;
  scheduledDate?: string | null;
  organizationName?: string | null;
}): Record<string, string> {
  return {
    customer_name: input.customerName ?? 'there',
    job_title: input.jobTitle ?? 'your project',
    scheduled_date: input.scheduledDate
      ? new Date(input.scheduledDate).toLocaleDateString()
      : 'your scheduled date',
    organization_name: input.organizationName ?? 'our team',
  };
}
