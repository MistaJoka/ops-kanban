import type { SupabaseClient } from '@supabase/supabase-js';

export type MessageView = {
  id: string;
  cardId: string;
  channel: 'sms' | 'email';
  direction: 'inbound' | 'outbound';
  body: string;
  subject: string | null;
  provider: string;
  status: string;
  createdAt: string;
};

export async function listCardMessages(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<MessageView[]> {
  const { data, error } = await client
    .from('messages')
    .select('id, card_id, channel, direction, body, subject, provider, status, created_at')
    .eq('organization_id', organizationId)
    .eq('card_id', cardId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    cardId: row.card_id,
    channel: row.channel as 'sms' | 'email',
    direction: row.direction as 'inbound' | 'outbound',
    body: row.body,
    subject: row.subject,
    provider: row.provider,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function insertMessage(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    customerId?: string | null;
    channel: 'sms' | 'email';
    direction: 'inbound' | 'outbound';
    body: string;
    subject?: string | null;
    provider: string;
    externalId?: string | null;
    templateId?: string | null;
    status?: string;
  },
): Promise<MessageView> {
  const { data, error } = await client
    .from('messages')
    .insert({
      organization_id: params.organizationId,
      card_id: params.cardId,
      customer_id: params.customerId ?? null,
      channel: params.channel,
      direction: params.direction,
      body: params.body,
      subject: params.subject ?? null,
      provider: params.provider,
      external_id: params.externalId ?? null,
      template_id: params.templateId ?? null,
      status: params.status ?? (params.direction === 'inbound' ? 'received' : 'sent'),
    })
    .select('id, card_id, channel, direction, body, subject, provider, status, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to save message.');
  }

  return {
    id: data.id,
    cardId: data.card_id,
    channel: data.channel as 'sms' | 'email',
    direction: data.direction as 'inbound' | 'outbound',
    body: data.body,
    subject: data.subject,
    provider: data.provider,
    status: data.status,
    createdAt: data.created_at,
  };
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits;
}

export async function findCardByCustomerPhone(
  client: SupabaseClient,
  organizationId: string,
  phone: string,
): Promise<{ cardId: string; customerId: string } | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return null;
  }

  const { data: customers } = await client
    .from('customers')
    .select('id, phone')
    .eq('organization_id', organizationId)
    .not('phone', 'is', null);

  const match = (customers ?? []).find((customer) => {
    if (!customer.phone) return false;
    return normalizePhone(String(customer.phone)) === normalized;
  });

  if (!match) {
    return null;
  }

  const { data: card } = await client
    .from('cards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('customer_id', match.id)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!card) {
    return null;
  }

  return { cardId: card.id, customerId: match.id };
}
