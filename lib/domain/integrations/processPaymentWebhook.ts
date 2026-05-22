import type { SupabaseClient } from '@supabase/supabase-js';

import type { WebhookEvent } from '@/lib/integrations/types';
import { logActivity } from '@/lib/domain/activities/logActivity';
import { roundMoney } from '@/lib/domain/money/moneyMath';
import { settleInvoicePayment } from '@/lib/domain/money/settleInvoice';

export type ProcessWebhookResult =
  | { status: 'processed'; invoiceId: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string };

export async function getIntegrationEvent(
  client: SupabaseClient,
  organizationId: string,
  provider: string,
  externalId: string,
) {
  const { data } = await client
    .from('integration_events')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .eq('external_id', externalId)
    .maybeSingle();

  return data;
}

export async function insertIntegrationEvent(
  client: SupabaseClient,
  params: {
    organizationId: string;
    provider: string;
    eventType: string;
    externalId: string;
    payload: unknown;
    cardId?: string;
    invoiceId?: string;
    processStatus?: 'pending' | 'processed' | 'failed' | 'skipped';
    errorMessage?: string;
  },
) {
  const { data, error } = await client
    .from('integration_events')
    .insert({
      organization_id: params.organizationId,
      provider: params.provider,
      event_type: params.eventType,
      external_id: params.externalId,
      payload_json: params.payload as Record<string, unknown>,
      card_id: params.cardId ?? null,
      invoice_id: params.invoiceId ?? null,
      process_status: params.processStatus ?? 'pending',
      error_message: params.errorMessage ?? null,
      processed_at: params.processStatus === 'processed' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

export async function markIntegrationEvent(
  client: SupabaseClient,
  organizationId: string,
  provider: string,
  externalId: string,
  status: 'processed' | 'failed' | 'skipped',
  errorMessage?: string,
) {
  await client
    .from('integration_events')
    .update({
      process_status: status,
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .eq('external_id', externalId);
}

export async function processPaymentWebhook(
  client: SupabaseClient,
  event: WebhookEvent,
): Promise<ProcessWebhookResult> {
  const existing = await getIntegrationEvent(
    client,
    event.organizationId,
    event.provider,
    event.externalId,
  );

  if (existing?.process_status === 'processed' || existing?.process_status === 'skipped') {
    return { status: 'skipped', reason: 'Already processed.' };
  }

  if (!existing) {
    await insertIntegrationEvent(client, {
      organizationId: event.organizationId,
      provider: event.provider,
      eventType: event.eventType,
      externalId: event.externalId,
      payload: event.raw,
      cardId: event.cardId,
      invoiceId: event.invoiceId,
      processStatus: 'pending',
    });
  }

  if (event.eventType === 'payment.failed') {
    await markIntegrationEvent(
      client,
      event.organizationId,
      event.provider,
      event.externalId,
      'processed',
    );

    await logActivity(client, {
      organizationId: event.organizationId,
      actorId: null,
      entityType: 'invoice',
      entityId: event.invoiceId,
      action: 'payment.failed',
      summary: 'Online payment attempt failed or expired.',
      metadata: { provider: event.provider, external_id: event.externalId },
    });

    await client
      .from('payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('organization_id', event.organizationId)
      .eq('provider', event.provider)
      .eq('external_id', event.externalId);

    return { status: 'processed', invoiceId: event.invoiceId };
  }

  const { data: invoice, error: invoiceError } = await client
    .from('invoices')
    .select('id, card_id, total, balance_due, status')
    .eq('id', event.invoiceId)
    .eq('organization_id', event.organizationId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    await markIntegrationEvent(
      client,
      event.organizationId,
      event.provider,
      event.externalId,
      'failed',
      'Invoice not found.',
    );
    return { status: 'failed', reason: 'Invoice not found.' };
  }

  if (invoice.card_id !== event.cardId) {
    await markIntegrationEvent(
      client,
      event.organizationId,
      event.provider,
      event.externalId,
      'failed',
      'Invoice/card mismatch.',
    );
    return { status: 'failed', reason: 'Invoice/card mismatch.' };
  }

  const expected = roundMoney(Number(invoice.balance_due));
  if (roundMoney(event.amount) !== expected) {
    await markIntegrationEvent(
      client,
      event.organizationId,
      event.provider,
      event.externalId,
      'failed',
      `Amount mismatch: expected ${expected}, got ${event.amount}`,
    );
    return { status: 'failed', reason: 'Amount mismatch.' };
  }

  await settleInvoicePayment(client, {
    organizationId: event.organizationId,
    invoiceId: event.invoiceId,
    actorId: null,
    method: event.provider,
    skipRoleCheck: true,
  });

  await client
    .from('payments')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('organization_id', event.organizationId)
    .eq('provider', event.provider)
    .eq('external_id', event.externalId);

  await markIntegrationEvent(
    client,
    event.organizationId,
    event.provider,
    event.externalId,
    'processed',
  );

  return { status: 'processed', invoiceId: event.invoiceId };
}
